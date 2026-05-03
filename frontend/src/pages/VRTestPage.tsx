import { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointerLockControls, useGLTF, Text } from '@react-three/drei';
import { XR, Controllers, Hands, VRButton, Interactive } from '@react-three/xr';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useAuthStore } from '@/stores/authStore';
import { quizApi } from '@/api/quiz';
import type { Question, SubmitAnswerResult, SessionStats } from '@/types';

// ─── constants ────────────────────────────────────────────────────────────────

const MAX_QUESTIONS = 10;
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

// ─── types ────────────────────────────────────────────────────────────────────

interface QuizStats {
  correct: number;
  total: number;
  streak: number;
}

// ─── 3D scene helpers ─────────────────────────────────────────────────────────

export function GLBModel({ url, position = [0, 0, 0] }: { url: string; position?: [number, number, number] }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} position={position} />;
}

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

interface SceneProps {
  onLock: () => void;
  onUnlock: () => void;
  isXR: boolean;
}

function Scene({ onLock, onUnlock, isXR }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight color="#ffaa44" intensity={2} position={[-1.5, 2, -1]} />
      <pointLight color="#4466ff" intensity={0.5} position={[2, 2, -3]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#2a1f14" />
      </mesh>
      <RotatingBox />
      <GLBModel url="/models/Room.glb" position={[0, -2, 0]} />
      {!isXR && <PointerLockControls onLock={onLock} onUnlock={onUnlock} />}
    </>
  );
}

function difficultyLabel(level: number): string {
  if (level <= 3) return 'Easy';
  if (level <= 6) return 'Medium';
  return 'Hard';
}

// ─── Panel background helper ──────────────────────────────────────────────────

function PanelBg({ width, height }: { width: number; height: number }) {
  return (
    <>
      {/* border glow plane behind */}
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

  // Finished screen
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

  // Start screen
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

  // Active quiz screen
  return (
    <group position={[0, 1.5, -2.2]}>
      <PanelBg width={1.4} height={1.2} />

      {/* Progress text */}
      <Text position={[-0.55, 0.42, 0.01]} fontSize={0.04} color="#64748b" anchorX="left">
        {`Question ${stats.total + 1} of ${MAX_QUESTIONS}`}
      </Text>

      {/* Difficulty badge */}
      <Text position={[0.55, 0.42, 0.01]} fontSize={0.04} color="#a78bfa" anchorX="right">
        {`Difficulty: ${currentDifficulty}/10`}
      </Text>

      {/* Progress bar background */}
      <mesh position={[0, 0.35, 0.01]}>
        <planeGeometry args={[1.2, 0.015]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Progress bar fill */}
      {stats.total > 0 && (
        <mesh position={[progressFillX, 0.35, 0.02]}>
          <planeGeometry args={[progressFill, 0.015]} />
          <meshStandardMaterial color="#00e5c8" />
        </mesh>
      )}

      {/* Question text */}
      <Text
        position={[0, 0.18, 0.01]}
        fontSize={0.052}
        color="#e2e8f0"
        maxWidth={1.2}
        textAlign="center"
        anchorX="center"
      >
        {question.text}
      </Text>

      {/* Answer buttons */}
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
                <meshStandardMaterial
                  color={isSelected ? '#0d2d2d' : '#111827'}
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

      {/* Submit button */}
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
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.048}
          color={selectedAnswer !== null ? '#0a0c12' : '#334155'}
          anchorX="center"
        >
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

  const [isLocked, setIsLocked] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [stats, setStats] = useState<QuizStats>({ correct: 0, total: 0, streak: 0 });
  const [currentDifficulty, setCurrentDifficulty] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [finalStats, setFinalStats] = useState<SessionStats | null>(null);
  const [isXR, setIsXR] = useState(false);

  const handleXRStart = useCallback(() => { setIsXR(true); setIsLocked(false); }, []);
  const handleXREnd = useCallback(() => { setIsXR(false); }, []);

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

  const submitAnswer = async () => {
    if (selectedAnswer === null || !question || !sessionId) return;
    setIsLoading(true);
    const timeSpent = timeStarted ? Math.round((Date.now() - timeStarted.getTime()) / 1000) : 0;
    try {
      const result: SubmitAnswerResult = await quizApi.submitAnswer({
        sessionId, questionId: question.questionId,
        selectedAnswerId: selectedAnswer, timeSpentSeconds: timeSpent,
      });
      const newTotal = stats.total + 1;
      const newCorrect = stats.correct + (result.isCorrect ? 1 : 0);
      const newStreak = result.isCorrect ? stats.streak + 1 : 0;
      setStats({ correct: newCorrect, total: newTotal, streak: newStreak });
      setCurrentDifficulty(result.newDifficulty);
      if (newTotal >= MAX_QUESTIONS) {
        const sessionStats = await quizApi.getStats(sessionId);
        setFinalStats(sessionStats);
        setIsFinished(true);
        setQuestion(null);
      } else {
        await fetchNextQuestion(sessionId);
      }
    } catch (err) {
      console.error('submitAnswer failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Crosshair when pointer-locked */}
      {!isXR && isLocked && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 10,
          width: 8, height: 8, borderRadius: '50%',
          background: 'rgba(255,255,255,0.6)', pointerEvents: 'none',
        }} />
      )}

      {/* Mouse hint */}
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

      {/* 3D canvas */}
      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
      >
        <XR onSessionStart={handleXRStart} onSessionEnd={handleXREnd}>
          <Controllers />
          <Hands />
          <Scene onLock={() => setIsLocked(true)} onUnlock={() => setIsLocked(false)} isXR={isXR} />
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
          <AIAssistantPanel difficulty={currentDifficulty} />
          <PerformancePanel stats={stats} />
        </XR>
      </Canvas>
    </div>
  );
}
