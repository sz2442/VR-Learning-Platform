import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PointerLockControls, useGLTF, Text, Float, Stars, RoundedBox } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { XR, Controllers, Hands, VRButton, Interactive, useController, useXR } from '@react-three/xr';
import { useNavigate, useParams } from 'react-router-dom';
import * as THREE from 'three';
import { useAuthStore } from '@/stores/authStore';
import { quizApi } from '@/api/quiz';
import { coursesApi } from '@/api/courses';
import type { Question, SubmitAnswerResult, SessionStats, Course, VrQuizResult } from '@/types';
import { generateShapeTask, validateDragDrop } from '@/utils/TaskGenerator';
import type { DragDropTask, ShapeItem, DropZone } from '@/utils/TaskGenerator';
import { useQuizSocket } from '@/hooks/useQuizSocket';
import type { DifficultyUpdatedEvent } from '@/hooks/useQuizSocket';

// ─── constants ────────────────────────────────────────────────────────────────

const DEFAULT_MAX_QUESTIONS = 10;
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];
const WALK_SPEED = 5.0;
const SPRINT_SPEED = 15.0;

// ─── types ────────────────────────────────────────────────────────────────────

interface QuizStats {
  correct: number;
  total: number;
  streak: number;
}

// ─── GLBModel ─────────────────────────────────────────────────────────────────

export function GLBModel({
  url,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
}: {
  url: string;
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(url);
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          m.needsUpdate = true;
          if ('emissiveIntensity' in m) (m as THREE.MeshStandardMaterial).emissiveIntensity = 1;
        });
      }
    }
  });
  return <primitive object={scene} position={position} scale={scale} rotation={rotation} />;
}

useGLTF.preload('/models/Room.glb');

// ─── Scene ────────────────────────────────────────────────────────────────────

interface SceneProps {
  onLock: () => void;
  onUnlock: () => void;
  isXR: boolean;
}

function Scene({ onLock, onUnlock, isXR }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#dceeff', '#303030', 0.65]} />
      <directionalLight
        position={[3, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-4, 5, -2]} intensity={0.65} color="#c8e7ff" />
      <pointLight color="#ffffff" intensity={0.55} position={[-1.5, 1.8, -1]} />
      <pointLight color="#ffffff" intensity={0.4} position={[1.5, 1.4, -1]} />
      <Environment preset="city" background={false} />
      <Stars radius={60} depth={30} count={3000} factor={2} saturation={0} fade speed={0.6} />
      <GLBModel url="/models/Room.glb" position={[2, -1.75, 0]} scale={[1.5, 1.5, 1.5]} />
      {!isXR && <PointerLockControls onLock={onLock} onUnlock={onUnlock} />}
    </>
  );
}

// ─── Keyboard movement ────────────────────────────────────────────────────────

function useKeyboardMovement() {
  const state = useRef({
    forward: false, back: false, left: false, right: false,
    up: false, down: false, sprint: false,
  });

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': state.current.forward = true; break;
        case 's': state.current.back    = true; break;
        case 'a': state.current.left    = true; break;
        case 'd': state.current.right   = true; break;
        case 'arrowup':   state.current.up     = true; break;
        case 'arrowdown': state.current.down   = true; break;
        case 'shift':     state.current.sprint = true; break;
        default: return;
      }
      e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': state.current.forward = false; break;
        case 's': state.current.back    = false; break;
        case 'a': state.current.left    = false; break;
        case 'd': state.current.right   = false; break;
        case 'arrowup':   state.current.up     = false; break;
        case 'arrowdown': state.current.down   = false; break;
        case 'shift':     state.current.sprint = false; break;
        default: return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  return state.current;
}

function KeyboardLocomotion() {
  const { camera } = useThree();
  const moveState = useKeyboardMovement();
  const dir = useRef(new THREE.Vector3());
  const rgt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const { forward, back, left, right, up, down, sprint } = moveState;
    if (!forward && !back && !left && !right && !up && !down) return;

    const speed = sprint ? SPRINT_SPEED : WALK_SPEED;
    camera.getWorldDirection(dir.current);
    dir.current.y = 0;
    dir.current.normalize();
    rgt.current.copy(dir.current).cross(new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (forward) move.addScaledVector(dir.current,  1);
    if (back)    move.addScaledVector(dir.current, -1);
    if (left)    move.addScaledVector(rgt.current, -1);
    if (right)   move.addScaledVector(rgt.current,  1);
    if (move.lengthSq() > 0) { move.y = 0; move.normalize(); }
    if (up)   move.y += 1;
    if (down) move.y -= 1;

    camera.position.addScaledVector(move, speed * delta);
    camera.position.y = Math.max(0.5, Math.min(camera.position.y, 3.0));
  });

  return null;
}

function XRThumbstickDebugToggle({ onToggle }: { onToggle: () => void }) {
  const leftController  = useController('left');
  const rightController = useController('right');
  const bothPressedRef  = useRef(false);

  useFrame(() => {
    const leftButtons  = leftController?.inputSource?.gamepad?.buttons;
    const rightButtons = rightController?.inputSource?.gamepad?.buttons;
    // Thumbstick click is typically button index 3
    const leftPressed  = leftButtons?.[3]?.pressed ?? false;
    const rightPressed = rightButtons?.[3]?.pressed ?? false;
    const bothNow = leftPressed && rightPressed;
    if (bothNow && !bothPressedRef.current) onToggle();
    bothPressedRef.current = bothNow;
  });

  return null;
}

function XRSpawnPoint({ position }: { position: [number, number, number] }) {
  const { player, isPresenting } = useXR((s) => ({ player: s.player, isPresenting: s.isPresenting }));
  const applied = useRef(false);

  useEffect(() => {
    if (isPresenting && !applied.current) {
      player.position.set(position[0], position[1], position[2]);
      applied.current = true;
    }
    if (!isPresenting) {
      applied.current = false;
    }
  }, [isPresenting, player, position]);

  return null;
}

