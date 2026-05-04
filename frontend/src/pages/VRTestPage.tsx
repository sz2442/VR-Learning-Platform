import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PointerLockControls, useGLTF, Text } from '@react-three/drei';
import { XR, Controllers, Hands, VRButton, Interactive, useController, useXR } from '@react-three/xr';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useAuthStore } from '@/stores/authStore';
import { quizApi } from '@/api/quiz';
import type { Question, SubmitAnswerResult, SessionStats } from '@/types';
import { generateShapeTask, validateDragDrop } from '@/utils/TaskGenerator';
import type { DragDropTask, ShapeItem, DropZone } from '@/utils/TaskGenerator';

// ─── constants ────────────────────────────────────────────────────────────────

const MAX_QUESTIONS = 10;
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

// ─── RotatingBox ──────────────────────────────────────────────────────────────

function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.8;
    meshRef.current.rotation.x += delta * 0.3;
  });
  return (
    <mesh ref={meshRef} position={[-2, 1.5, -4]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00e5c8" />
    </mesh>
  );
}

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
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 5, -2]} intensity={0.65} color="#c8e7ff" />
      <pointLight color="#ffffff" intensity={0.55} position={[-1.5, 1.8, -1]} />
      <pointLight color="#ffffff" intensity={0.4} position={[1.5, 1.4, -1]} />
      <Environment preset="city" background={false} />
      <RotatingBox />
      <GLBModel url="/models/Room.glb" position={[0, -1.25, 0]} scale={[1.5, 1.5, 1.5]} />
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
    const hasCtrl = axes != null && axes.length >= 2 &&
      (Math.abs(axes[0] ?? 0) > 0.25 || Math.abs(axes[1] ?? 0) > 0.25);

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
      const ax = axes[0] ?? 0;
      const ay = axes[1] ?? 0;
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
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[width + 0.012, height + 0.012]} />
        <meshStandardMaterial color="#00e5c8" transparent opacity={0.2} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0e1220" transparent opacity={0.92} />
      </mesh>
    </>
  );
}

// ─── Shape3D ──────────────────────────────────────────────────────────────────