function XRLocomotion() {
  const { player, isPresenting } = useXR((s) => ({ player: s.player, isPresenting: s.isPresenting }));
  const leftController = useController('left');
  const camera = useThree((s) => s.camera);
  const dir = useRef(new THREE.Vector3());
  const rgt = useRef(new THREE.Vector3());
  const moveState = useKeyboardMovement();

  useFrame((_, delta) => {
    if (!isPresenting) return;

    const { forward, back, left, right, up, down, sprint } = moveState;
    const hasKbd = forward || back || left || right || up || down;

    const axes = leftController?.inputSource?.gamepad?.axes;
    const hasCtrl = axes != null && axes.length >= 4 &&
      (Math.abs(axes[2] ?? 0) > 0.25 || Math.abs(axes[3] ?? 0) > 0.25);

    if (!hasKbd && !hasCtrl) return;

    const speed = sprint ? SPRINT_SPEED : WALK_SPEED;
    camera.getWorldDirection(dir.current);
    dir.current.y = 0;
    dir.current.normalize();
    rgt.current.copy(dir.current).cross(new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (hasKbd) {
      if (forward) move.addScaledVector(dir.current,  1);
      if (back)    move.addScaledVector(dir.current, -1);
      if (left)    move.addScaledVector(rgt.current, -1);
      if (right)   move.addScaledVector(rgt.current,  1);
      if (move.lengthSq() > 0) { move.y = 0; move.normalize(); }
      if (up)   move.y += 1;
      if (down) move.y -= 1;
    } else if (hasCtrl && axes) {
      const ax = axes[2] ?? 0;
      const ay = axes[3] ?? 0;
      move.addScaledVector(dir.current, -ay);
      move.addScaledVector(rgt.current,  ax);
      if (move.lengthSq() === 0) return;
      move.normalize();
    }

    player.position.addScaledVector(move, speed * delta);
    player.position.y = Math.max(0.1, Math.min(player.position.y, 3.0));
  });

  return null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function difficultyLabel(level: number): string {
  if (level <= 3) return 'Easy';
  if (level <= 6) return 'Medium';
  return 'Hard';
}

// ─── PanelBg ──────────────────────────────────────────────────────────────────

function PanelBg({ width, height }: { width: number; height: number }) {
  return (
    <>
      {/* Teal glow border — bloom source */}
      <mesh position={[0, 0, -0.022]}>
        <planeGeometry args={[width + 0.01, height + 0.01]} />
        <meshStandardMaterial
          color="#00e5c8"
          emissive="#00e5c8"
          emissiveIntensity={0.9}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      {/* 3-D rounded panel body */}
      <RoundedBox args={[width, height, 0.03]} radius={0.025} smoothness={4} position={[0, 0, -0.015]}>
        <meshStandardMaterial color="#0b0f1a" metalness={0.15} roughness={0.75} />
      </RoundedBox>
    </>
  );
}

// ─── Shape3D ──────────────────────────────────────────────────────────────────

function Shape3D({
  item, position, onGrab, onSelectClick, isGrabbed, isPlaced, grabberPosRef,
}: {
  item: ShapeItem;
  position: [number, number, number];
  onGrab: (id: string) => void;
  onSelectClick: (id: string) => void;
  isGrabbed: boolean;
  isPlaced: boolean;
  grabberPosRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (isGrabbed && groupRef.current) {
      groupRef.current.position.copy(grabberPosRef.current);
    }
  });

  if (isPlaced) return null;

  return (
    <group ref={groupRef} position={isGrabbed ? undefined : position}>
      <Interactive
        onSelectStart={() => onGrab(item.id)}
        onSelect={() => onSelectClick(item.id)}
        onHover={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <mesh scale={isGrabbed ? 1.25 : 1}>
          {item.shape === 'triangle' && <coneGeometry args={[0.12, 0.2, 3]} />}
          {item.shape === 'square'   && <boxGeometry args={[0.18, 0.18, 0.04]} />}
          {item.shape === 'circle'   && <sphereGeometry args={[0.11, 16, 16]} />}
          <meshStandardMaterial
            color={hovered ? '#ffffff' : item.color}
            emissive={isGrabbed ? item.color : hovered ? item.color : '#000000'}
            emissiveIntensity={isGrabbed ? 0.5 : hovered ? 0.3 : 0}
          />
        </mesh>
      </Interactive>
      {isGrabbed && (
        <mesh position={[0, -0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.09, 0.13, 24]} />
          <meshStandardMaterial color="#ffff00" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

// ─── DropZone3D ───────────────────────────────────────────────────────────────

function DropZone3D({ zone, placedShapes, isActive, onSelect }: {
  zone: DropZone;
  placedShapes: ShapeItem[];
  isActive: boolean;
  onSelect: (zoneId: string) => void;
}) {
  const pos: [number, number, number] = [zone.position.x, zone.position.y, zone.position.z];
  const wireRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!wireRef.current) return;
    const mat = wireRef.current.material as THREE.MeshStandardMaterial;
    if (isActive) {
      const pulse = 0.5 + 0.45 * Math.sin(clock.elapsedTime * 5);
      mat.emissiveIntensity = pulse;
      mat.opacity = 0.18 + 0.32 * pulse;
    } else {
      mat.emissiveIntensity = 0;
      mat.opacity = 0.12;
    }
  });
  return (
    <group position={pos}>
      {/* platform */}
      <Interactive onSelect={() => onSelect(zone.id)}>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.38, 0.02, 0.38]} />
          <meshStandardMaterial
            color={isActive ? '#00e5c8' : '#1e293b'}
            transparent
            opacity={0.8}
            emissive={isActive ? '#00e5c8' : '#000000'}
            emissiveIntensity={isActive ? 0.6 : 0}
          />
        </mesh>
      </Interactive>
      {/* wireframe border — emissive teal, pulses when active */}
      <mesh ref={wireRef} position={[0, -0.04, 0]}>
        <boxGeometry args={[0.40, 0.015, 0.40]} />
        <meshStandardMaterial
          color="#00e5c8"
          emissive="#00e5c8"
          emissiveIntensity={0}
          transparent
          opacity={0.12}
          wireframe
        />
      </mesh>
      <Text position={[0, 0.08, 0]} fontSize={0.045} color={isActive ? '#00e5c8' : '#94a3b8'} anchorX="center">
        {zone.label}
      </Text>
      <Text position={[0, -0.07, 0]} fontSize={0.03} color="#64748b" anchorX="center">
        {`${placedShapes.length} placed`}
      </Text>
      {/* mini shapes on platform */}
      {placedShapes.map((shape, i) => {
        const x = (i - (placedShapes.length - 1) / 2) * 0.13;
        return (
          <mesh key={shape.id} position={[x, 0.04, 0]}>
            {shape.shape === 'triangle' && <coneGeometry args={[0.05, 0.08, 3]} />}
            {shape.shape === 'square'   && <boxGeometry args={[0.07, 0.07, 0.02]} />}
            {shape.shape === 'circle'   && <sphereGeometry args={[0.045, 12, 12]} />}
            <meshStandardMaterial color={shape.color} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── DragDropScene ────────────────────────────────────────────────────────────

function DragDropScene({ task, onComplete }: {
  task: DragDropTask;
  onComplete: (result: { correct: number; total: number; percentage: number }) => void;
}) {
  const [placements, setPlacements] = useState<Map<string, string>>(new Map());
  const [grabbedShapeId, setGrabbedShapeId] = useState<string | null>(null);

  // Refs avoid stale closures in useFrame and keep position updates off the render path
  const grabbedShapeIdRef   = useRef<string | null>(null);
  const grabberPosRef        = useRef(new THREE.Vector3());
  const prevSelectPressed    = useRef(false);
  const isPresentingRef      = useRef(false);
  const placementsRef        = useRef(placements);
  const taskRef              = useRef(task);
  placementsRef.current = placements;
  taskRef.current       = task;

  const rightController = useController('right');
  const leftController  = useController('left');
  const { isPresenting } = useXR((s) => ({ isPresenting: s.isPresenting }));
  isPresentingRef.current = isPresenting;

  // Reset on new task
  useEffect(() => {
    setPlacements(new Map());
    setGrabbedShapeId(null);
    grabbedShapeIdRef.current = null;
    prevSelectPressed.current = false;
  }, [task.taskId]);

  useFrame(() => {
    const shapeId = grabbedShapeIdRef.current;

    // Track active controller grip position every frame while grabbed in XR
    if (shapeId && isPresenting) {
      const ctrl = rightController ?? leftController;
      if (ctrl?.grip) {
        ctrl.grip.getWorldPosition(grabberPosRef.current);
      }
    }

    // Detect XR trigger release → snap-to-nearest-zone
    if (isPresenting) {
      const ctrl = rightController ?? leftController;
      const isPressed = ctrl?.inputSource?.gamepad?.buttons?.[0]?.pressed ?? false;

      if (prevSelectPressed.current && !isPressed && shapeId) {
        let nearestZone: DropZone | null = null;
        let nearestDist = 0.35; // snap radius in metres
        for (const zone of taskRef.current.zones) {
          const zp = new THREE.Vector3(zone.position.x, zone.position.y, zone.position.z);
          const d  = grabberPosRef.current.distanceTo(zp);
          if (d < nearestDist) { nearestDist = d; nearestZone = zone; }
        }
        if (nearestZone) {
          const nz = nearestZone;
          setPlacements((prev) => new Map(prev).set(shapeId, nz.id));
        }
        grabbedShapeIdRef.current = null;
        setGrabbedShapeId(null);
      }
      prevSelectPressed.current = isPressed;
    }
  });

  // XR: trigger pressed while pointing at shape
  const handleGrab = useCallback((shapeId: string) => {
    if (!isPresentingRef.current) return;
    setPlacements((prev) => {
      const next = new Map(prev);
      next.delete(shapeId); // unplace if was placed
      return next;
    });
    grabbedShapeIdRef.current = shapeId;
    setGrabbedShapeId(shapeId);
    prevSelectPressed.current = true; // trigger is currently held
  }, []);

  // Browser fallback: click shape to select / deselect
  const handleShapeClick = useCallback((shapeId: string) => {
    if (isPresentingRef.current) return; // XR uses handleGrab instead
    if (placementsRef.current.has(shapeId)) return;
    if (grabbedShapeIdRef.current === shapeId) {
      grabbedShapeIdRef.current = null;
      setGrabbedShapeId(null);
    } else {
      if (grabbedShapeIdRef.current !== null) return; // already holding one
      grabbedShapeIdRef.current = shapeId;
      setGrabbedShapeId(shapeId);
    }
  }, []);

  // Browser fallback: click zone to place grabbed shape
  const handleZoneSelect = useCallback((zoneId: string) => {
    const shapeId = grabbedShapeIdRef.current;
    if (!shapeId) return;
    setPlacements((prev) => new Map(prev).set(shapeId, zoneId));
    grabbedShapeIdRef.current = null;
    setGrabbedShapeId(null);
  }, []);

  const handleSubmit = useCallback(() => {
    onComplete(validateDragDrop(taskRef.current, placementsRef.current));
  }, [onComplete]);

  const remaining = task.shapes.length - placements.size;
  const allPlaced  = remaining === 0;
  const count      = task.shapes.length;

  return (
    <group>
      {/* instruction */}
      <group position={[0, 2.15, -2.1]}>
        <PanelBg width={1.4} height={0.18} />
        <Text position={[0, 0, 0.01]} fontSize={0.048} color="#00e5c8" anchorX="center">
          {task.instruction}
        </Text>
      </group>

      {/* drop zones */}
      {task.zones.map((zone) => (
        <DropZone3D
          key={zone.id}
          zone={zone}
          placedShapes={task.shapes.filter((s) => placements.get(s.id) === zone.id)}
          isActive={grabbedShapeId !== null}
          onSelect={handleZoneSelect}
        />
      ))}

      {/* draggable shapes */}
      {task.shapes.map((shape, i) => {
        const x = (-count / 2 + i + 0.5) * 0.25;
        return (
          <Shape3D
            key={shape.id}
            item={shape}
            position={[x, 1.1, -1.8]}
            onGrab={handleGrab}
            onSelectClick={handleShapeClick}
            isGrabbed={grabbedShapeId === shape.id}
            isPlaced={placements.has(shape.id)}
            grabberPosRef={grabberPosRef}
          />
        );
      })}

      {/* submit */}
      <group position={[0, 0.88, -2.0]}>
        <Interactive onSelect={allPlaced ? handleSubmit : () => undefined}>
          <mesh>
            <planeGeometry args={[0.8, 0.1]} />
            <meshStandardMaterial
              color={allPlaced ? '#00e5c8' : '#0d2d2d'}
              transparent
              opacity={allPlaced ? 1 : 0.5}
            />
          </mesh>
        </Interactive>
        <Text position={[0, 0, 0.01]} fontSize={0.042} color={allPlaced ? '#0a0c12' : '#334155'} anchorX="center">
          {allPlaced ? 'Submit Sorting' : `Place ${remaining} more shape${remaining !== 1 ? 's' : ''}`}
        </Text>
      </group>

      {/* grabbed hint */}
      {grabbedShapeId && (
        <group position={[0, 0.72, -2.0]}>
          <Text fontSize={0.034} color="#a78bfa" anchorX="center">
            {isPresenting ? 'Release trigger near a zone to place' : 'Now click a zone to drop it'}
          </Text>
        </group>
      )}
    </group>
  );
}

// ─── TextDragDropScene ────────────────────────────────────────────────────────

function TextDragDropScene({
  question,
  onComplete,
}: {
  question: Question;
  onComplete: (isCorrect: boolean) => void;
}) {
  const data = question.dragDropData!;
  const [placements, setPlacements] = useState<Map<string, string>>(new Map());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const { isPresenting } = useXR((s) => ({ isPresenting: s.isPresenting }));

  useEffect(() => {
    setPlacements(new Map());
    setSelectedItemId(null);
    selectedRef.current = null;
  }, [question.questionId]);

  const handleItemClick = useCallback((itemId: string) => {
    const next = selectedRef.current === itemId ? null : itemId;
    selectedRef.current = next;
    setSelectedItemId(next);
    setPlacements(prev => {
      if (!prev.has(itemId)) return prev;
      const m = new Map(prev);
      m.delete(itemId);
      return m;
    });
  }, []);

  const handleZoneClick = useCallback((zoneId: string) => {
    const itemId = selectedRef.current;
    if (!itemId) return;
    setPlacements(prev => {
      const m = new Map(prev);
      for (const [iid, zid] of m) {
        if (zid === zoneId) { m.delete(iid); break; }
      }
      m.set(itemId, zoneId);
      return m;
    });
    selectedRef.current = null;
    setSelectedItemId(null);
  }, []);

  const allPlaced = placements.size === data.items.length;

  const handleSubmit = useCallback(() => {
    if (!allPlaced) return;
    const isCorrect = data.zones.every(zone => {
      const placed = Array.from(placements.entries()).find(([, zid]) => zid === zone.id)?.[0];
      return placed === zone.correctItemId;
    });
    onComplete(isCorrect);
  }, [allPlaced, placements, data, onComplete]);

  const PANEL_W = 1.6;
  const PANEL_H = 1.95;
  const ZONE_H = 0.18;
  const ZONE_Y_START = 0.54;
  const ZONE_STEP = 0.215;
  const ITEM_Y_START = -0.47;
  const ITEM_ROW_STEP = 0.14;

  return (
    <group position={[0, 1.5, -2.2]}>
      <PanelBg width={PANEL_W} height={PANEL_H} />

      <Text position={[0, 0.84, 0.01]} fontSize={0.032} color="#00e5c8" anchorX="center" maxWidth={1.5} textAlign="center">
        {question.text}
      </Text>

      {data.zones.map((zone, idx) => {
        const y = ZONE_Y_START - idx * ZONE_STEP;
        const placedItemId = Array.from(placements.entries()).find(([, zid]) => zid === zone.id)?.[0];
        const placedItem = data.items.find(i => i.id === placedItemId);
        const isActiveTarget = selectedItemId !== null;

        return (
          <group key={zone.id} position={[0, y, 0.01]}>
            <mesh>
              <planeGeometry args={[PANEL_W - 0.06, ZONE_H]} />
              <meshStandardMaterial color={placedItem ? '#0d2d2d' : '#111827'} transparent opacity={0.95} />
            </mesh>
            <PulsingBorder width={PANEL_W - 0.04} height={ZONE_H + 0.01} active={isActiveTarget && !placedItem} />
            <Interactive onSelect={() => handleZoneClick(zone.id)}>
              <mesh position={[0.25, 0, 0.005]}>
                <planeGeometry args={[0.9, ZONE_H - 0.02]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
              </mesh>
            </Interactive>
            <Text position={[-0.72, 0, 0.01]} fontSize={0.022} color="#94a3b8" anchorX="left" maxWidth={0.62} textAlign="left">
              {zone.label}
            </Text>
            <mesh position={[-0.09, 0, 0.005]}>
              <planeGeometry args={[0.002, ZONE_H - 0.02]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <Text position={[-0.05, 0, 0.01]} fontSize={0.026} color={placedItem ? '#e2e8f0' : isActiveTarget ? '#475569' : '#334155'} anchorX="left" maxWidth={0.85}>
              {placedItem ? placedItem.text : (isActiveTarget ? '← click to place' : '···')}
            </Text>
          </group>
        );
      })}

      <Text position={[-0.72, -0.34, 0.01]} fontSize={0.024} color="#64748b" anchorX="left">
        {selectedItemId ? 'Selected — click a zone to place:' : 'Click an item to select:'}
      </Text>

      {data.items.map((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col === 0 ? -0.40 : 0.40;
        const y = ITEM_Y_START - row * ITEM_ROW_STEP;
        const isSelected = selectedItemId === item.id;
        const isPlaced = placements.has(item.id);

        return (
          <group key={item.id} position={[x, y, 0.01]}>
            {isSelected && (
              <mesh position={[0, 0, 0.004]}>
                <planeGeometry args={[0.76, 0.098]} />
                <meshStandardMaterial color="#00e5c8" transparent opacity={0.22} />
              </mesh>
            )}
            <Interactive onSelect={() => handleItemClick(item.id)}>
              <mesh>
                <planeGeometry args={[0.75, 0.092]} />
                <meshStandardMaterial
                  color={isPlaced ? '#060810' : isSelected ? '#0d2d2d' : '#111827'}
                  transparent opacity={isPlaced ? 0.45 : 0.95}
                />
              </mesh>
            </Interactive>
            <Text position={[0, 0, 0.02]} fontSize={0.026} color={isPlaced ? '#2d3748' : isSelected ? '#00e5c8' : '#e2e8f0'} anchorX="center" maxWidth={0.70}>
              {item.text}
            </Text>
          </group>
        );
      })}

      <group position={[0, -0.86, 0.01]}>
        <Interactive onSelect={allPlaced ? handleSubmit : () => undefined}>
          <mesh>
            <planeGeometry args={[1.2, 0.092]} />
            <meshStandardMaterial
              color={allPlaced ? '#00e5c8' : '#0d2d2d'}
              emissive={allPlaced ? '#00e5c8' : '#000000'}
              emissiveIntensity={allPlaced ? 1.8 : 0}
              transparent
              opacity={allPlaced ? 1 : 0.5}
            />
          </mesh>
        </Interactive>
        <Text position={[0, 0, 0.02]} fontSize={0.042} color={allPlaced ? '#0a0c12' : '#334155'} anchorX="center">
          {allPlaced ? 'Submit' : `Place ${data.items.length - placements.size} more`}
        </Text>
      </group>

      {selectedItemId && (
        <Text position={[0, -0.74, 0.01]} fontSize={0.026} color="#a78bfa" anchorX="center">
          {isPresenting ? 'Point at a zone and squeeze trigger' : 'Now click a zone above'}
        </Text>
      )}
    </group>
  );
}

// ─── MainTaskPanel ────────────────────────────────────────────────────────────

interface MainTaskPanelProps {
  question: Question | null;
  stats: QuizStats;
  selectedAnswer: number | null;
  onSelect: (answerId: number) => void;
  onSubmit: () => void;
  onStart: () => void;
  onExit: () => void;
  onExitConfirm: () => void;
  onExitCancel: () => void;
  showExitConfirm: boolean;
  sessionId: number | null;
  isLoading: boolean;
  currentDifficulty: number;
  isFinished: boolean;
  finalStats: SessionStats | null;
  courses: Course[];
  selectedCourseId: number | null;
  onSelectCourse: (id: number) => void;
  maxQuestions: number;
  hasCourseParam: boolean;
  quizType: string | null;
}

function MainTaskPanel({
  question, stats, selectedAnswer, onSelect, onSubmit, onStart, onExit,
  onExitConfirm, onExitCancel, showExitConfirm,
  sessionId, isLoading, currentDifficulty, isFinished, finalStats,
  courses, selectedCourseId, onSelectCourse,
  maxQuestions, hasCourseParam, quizType,
}: MainTaskPanelProps) {
  const [hoveredAnswer, setHoveredAnswer] = useState<number | null>(null);
  const progressFill = 1.2 * (stats.total / maxQuestions);
  const progressFillX = -1.2 / 2 + progressFill / 2;

  const quizLabel = quizType === 'mini' ? 'Mini Quiz' : quizType === 'final' ? 'Final Quiz' : 'VR Quiz';

  // ── Exit confirmation overlay ─────────────────────────────────────────────
  if (showExitConfirm) {
    return (
      <group position={[0, 1.5, -2.2]}>
        <PanelBg width={1.4} height={0.6} />
        <Text position={[0, 0.2, 0.01]} fontSize={0.044} color="#f59e0b" anchorX="center" fontWeight="bold">
          Exit Quiz?
        </Text>
        <Text position={[0, 0.06, 0.01]} fontSize={0.032} color="#94a3b8" anchorX="center" maxWidth={1.2} textAlign="center">
          Your progress so far will be saved.
        </Text>
        {/* Confirm exit */}
        <group position={[-0.32, -0.1, 0.01]}>
          <Interactive onSelect={onExitConfirm}>
            <mesh>
              <planeGeometry args={[0.52, 0.1]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          </Interactive>
          <Text position={[0, 0, 0.02]} fontSize={0.040} color="#fff" anchorX="center">
            Yes, exit
          </Text>
        </group>
        {/* Cancel */}
        <group position={[0.32, -0.1, 0.01]}>
          <Interactive onSelect={onExitCancel}>
            <mesh>
              <planeGeometry args={[0.52, 0.1]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </Interactive>
          <Text position={[0, 0, 0.02]} fontSize={0.040} color="#94a3b8" anchorX="center">
            Keep going
          </Text>
        </group>
      </group>
    );
  }

  // ── Results panel ─────────────────────────────────────────────────────────
  if (isFinished && finalStats) {
    const passed = finalStats.accuracy >= 70;
    return (
      <group position={[0, 1.5, -2.2]}>
        <PanelBg width={1.4} height={0.95} />
        <Text position={[0, 0.38, 0.01]} fontSize={0.058} color="#00e5c8" anchorX="center" fontWeight="bold">
          Quiz Complete!
        </Text>
        {quizType === 'mini' && (
          <Text position={[0, 0.26, 0.01]} fontSize={0.036} color={passed ? '#22c55e' : '#ef4444'} anchorX="center" fontWeight="bold">
            {passed ? '✓ Passed' : '✗ Not Passed'}
          </Text>
        )}
        <Text position={[0, 0.14, 0.01]} fontSize={0.04} color="#e2e8f0" anchorX="center">
          {`Score: ${finalStats.correctAnswers} / ${finalStats.totalQuestions}`}
        </Text>
        <Text position={[0, 0.02, 0.01]} fontSize={0.04} color="#e2e8f0" anchorX="center">
          {`Accuracy: ${finalStats.accuracy.toFixed(1)}%`}
        </Text>
        {quizType !== 'mini' && (
          <Text position={[0, -0.1, 0.01]} fontSize={0.04} color="#a78bfa" anchorX="center">
            {`Final Difficulty: ${finalStats.finalDifficulty}/10`}
          </Text>
        )}
        {/* Play Again */}
        <group position={hasCourseParam ? [-0.32, -0.26, 0.01] : [0, -0.26, 0.01]}>
          <Interactive onSelect={onStart}>
            <mesh>
              <planeGeometry args={[hasCourseParam ? 0.52 : 0.6, 0.1]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </Interactive>
          <Text position={[0, 0, 0.02]} fontSize={0.038} color="#94a3b8" anchorX="center">
            Play Again
          </Text>
        </group>
        {/* Exit to Course (only when launched from a course page) */}
        {hasCourseParam && (
          <group position={[0.32, -0.26, 0.01]}>
            <Interactive onSelect={onExit}>
              <mesh>
                <planeGeometry args={[0.52, 0.1]} />
                <meshStandardMaterial color="#00e5c8" />
              </mesh>
            </Interactive>
            <Text position={[0, 0, 0.02]} fontSize={0.038} color="#0a0c12" anchorX="center">
              Exit to Course
            </Text>
          </group>
        )}
      </group>
    );
  }

  // ── Start / course-selector panel ─────────────────────────────────────────
  if (!sessionId || !question) {
    // When launched from a course page, no course selector needed
    if (hasCourseParam) {
      return (
        <group position={[0, 1.5, -2.2]}>
          <PanelBg width={1.4} height={0.5} />
          <Text position={[0, 0.16, 0.01]} fontSize={0.054} color="#00e5c8" anchorX="center" fontWeight="bold">
            {quizLabel}
          </Text>
          <Text position={[0, 0.02, 0.01]} fontSize={0.030} color="#64748b" anchorX="center">
            {quizType === 'mini'
              ? `Fixed difficulty · ${maxQuestions} questions · Pass at 70%`
              : quizType === 'final'
              ? `Adaptive difficulty · ${maxQuestions} questions`
              : `Adaptive difficulty · ${maxQuestions} questions`}
          </Text>
          <group position={[0, -0.13, 0.01]}>
            <Interactive onSelect={onStart}>
              <mesh>
                <planeGeometry args={[0.6, 0.1]} />
                <meshStandardMaterial color={isLoading ? '#1e293b' : '#00e5c8'} transparent opacity={isLoading ? 0.5 : 1} />
              </mesh>
            </Interactive>
            <Text position={[0, 0, 0.02]} fontSize={0.044} color={isLoading ? '#475569' : '#0a0c12'} anchorX="center">
              {isLoading ? 'Loading...' : 'Start Quiz'}
            </Text>
          </group>
        </group>
      );
    }

    // Legacy /vr-test route — show course selector
    const panelH = 0.6 + Math.max(0, courses.length - 1) * 0.115;
    return (
      <group position={[0, 1.5, -2.2]}>
        <PanelBg width={1.4} height={panelH} />
        <Text position={[0, panelH / 2 - 0.08, 0.01]} fontSize={0.058} color="#00e5c8" anchorX="center" fontWeight="bold">
          VR Quiz
        </Text>
        <Text position={[0, panelH / 2 - 0.16, 0.01]} fontSize={0.032} color="#64748b" anchorX="center">
          Adaptive difficulty · {maxQuestions} questions
        </Text>

        {courses.length > 0 && (
          <>
            <Text position={[-0.55, panelH / 2 - 0.26, 0.01]} fontSize={0.03} color="#94a3b8" anchorX="left">
              Select course:
            </Text>
            {courses.map((course, idx) => {
              const isSelected = selectedCourseId === course.id;
              const yPos = panelH / 2 - 0.36 - idx * 0.115;
              return (
                <group key={course.id} position={[0, yPos, 0.01]}>
                  {isSelected && (
                    <mesh position={[0, 0, 0.004]}>
                      <planeGeometry args={[1.22, 0.1]} />
                      <meshStandardMaterial color="#00e5c8" transparent opacity={0.18} />
                    </mesh>
                  )}
                  <Interactive onSelect={() => onSelectCourse(course.id)}>
                    <mesh>
                      <planeGeometry args={[1.2, 0.095]} />
                      <meshStandardMaterial color={isSelected ? '#0d2d2d' : '#111827'} transparent opacity={0.95} />
                    </mesh>
                  </Interactive>
                  <Text position={[-0.52, 0, 0.02]} fontSize={0.033} color={isSelected ? '#00e5c8' : '#64748b'} anchorX="left">
                    {isSelected ? '▶' : '○'}
                  </Text>
                  <Text position={[-0.42, 0.015, 0.02]} fontSize={0.033} color={isSelected ? '#e2e8f0' : '#94a3b8'} anchorX="left" maxWidth={0.9}>
                    {course.title}
                  </Text>
                  <Text position={[-0.42, -0.022, 0.02]} fontSize={0.024} color="#475569" anchorX="left" maxWidth={0.9}>
                    {`${course.difficulty} · ${course.durationMinutes} min`}
                  </Text>
                </group>
              );
            })}
          </>
        )}

        <group position={[0, -panelH / 2 + 0.08, 0.01]}>
          <Interactive onSelect={selectedCourseId !== null ? onStart : () => undefined}>
            <mesh>
              <planeGeometry args={[0.6, 0.1]} />
              <meshStandardMaterial
                color={selectedCourseId !== null ? '#00e5c8' : '#1e293b'}
                transparent
                opacity={isLoading || selectedCourseId === null ? 0.5 : 1}
              />
            </mesh>
          </Interactive>
          <Text position={[0, 0, 0.02]} fontSize={0.044} color={selectedCourseId !== null ? '#0a0c12' : '#475569'} anchorX="center">
            {isLoading ? 'Loading...' : selectedCourseId === null ? 'Choose course' : 'Start Quiz'}
          </Text>
        </group>
      </group>
    );
  }

  // ── Active question panel ─────────────────────────────────────────────────
  return (
    <group position={[0, 1.5, -2.2]}>
      <PanelBg width={1.4} height={1.2} />

      {/* Exit button — top-right corner, always visible */}
      <group position={[0.62, 0.55, 0.01]}>
        <Interactive onSelect={onExit}>
          <mesh>
            <planeGeometry args={[0.14, 0.075]} />
            <meshStandardMaterial color="#1e293b" transparent opacity={0.9} />
          </mesh>
        </Interactive>
        <Text position={[0, 0, 0.01]} fontSize={0.032} color="#94a3b8" anchorX="center">
          ✕ Exit
        </Text>
      </group>

      <Text position={[-0.45, 0.42, 0.01]} fontSize={0.036} color="#64748b" anchorX="left">
        {`Q ${stats.total + 1} / ${maxQuestions}`}
      </Text>
      <Text position={[0.45, 0.42, 0.01]} fontSize={0.036} color="#a78bfa" anchorX="right">
        {quizType === 'mini' ? quizLabel : `Diff: ${currentDifficulty}/10`}
      </Text>

      {/* progress bar */}
      <mesh position={[0, 0.35, 0.01]}>
        <planeGeometry args={[1.2, 0.015]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {stats.total > 0 && (
        <mesh position={[progressFillX, 0.35, 0.02]}>
          <planeGeometry args={[progressFill, 0.015]} />
          <meshStandardMaterial color="#00e5c8" emissive="#00e5c8" emissiveIntensity={2.0} />
        </mesh>
      )}

      <Text position={[0, 0.18, 0.01]} fontSize={0.052} color="#e2e8f0" maxWidth={1.2} textAlign="center" anchorX="center">
        {question.text}
      </Text>

      {question.answers.map((ans, idx) => {
        const isSelected = selectedAnswer === ans.answerId;
        const isHovered = hoveredAnswer === ans.answerId;
        const yPos = 0.0 - idx * 0.13;
        return (
          <group key={ans.answerId} position={[0, yPos, 0.01]} scale={isHovered && !isSelected ? 1.03 : 1}>
            {isSelected && (
              <mesh position={[0, 0, 0.005]}>
                <planeGeometry args={[1.21, 0.112]} />
                <meshStandardMaterial color="#00e5c8" emissive="#00e5c8" emissiveIntensity={0.5} transparent opacity={0.25} />
              </mesh>
            )}
            <Interactive
              onSelect={() => onSelect(ans.answerId)}
              onHover={() => setHoveredAnswer(ans.answerId)}
              onBlur={() => setHoveredAnswer(null)}
            >
              <mesh
                onPointerOver={() => setHoveredAnswer(ans.answerId)}
                onPointerOut={() => setHoveredAnswer(null)}
              >
                <planeGeometry args={[1.2, 0.11]} />
                <meshStandardMaterial
                  color={isSelected ? '#0d2d2d' : isHovered ? '#1a2436' : '#111827'}
                  emissive={isSelected ? '#00e5c8' : '#000000'}
                  emissiveIntensity={isSelected ? 0.12 : 0}
                  transparent
                  opacity={0.95}
                />
              </mesh>
            </Interactive>
            <Text position={[-0.52, 0, 0.02]} fontSize={0.042} color={isSelected ? '#00e5c8' : '#64748b'} anchorX="left">
              {ANSWER_LABELS[idx]}
            </Text>
            <Text position={[-0.42, 0, 0.02]} fontSize={0.038} color="#e2e8f0" anchorX="left" maxWidth={0.9}>
              {ans.text}
            </Text>
          </group>
        );
      })}

      <group position={[0, -0.54, 0.01]}>
        <Interactive onSelect={onSubmit}>
          <mesh>
            <planeGeometry args={[1.2, 0.1]} />
            <meshStandardMaterial
              color={selectedAnswer !== null ? '#00e5c8' : '#0d2d2d'}
              emissive={selectedAnswer !== null ? '#00e5c8' : '#000000'}
              emissiveIntensity={selectedAnswer !== null ? 1.8 : 0}
              transparent
              opacity={selectedAnswer !== null ? 1 : 0.5}
            />
          </mesh>
        </Interactive>
        <Text position={[0, 0, 0.02]} fontSize={0.048} color={selectedAnswer !== null ? '#0a0c12' : '#334155'} anchorX="center">
          {isLoading ? 'Submitting...' : 'Submit Answer'}
        </Text>
      </group>
    </group>
  );
}

// ─── AIAssistantPanel ─────────────────────────────────────────────────────────

function AIAssistantPanel({ difficulty }: { difficulty: number }) {
  const label = difficultyLabel(difficulty);
  return (
    <group position={[-1.4, 1.2, -1.6]} rotation={[0, 0.3, 0]}>
      <PanelBg width={0.6} height={0.45} />
      <Text position={[0, 0.17, 0.01]} fontSize={0.042} color="#a78bfa" anchorX="center" fontWeight="bold">
        AI Assistant
      </Text>
      <Text position={[0, 0.04, 0.01]} fontSize={0.032} color="#94a3b8" anchorX="center" maxWidth={0.52} textAlign="center">
        Adapting difficulty based on your performance
      </Text>
      <Text position={[0, -0.1, 0.01]} fontSize={0.03} color="#64748b" anchorX="center">
        Predicted Difficulty
      </Text>
      <Text position={[0, -0.17, 0.01]} fontSize={0.055} color="#00e5c8" anchorX="center" fontWeight="bold">
        {label}
      </Text>
    </group>
  );
}

// ─── PerformancePanel ─────────────────────────────────────────────────────────

function PerformancePanel({ stats }: { stats: QuizStats }) {
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  return (
    <group position={[1.4, 1.2, -1.6]} rotation={[0, -0.3, 0]}>
      <PanelBg width={0.55} height={0.45} />
      <Text position={[0, 0.17, 0.01]} fontSize={0.042} color="#e2e8f0" anchorX="center" fontWeight="bold">
        Performance
      </Text>
      <Text position={[0, 0.06, 0.01]} fontSize={0.06} color="#00e5c8" anchorX="center" fontWeight="bold">
        {`${accuracy}%`}
      </Text>
      <Text position={[0, -0.04, 0.01]} fontSize={0.03} color="#64748b" anchorX="center">
        Overall Progress
      </Text>
      <Text position={[-0.1, -0.13, 0.01]} fontSize={0.028} color="#94a3b8" anchorX="center">
        Correct
      </Text>
      <Text position={[-0.1, -0.19, 0.01]} fontSize={0.038} color="#e2e8f0" anchorX="center" fontWeight="bold">
        {`${stats.correct}/${stats.total}`}
      </Text>
      <Text position={[0.15, -0.13, 0.01]} fontSize={0.028} color="#94a3b8" anchorX="center">
        Streak
      </Text>
      <Text position={[0.15, -0.19, 0.01]} fontSize={0.038} color="#00e5c8" anchorX="center" fontWeight="bold">
        {`${stats.streak}`}
      </Text>
    </group>
  );
}

// ─── DebugPanel ───────────────────────────────────────────────────────────────

interface DebugPanelProps {
  sessionId: number | null;
  currentDifficulty: number;
  stats: QuizStats;
  maxQuestions: number;
  signalRStatus: string;
  lastDifficultyEvent: DifficultyUpdatedEvent | null;
  recentAttempts: Array<{ questionNum: number; isCorrect: boolean; timeSpent: number; difficulty: number }>;
}

function DebugPanel({
  sessionId, currentDifficulty, stats, maxQuestions,
  signalRStatus, lastDifficultyEvent, recentAttempts,
}: DebugPanelProps) {
  const statusColor = signalRStatus === 'Connected' ? '#22c55e'
    : signalRStatus === 'Reconnecting' ? '#f59e0b'
    : '#ef4444';

  const sourceLabel = lastDifficultyEvent
    ? (lastDifficultyEvent.source === 'ml_model' ? 'ML Model' : 'Rule-based Fallback')
    : '—';

  const confidencePct = lastDifficultyEvent
    ? `${Math.round(lastDifficultyEvent.confidence * 100)}%`
    : '—';

  const ts = lastDifficultyEvent
    ? new Date(lastDifficultyEvent.timestamp).toLocaleTimeString()
    : '—';

  const checkpointInterval = 10;
  const attemptsInBlock = stats.total % checkpointInterval;
  const untilNext = attemptsInBlock === 0 && stats.total > 0 ? 0 : checkpointInterval - attemptsInBlock;

  return (
    <group position={[2.4, 1.5, -0.8]} rotation={[0, -0.75, 0]}>
      <PanelBg width={0.72} height={1.1} />

      {/* Title */}
      <Text position={[0, 0.48, 0.01]} fontSize={0.034} color="#f59e0b" anchorX="center" fontWeight="bold">
        ML Debug Panel
      </Text>
      <Text position={[0, 0.42, 0.01]} fontSize={0.020} color="#475569" anchorX="center">
        Press F9 to hide
      </Text>

      {/* SignalR status */}
      <Text position={[-0.32, 0.34, 0.01]} fontSize={0.022} color="#64748b" anchorX="left">SignalR:</Text>
      <Text position={[0.32, 0.34, 0.01]} fontSize={0.022} color={statusColor} anchorX="right">{signalRStatus}</Text>

      {/* Session */}
      <Text position={[-0.32, 0.27, 0.01]} fontSize={0.022} color="#64748b" anchorX="left">Session:</Text>
      <Text position={[0.32, 0.27, 0.01]} fontSize={0.022} color="#e2e8f0" anchorX="right">{sessionId ?? '—'}</Text>

      {/* Current difficulty */}
      <Text position={[-0.32, 0.20, 0.01]} fontSize={0.022} color="#64748b" anchorX="left">Difficulty:</Text>
      <Text position={[0.32, 0.20, 0.01]} fontSize={0.022} color="#00e5c8" anchorX="right">{currentDifficulty}/10</Text>

      {/* Divider */}
      <mesh position={[0, 0.155, 0.005]}>
        <planeGeometry args={[0.64, 0.002]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Last prediction */}
      <Text position={[0, 0.12, 0.01]} fontSize={0.024} color="#a78bfa" anchorX="center">Last Prediction</Text>
      <Text position={[-0.32, 0.06, 0.01]} fontSize={0.020} color="#64748b" anchorX="left">Source:</Text>
      <Text position={[0.32, 0.06, 0.01]} fontSize={0.020} color="#e2e8f0" anchorX="right" maxWidth={0.42}>{sourceLabel}</Text>
      <Text position={[-0.32, 0.00, 0.01]} fontSize={0.020} color="#64748b" anchorX="left">Confidence:</Text>
      <Text position={[0.32, 0.00, 0.01]} fontSize={0.020} color="#e2e8f0" anchorX="right">{confidencePct}</Text>
      <Text position={[-0.32, -0.06, 0.01]} fontSize={0.020} color="#64748b" anchorX="left">Predicted:</Text>
      <Text position={[0.32, -0.06, 0.01]} fontSize={0.020} color="#00e5c8" anchorX="right">
        {lastDifficultyEvent ? `${lastDifficultyEvent.newDifficulty}/10` : '—'}
      </Text>
      <Text position={[-0.32, -0.12, 0.01]} fontSize={0.018} color="#64748b" anchorX="left">At:</Text>
      <Text position={[0.32, -0.12, 0.01]} fontSize={0.018} color="#475569" anchorX="right">{ts}</Text>

      {/* Divider */}
      <mesh position={[0, -0.165, 0.005]}>
        <planeGeometry args={[0.64, 0.002]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Checkpoint progress */}
      <Text position={[0, -0.20, 0.01]} fontSize={0.020} color="#94a3b8" anchorX="center">
        {`${attemptsInBlock}/${checkpointInterval} until next prediction`}
      </Text>
      <Text position={[0, -0.26, 0.01]} fontSize={0.018} color="#475569" anchorX="center">
        {`Total: ${stats.total} / ${maxQuestions} questions`}
      </Text>

      {/* Divider */}
      <mesh position={[0, -0.305, 0.005]}>
        <planeGeometry args={[0.64, 0.002]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Last 5 attempts */}
      <Text position={[0, -0.34, 0.01]} fontSize={0.022} color="#a78bfa" anchorX="center">Last 5 Attempts</Text>
      {recentAttempts.slice(-5).reverse().map((a, i) => (
        <group key={i} position={[0, -0.39 - i * 0.062, 0.01]}>
          <Text position={[-0.32, 0, 0]} fontSize={0.018} color="#64748b" anchorX="left">
            {`Q${a.questionNum}`}
          </Text>
          <Text position={[-0.10, 0, 0]} fontSize={0.018} color={a.isCorrect ? '#22c55e' : '#ef4444'} anchorX="center">
            {a.isCorrect ? '✓' : '✗'}
          </Text>
          <Text position={[0.10, 0, 0]} fontSize={0.018} color="#94a3b8" anchorX="center">
            {`${a.timeSpent}s`}
          </Text>
          <Text position={[0.32, 0, 0]} fontSize={0.018} color="#00e5c8" anchorX="right">
            {`D${a.difficulty}`}
          </Text>
        </group>
      ))}
      {recentAttempts.length === 0 && (
        <Text position={[0, -0.41, 0.01]} fontSize={0.018} color="#475569" anchorX="center">No attempts yet</Text>
      )}
    </group>
  );
}

// ─── PostProcessingEffects ────────────────────────────────────────────────────

function PostProcessingEffects() {
  const isPresenting = useXR((s) => s.isPresenting);
  if (isPresenting) return null;
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.55}
        luminanceSmoothing={0.3}
        mipmapBlur
        intensity={1.4}
        radius={0.7}
      />
      <Vignette eskil={false} offset={0.12} darkness={0.65} />
    </EffectComposer>
  );
}

// ─── PulsingBorder ────────────────────────────────────────────────────────────

function PulsingBorder({ width, height, active }: { width: number; height: number; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    if (active) {
      const pulse = 0.5 + 0.45 * Math.sin(clock.elapsedTime * 5);
      mat.emissiveIntensity = pulse;
      mat.opacity = 0.08 + 0.1 * pulse;
    } else {
      mat.emissiveIntensity = 0;
      mat.opacity = 0;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -0.001]}>
      <planeGeometry args={[width + 0.008, height + 0.008]} />
      <meshStandardMaterial
        color="#00e5c8"
        emissive="#00e5c8"
        emissiveIntensity={0}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const btnTeal: React.CSSProperties = {
  background: '#00e5c8',
  color: '#0a0c12',
  border: 'none',
  borderRadius: 10,
  padding: '11px 24px',
  fontFamily: 'monospace',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};

export function VRTestPage() {
  const navigate = useNavigate();
  const { courseId: paramCourseId, moduleId: paramModuleId, quizType: paramQuizType } = useParams<{
    courseId?: string;
    moduleId?: string;
    quizType?: string;
  }>();
  const token = useAuthStore.getState().token;

  // Derived from URL params — when set the quiz is tied to a specific module/course
  const urlCourseId  = paramCourseId  ? Number(paramCourseId)  : null;
  const urlModuleId  = paramModuleId  ? Number(paramModuleId)  : null;
  // /vr-quiz/:courseId/final has no :moduleId param; quizType comes from the segment or param
  const urlQuizType  = (paramQuizType as 'mini' | 'final' | undefined) ?? null;
  const hasCourseParam = urlCourseId !== null;

  const [isLocked, setIsLocked]             = useState(false);
  const [sessionId, setSessionId]           = useState<number | null>(null);
  const [question, setQuestion]             = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [stats, setStats]                   = useState<QuizStats>({ correct: 0, total: 0, streak: 0 });
  const [currentDifficulty, setCurrentDifficulty] = useState(5);
  const [isLoading, setIsLoading]           = useState(false);
  const [timeStarted, setTimeStarted]       = useState<Date | null>(null);
  const [isFinished, setIsFinished]         = useState(false);
  const [finalStats, setFinalStats]         = useState<SessionStats | null>(null);
  const [isXR, setIsXR]                     = useState(false);
  const [maxQuestions, setMaxQuestions]     = useState(DEFAULT_MAX_QUESTIONS);
  const [activeQuizType, setActiveQuizType] = useState<string | null>(urlQuizType);

  // Debug panel state
  const [showDebug, setShowDebug]           = useState(false);
  const [attemptLog, setAttemptLog]         = useState<
    Array<{ questionNum: number; isCorrect: boolean; timeSpent: number; difficulty: number }>
  >([]);

  // SignalR socket
  const { signalRStatus, lastDifficultyEvent } = useQuizSocket(
    sessionId,
    (event) => {
      setCurrentDifficulty(event.newDifficulty);
    },
  );

  // Exit-confirmation state
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // course selection (only used on legacy /vr-test route)
  const [courses, setCourses]               = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(urlCourseId);

  useEffect(() => {
    if (hasCourseParam) return;
    coursesApi.getAll()
      .then((list) => {
        setCourses(list);
        if (list.length > 0) setSelectedCourseId(list[0].id);
      })
      .catch(console.error);
  }, [hasCourseParam]);

  // F9 toggles debug panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F9') setShowDebug((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-navigate back to course page 3s after mini quiz finishes
  useEffect(() => {
    if (!isFinished || urlQuizType !== 'mini' || !urlCourseId) return;
    const timer = setTimeout(() => navigate(`/courses/${urlCourseId}`), 3000);
    return () => clearTimeout(timer);
  }, [isFinished, urlQuizType, urlCourseId, navigate]);

  // drag-drop state
  const [taskMode, setTaskMode]   = useState<'mcq' | 'dragdrop'>('mcq');
  const [dragTask, setDragTask]   = useState<DragDropTask | null>(null);
  const [taskIndex, setTaskIndex] = useState(0);

  const handleXRStart = useCallback(() => { setIsXR(true); setIsLocked(false); }, []);
  const handleXREnd   = useCallback(() => { setIsXR(false); }, []);

  const fetchNextQuestion = async (
    sid: number,
    exhaustedStats?: { correct: number; total: number; difficulty: number },
  ) => {
    try {
      const q = await quizApi.getNextQuestion(sid);
      if (q === null) {
        // Pool exhausted before maxQuestions — end the quiz now
        const s = exhaustedStats ?? { correct: stats.correct, total: stats.total, difficulty: currentDifficulty };
        await finishSession(sid, s.correct, s.total, s.difficulty);
        return;
      }
      setQuestion(q);
      setCurrentDifficulty(q.difficultyLevel);
      setSelectedAnswer(null);
      setTimeStarted(new Date());
    } catch (err) {
      console.error('fetchNextQuestion failed:', err);
    }
  };

  const startQuiz = async () => {
    if (selectedCourseId === null) return;
    setIsLoading(true);
    setIsFinished(false);
    setFinalStats(null);
    setStats({ correct: 0, total: 0, streak: 0 });
    setCurrentDifficulty(5);
    setTaskMode('mcq');
    setDragTask(null);
    setTaskIndex(0);
    setShowExitConfirm(false);
    try {
      const session = await quizApi.startSession(
        selectedCourseId,
        urlModuleId ?? undefined,
        urlQuizType ?? undefined,
      );
      setSessionId(session.sessionId);
      setMaxQuestions(session.maxQuestions ?? DEFAULT_MAX_QUESTIONS);
      setActiveQuizType(session.quizType);
      await fetchNextQuestion(session.sessionId);
    } catch (err) {
      console.error('startQuiz failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const finishSession = async (sid: number, newCorrect: number, newTotal: number, newDifficulty: number) => {
    let sessionStats: SessionStats;
    try {
      sessionStats = await quizApi.getStats(sid);
    } catch {
      sessionStats = {
        totalQuestions: newTotal,
        correctAnswers: newCorrect,
        accuracy: newTotal === 0 ? 0 : (newCorrect / newTotal) * 100,
        finalDifficulty: newDifficulty,
      };
    }
    setFinalStats(sessionStats);
    setIsFinished(true);
    setQuestion(null);

    // Mark the session as closed
    try { await quizApi.endSession(sid); } catch { /* non-fatal */ }

    // Save VR mini quiz result for the course page to pick up
    if (activeQuizType === 'mini' && urlModuleId !== null && urlCourseId !== null) {
      const accuracy = sessionStats.accuracy;
      const passed   = accuracy >= 70;
      const result: VrQuizResult = {
        moduleId:    urlModuleId,
        courseId:    urlCourseId,
        passed,
        accuracy,
        score:       Math.round(accuracy),
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem(`vr_quiz_result_${urlCourseId}`, JSON.stringify(result));
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || !question || !sessionId) return;
    setIsLoading(true);
    const timeSpent = timeStarted ? Math.round((Date.now() - timeStarted.getTime()) / 1000) : 0;
    try {
      const result: SubmitAnswerResult = await quizApi.submitAnswer({
        sessionId, questionId: question.questionId,
        selectedAnswerId: selectedAnswer, timeSpentSeconds: timeSpent,
      });
      const newTotal   = stats.total + 1;
      const newCorrect = stats.correct + (result.isCorrect ? 1 : 0);
      const newStreak  = result.isCorrect ? stats.streak + 1 : 0;
      setStats({ correct: newCorrect, total: newTotal, streak: newStreak });
      setCurrentDifficulty(result.newDifficulty);
      setAttemptLog((prev) => [...prev, {
        questionNum: newTotal,
        isCorrect: result.isCorrect,
        timeSpent: timeSpent,
        difficulty: question.difficultyLevel,
      }]);

      const newIndex = taskIndex + 1;
      setTaskIndex(newIndex);

      if (newTotal >= maxQuestions) {
        await finishSession(sessionId, newCorrect, newTotal, result.newDifficulty);
      } else {
        await fetchNextQuestion(sessionId, { correct: newCorrect, total: newTotal, difficulty: result.newDifficulty });
      }
    } catch (err) {
      console.error('submitAnswer failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragDropComplete = useCallback(async (result: { correct: number; total: number; percentage: number }) => {
    if (!sessionId) return;
    const passed     = result.percentage >= 60;
    const newTotal   = stats.total + 1;
    const newCorrect = stats.correct + (passed ? 1 : 0);
    const newStreak  = passed ? stats.streak + 1 : 0;
    setStats({ correct: newCorrect, total: newTotal, streak: newStreak });

    const newIndex = taskIndex + 1;
    setTaskIndex(newIndex);

    if (newTotal >= maxQuestions) {
      await finishSession(sessionId, newCorrect, newTotal, currentDifficulty);
    } else {
      setTaskMode('mcq');
      setDragTask(null);
      await fetchNextQuestion(sessionId, { correct: newCorrect, total: newTotal, difficulty: currentDifficulty });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, stats, taskIndex, currentDifficulty, maxQuestions]);

  const handleDbDragDropComplete = useCallback(async (isCorrect: boolean) => {
    if (!question || !sessionId) return;
    setIsLoading(true);
    const timeSpent = timeStarted ? Math.round((Date.now() - timeStarted.getTime()) / 1000) : 0;
    try {
      const result: SubmitAnswerResult = await quizApi.submitAnswer({
        sessionId, questionId: question.questionId,
        dragDropIsCorrect: isCorrect, timeSpentSeconds: timeSpent,
      });
      const newTotal   = stats.total + 1;
      const newCorrect = stats.correct + (result.isCorrect ? 1 : 0);
      const newStreak  = result.isCorrect ? stats.streak + 1 : 0;
      setStats({ correct: newCorrect, total: newTotal, streak: newStreak });
      setCurrentDifficulty(result.newDifficulty);

      const newIndex = taskIndex + 1;
      setTaskIndex(newIndex);

      if (newTotal >= maxQuestions) {
        await finishSession(sessionId, newCorrect, newTotal, result.newDifficulty);
      } else {
        await fetchNextQuestion(sessionId, { correct: newCorrect, total: newTotal, difficulty: result.newDifficulty });
      }
    } catch (err) {
      console.error('handleDbDragDropComplete failed:', err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, sessionId, stats, taskIndex, timeStarted]);

  // ── Exit handlers ─────────────────────────────────────────────────────────

  const handleExitRequest = useCallback(() => {
    if (isFinished || !sessionId) {
      // Already done or no session — go straight back
      if (urlCourseId) navigate(`/courses/${urlCourseId}`);
      return;
    }
    setShowExitConfirm(true);
  }, [isFinished, sessionId, urlCourseId, navigate]);

  const handleExitConfirm = useCallback(async () => {
    if (sessionId) {
      try { await quizApi.endSession(sessionId); } catch { /* non-fatal */ }
    }
    if (urlCourseId) navigate(`/courses/${urlCourseId}`);
  }, [sessionId, urlCourseId, navigate]);

  const handleExitCancel = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  if (!token) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#0a0c12',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 16,
      }}>
        <p style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 16 }}>
          Please login to start quiz
        </p>
        <button onClick={() => navigate('/login')} style={btnTeal}>Go to Login</button>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0c12' }}>

      {/* VR entry button */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <VRButton
          style={{
            background: '#00e5c8', color: '#0a0c12', border: 'none',
            borderRadius: 6, padding: '8px 16px', fontFamily: 'monospace',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em',
          }}
        />
      </div>

      {/* Top-left label */}
      {!isXR && (
        <div style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          pointerEvents: isLocked ? 'none' : 'auto',
        }}>
          <div style={{
            color: '#e2e8f0', fontFamily: 'monospace', fontSize: 14,
            fontWeight: 600, letterSpacing: '0.05em',
            background: 'rgba(10,12,18,0.7)', padding: '6px 12px',
            borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
          }}>
            VR Test Scene
          </div>
        </div>
      )}

      {/* Crosshair */}
      {!isXR && isLocked && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 10,
          width: 8, height: 8, borderRadius: '50%',
          background: 'rgba(255,255,255,0.6)', pointerEvents: 'none',
        }} />
      )}

      {/* Unlock hint */}
      {!isXR && !isLocked && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 24, pointerEvents: 'none',
        }}>
          <div style={{
            color: 'rgba(226,232,240,0.45)', fontFamily: 'monospace', fontSize: 12,
            background: 'rgba(0,0,0,0.4)', padding: '5px 14px', borderRadius: 6,
          }}>
            Click scene to look around · ESC to interact
          </div>
        </div>
      )}

      {/* Movement hint */}
      {!isXR && isLocked && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none',
        }}>
          <div style={{
            color: 'rgba(226,232,240,0.6)', fontFamily: 'monospace', fontSize: 11,
            background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 4,
          }}>
            W/A/S/D to move · Shift to sprint · ↑↓ to fly · ESC to unlock
          </div>
        </div>
      )}

      {/* 3D canvas */}
      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        shadows="soft"
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <XR referenceSpace="local-floor" onSessionStart={handleXRStart} onSessionEnd={handleXREnd}>
          <Controllers
            hideRaysOnBlur={false}
            rayMaterial={{ color: '#00e5c8', transparent: true, opacity: 0.9 }}
            envMapIntensity={1}
          />
          <Hands />
          <KeyboardLocomotion />
          <XRLocomotion />
          <XRSpawnPoint position={[0, 0, 3]} />
          <XRThumbstickDebugToggle onToggle={() => setShowDebug((v) => !v)} />
          <Scene onLock={() => setIsLocked(true)} onUnlock={() => setIsLocked(false)} isXR={isXR} />

          <Float speed={1} rotationIntensity={0.08} floatIntensity={0.25}>
            {taskMode === 'dragdrop' && dragTask ? (
              <DragDropScene task={dragTask} onComplete={handleDragDropComplete} />
            ) : question?.questionType === 'dragdrop' && question.dragDropData ? (
              <TextDragDropScene question={question} onComplete={handleDbDragDropComplete} />
            ) : (
              <MainTaskPanel
                question={question}
                stats={stats}
                selectedAnswer={selectedAnswer}
                onSelect={setSelectedAnswer}
                onSubmit={submitAnswer}
                onStart={startQuiz}
                onExit={handleExitRequest}
                onExitConfirm={handleExitConfirm}
                onExitCancel={handleExitCancel}
                showExitConfirm={showExitConfirm}
                sessionId={sessionId}
                isLoading={isLoading}
                currentDifficulty={currentDifficulty}
                isFinished={isFinished}
                finalStats={finalStats}
                courses={courses}
                selectedCourseId={selectedCourseId}
                onSelectCourse={setSelectedCourseId}
                maxQuestions={maxQuestions}
                hasCourseParam={hasCourseParam}
                quizType={activeQuizType}
              />
            )}
          </Float>
          <PostProcessingEffects />

          <AIAssistantPanel difficulty={currentDifficulty} />
          <PerformancePanel stats={stats} />
          {showDebug && (
            <DebugPanel
              sessionId={sessionId}
              currentDifficulty={currentDifficulty}
              stats={stats}
              maxQuestions={maxQuestions}
              signalRStatus={signalRStatus}
              lastDifficultyEvent={lastDifficultyEvent}
              recentAttempts={attemptLog}
            />
          )}
        </XR>
      </Canvas>
    </div>
  );
}