function Shape3D({ item, position, onSelect, isGrabbed, isPlaced }: {
  item: ShapeItem;
  position: [number, number, number];
  onSelect: (id: string) => void;
  isGrabbed: boolean;
  isPlaced: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current && isGrabbed) {
      meshRef.current.rotation.y += delta * 3;
    }
  });

  if (isPlaced) return null;

  return (
    <group position={position}>
      <Interactive onSelect={() => onSelect(item.id)}>
        <mesh ref={meshRef} scale={isGrabbed ? 1.25 : 1}>
          {item.shape === 'triangle' && <coneGeometry args={[0.12, 0.2, 3]} />}
          {item.shape === 'square'   && <boxGeometry args={[0.18, 0.18, 0.04]} />}
          {item.shape === 'circle'   && <sphereGeometry args={[0.11, 16, 16]} />}
          <meshStandardMaterial
            color={item.color}
            emissive={isGrabbed ? item.color : '#000000'}
            emissiveIntensity={isGrabbed ? 0.5 : 0}
          />
        </mesh>
      </Interactive>
      {isGrabbed && (
        <mesh position={[0, -0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.09, 0.13, 24]} />
          <meshStandardMaterial color="#00e5c8" transparent opacity={0.7} />
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
  return (
    <group position={[zone.position.x, zone.position.y, zone.position.z]}>
      {/* platform */}
      <Interactive onSelect={() => onSelect(zone.id)}>
        <mesh>
          <boxGeometry args={[0.4, 0.02, 0.4]} />
          <meshStandardMaterial color={isActive ? '#00e5c8' : '#1e293b'} transparent opacity={isActive ? 0.9 : 0.7} />
        </mesh>
      </Interactive>
      {/* border glow */}
      <mesh position={[0, -0.002, 0]}>
        <boxGeometry args={[0.42, 0.018, 0.42]} />
        <meshStandardMaterial color="#00e5c8" transparent opacity={isActive ? 0.5 : 0.12} />
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
  const [grabbedShape, setGrabbedShape] = useState<string | null>(null);

  // reset when task changes
  useEffect(() => {
    setPlacements(new Map());
    setGrabbedShape(null);
  }, [task.taskId]);

  const handleShapeSelect = (shapeId: string) => {
    if (placements.has(shapeId)) return;
    setGrabbedShape((prev) => (prev === shapeId ? null : shapeId));
  };

  const handleZoneSelect = (zoneId: string) => {
    if (!grabbedShape) return;
    setPlacements((prev) => new Map(prev).set(grabbedShape, zoneId));
    setGrabbedShape(null);
  };

  const handleSubmit = () => {
    onComplete(validateDragDrop(task, placements));
  };

  const remaining = task.shapes.length - placements.size;
  const allPlaced = remaining === 0;
  const count = task.shapes.length;

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
          isActive={grabbedShape !== null}
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
            onSelect={handleShapeSelect}
            isGrabbed={grabbedShape === shape.id}
            isPlaced={placements.has(shape.id)}
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
      {grabbedShape && (
        <group position={[0, 0.72, -2.0]}>
          <Text fontSize={0.034} color="#a78bfa" anchorX="center">
            Now select a zone to drop it
          </Text>
        </group>
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
  sessionId: number | null;
  isLoading: boolean;
  currentDifficulty: number;
  isFinished: boolean;
  finalStats: SessionStats | null;
}

function MainTaskPanel({
  question, stats, selectedAnswer, onSelect, onSubmit, onStart,
  sessionId, isLoading, currentDifficulty, isFinished, finalStats,
}: MainTaskPanelProps) {
  const progressFill = 1.2 * (stats.total / MAX_QUESTIONS);
  const progressFillX = -1.2 / 2 + progressFill / 2;

  if (isFinished && finalStats) {
    return (
      <group position={[0, 1.5, -2.2]}>
        <PanelBg width={1.4} height={0.8} />
        <Text position={[0, 0.28, 0.01]} fontSize={0.058} color="#00e5c8" anchorX="center" fontWeight="bold">
          Quiz Complete!
        </Text>
        <Text position={[0, 0.12, 0.01]} fontSize={0.04} color="#e2e8f0" anchorX="center">
          {`Score: ${finalStats.correctAnswers} / ${finalStats.totalQuestions}`}
        </Text>
        <Text position={[0, 0.0, 0.01]} fontSize={0.04} color="#e2e8f0" anchorX="center">
          {`Accuracy: ${finalStats.accuracy.toFixed(1)}%`}
        </Text>
        <Text position={[0, -0.12, 0.01]} fontSize={0.04} color="#a78bfa" anchorX="center">
          {`Final Difficulty: ${finalStats.finalDifficulty}/10`}
        </Text>
        <group position={[0, -0.28, 0.01]}>
          <Interactive onSelect={onStart}>
            <mesh>
              <planeGeometry args={[0.6, 0.1]} />
              <meshStandardMaterial color="#00e5c8" />
            </mesh>
          </Interactive>
          <Text position={[0, 0, 0.02]} fontSize={0.048} color="#0a0c12" anchorX="center">
            Play Again
          </Text>
        </group>
      </group>
    );
  }

  if (!sessionId || !question) {
    return (
      <group position={[0, 1.5, -2.2]}>
        <PanelBg width={1.4} height={0.6} />
        <Text position={[0, 0.18, 0.01]} fontSize={0.058} color="#00e5c8" anchorX="center" fontWeight="bold">
          VR Quiz
        </Text>
        <Text position={[0, 0.04, 0.01]} fontSize={0.036} color="#64748b" anchorX="center">
          Adaptive difficulty · 10 questions
        </Text>
        <group position={[0, -0.1, 0.01]}>
          <Interactive onSelect={onStart}>
            <mesh>
              <planeGeometry args={[0.6, 0.1]} />
              <meshStandardMaterial color="#00e5c8" transparent opacity={isLoading ? 0.5 : 1} />
            </mesh>
          </Interactive>
          <Text position={[0, 0, 0.02]} fontSize={0.048} color="#0a0c12" anchorX="center">
            {isLoading ? 'Loading...' : 'Start Quiz'}
          </Text>
        </group>
      </group>
    );
  }

  return (
    <group position={[0, 1.5, -2.2]}>
      <PanelBg width={1.4} height={1.2} />

      <Text position={[-0.55, 0.42, 0.01]} fontSize={0.04} color="#64748b" anchorX="left">
        {`Question ${stats.total + 1} of ${MAX_QUESTIONS}`}
      </Text>
      <Text position={[0.55, 0.42, 0.01]} fontSize={0.04} color="#a78bfa" anchorX="right">
        {`Difficulty: ${currentDifficulty}/10`}
      </Text>

      {/* progress bar */}
      <mesh position={[0, 0.35, 0.01]}>
        <planeGeometry args={[1.2, 0.015]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {stats.total > 0 && (
        <mesh position={[progressFillX, 0.35, 0.02]}>
          <planeGeometry args={[progressFill, 0.015]} />
          <meshStandardMaterial color="#00e5c8" />
        </mesh>
      )}

      <Text position={[0, 0.18, 0.01]} fontSize={0.052} color="#e2e8f0" maxWidth={1.2} textAlign="center" anchorX="center">
        {question.text}
      </Text>

      {question.answers.map((ans, idx) => {
        const isSelected = selectedAnswer === ans.answerId;
        const yPos = 0.0 - idx * 0.13;
        return (
          <group key={ans.answerId} position={[0, yPos, 0.01]}>
            {isSelected && (
              <mesh position={[0, 0, 0.005]}>
                <planeGeometry args={[1.21, 0.112]} />
                <meshStandardMaterial color="#00e5c8" transparent opacity={0.25} />
              </mesh>
            )}
            <Interactive onSelect={() => onSelect(ans.answerId)}>
              <mesh>
                <planeGeometry args={[1.2, 0.11]} />
                <meshStandardMaterial color={isSelected ? '#0d2d2d' : '#111827'} transparent opacity={0.95} />
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
  const token = useAuthStore.getState().token;

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

  // drag-drop state
  const [taskMode, setTaskMode]   = useState<'mcq' | 'dragdrop'>('mcq');
  const [dragTask, setDragTask]   = useState<DragDropTask | null>(null);
  const [taskIndex, setTaskIndex] = useState(0);

  const handleXRStart = useCallback(() => { setIsXR(true); setIsLocked(false); }, []);
  const handleXREnd   = useCallback(() => { setIsXR(false); }, []);

  const fetchNextQuestion = async (sid: number) => {
    try {
      const q = await quizApi.getNextQuestion(sid);
      setQuestion(q);
      setCurrentDifficulty(q.difficultyLevel);
      setSelectedAnswer(null);
      setTimeStarted(new Date());
    } catch (err) {
      console.error('fetchNextQuestion failed:', err);
    }
  };

  const startQuiz = async () => {
    setIsLoading(true);
    setIsFinished(false);
    setFinalStats(null);
    setStats({ correct: 0, total: 0, streak: 0 });
    setCurrentDifficulty(5);
    setTaskMode('mcq');
    setDragTask(null);
    setTaskIndex(0);
    try {
      const session = await quizApi.startSession(1);
      setSessionId(session.sessionId);
      await fetchNextQuestion(session.sessionId);
    } catch (err) {
      console.error('startQuiz failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const finishSession = async (sid: number, newCorrect: number, newTotal: number, newDifficulty: number) => {
    try {
      const sessionStats = await quizApi.getStats(sid);
      setFinalStats(sessionStats);
    } catch {
      // fallback if stats endpoint fails
      setFinalStats({
        totalQuestions: newTotal,
        correctAnswers: newCorrect,
        accuracy: newTotal === 0 ? 0 : (newCorrect / newTotal) * 100,
        finalDifficulty: newDifficulty,
      });
    }
    setIsFinished(true);
    setQuestion(null);
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

      const newIndex = taskIndex + 1;
      setTaskIndex(newIndex);

      if (newTotal >= MAX_QUESTIONS) {
        await finishSession(sessionId, newCorrect, newTotal, result.newDifficulty);
      } else if (newIndex % 2 === 1) {
        // every odd question → drag-drop interlude
        setDragTask(generateShapeTask(result.newDifficulty, newIndex));
        setTaskMode('dragdrop');
      } else {
        await fetchNextQuestion(sessionId);
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

    if (newTotal >= MAX_QUESTIONS) {
      await finishSession(sessionId, newCorrect, newTotal, currentDifficulty);
    } else {
      setTaskMode('mcq');
      setDragTask(null);
      await fetchNextQuestion(sessionId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, stats, taskIndex, currentDifficulty]);

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
        camera={{ position: [0, 1.6, 0], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
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
          <Scene onLock={() => setIsLocked(true)} onUnlock={() => setIsLocked(false)} isXR={isXR} />

          {taskMode === 'dragdrop' && dragTask ? (
            <DragDropScene task={dragTask} onComplete={handleDragDropComplete} />
          ) : (
            <MainTaskPanel
              question={question}
              stats={stats}
              selectedAnswer={selectedAnswer}
              onSelect={setSelectedAnswer}
              onSubmit={submitAnswer}
              onStart={startQuiz}
              sessionId={sessionId}
              isLoading={isLoading}
              currentDifficulty={currentDifficulty}
              isFinished={isFinished}
              finalStats={finalStats}
            />
          )}

          <AIAssistantPanel difficulty={currentDifficulty} />
          <PerformancePanel stats={stats} />
        </XR>
      </Canvas>
    </div>
  );
}
