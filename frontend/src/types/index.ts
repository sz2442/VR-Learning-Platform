// Auth types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  role: 'Student' | 'Instructor' | 'Admin';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
}

// Course types
export interface Course {
  id: number;
  title: string;
  shortDescription: string;
  imageUrl: string;
  durationMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface CourseDetail extends Course {
  description: string;
  isPublished: boolean;
  createdAt: string;
}

// Quiz types
export interface AnswerOption {
  answerId: number;
  text: string;
}

export interface DDItem { id: string; text: string; }
export interface DDZone { id: string; label: string; correctItemId: string; }
export interface DragDropData { items: DDItem[]; zones: DDZone[]; }

export interface Question {
  questionId: number;
  text: string;
  difficultyLevel: number;
  questionType: 'mcq' | 'dragdrop';
  dragDropData?: DragDropData;
  answers: AnswerOption[];
}

export interface SubmitAnswerDto {
  sessionId: number;
  questionId: number;
  selectedAnswerId?: number;
  dragDropIsCorrect?: boolean;
  timeSpentSeconds: number;
}

export interface SubmitAnswerResult {
  isCorrect: boolean;
  newDifficulty: number;
  feedback: string;
}

export interface SessionStats {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  finalDifficulty: number;
}

export interface QuizSession {
  sessionId: number;
  quizType: string | null;   // "mini" | "final" | null
  maxQuestions: number;      // 8 / 20 / 10
}

export interface VrQuizResult {
  moduleId: number;
  courseId: number;
  passed: boolean;
  accuracy: number;
  score: number;
  completedAt: string;
}

// API Response wrapper
export interface ApiError {
  message: string;
  status?: number;
}

// Course structure types
export interface LessonSummary {
  id: number;
  title: string;
  orderIndex: number;
  isCompleted: boolean;
}

export interface LessonContent {
  id: number;
  moduleId: number;
  title: string;
  contentText: string;
  videoUrl: string | null;
  orderIndex: number;
}

export interface MiniQuizSummary {
  id: number;
  passingScore: number;
  isRequired: boolean;
  isPassed: boolean;
}

export interface CourseModule {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  isLocked: boolean;
  lessons: LessonSummary[];
  miniQuiz: MiniQuizSummary | null;
}

export interface CourseStructure {
  courseId: number;
  title: string;
  modules: CourseModule[];
  hasFinalQuiz: boolean;
  finalQuizUnlocked: boolean;
  totalLessons: number;
  completedLessons: number;
}

export interface MiniQuizAnswer {
  answerId: number;
  text: string;
}

export interface MiniQuizQuestion {
  questionId: number;
  text: string;
  difficultyLevel: number;
  questionType: 'mcq' | 'dragdrop';
  dragDropData?: DragDropData;
  answers: MiniQuizAnswer[];
}

export interface SubmitMiniQuizAnswer {
  questionId: number;
  selectedAnswerId?: number;
  dragDropIsCorrect?: boolean;
}

export interface MiniQuizResult {
  passed: boolean;
  score: number;
  passingScore: number;
  correctAnswers: number;
  totalQuestions: number;
  nextModuleUnlocked: boolean;
}

// Progress types
export interface LessonProgress {
  lessonId: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface ModuleProgress {
  moduleId: number;
  isLocked: boolean;
  miniQuizPassed: boolean;
  lessons: LessonProgress[];
}

export interface CourseProgress {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  finalQuizUnlocked: boolean;
  modules: ModuleProgress[];
}

// Dashboard types
export interface StudentStats {
  totalSessions: number;
  totalQuestionsAnswered: number;
  averageAccuracy: number;
  totalTimeSpentMinutes: number;
  currentStreak: number;
  bestDifficultyReached: number;
  favoriteCategory: string;
  memberSince: string;
}

export interface CourseProgressSummary {
  courseId: number;
  courseTitle: string;
  modulesCompleted: number;
  modulesTotal: number;
  completionPercentage: number;
  bestDifficulty: number;
  lastSessionDate: string | null;
  averageAccuracy: number;
}

export interface ActivityEntry {
  sessionId: number;
  courseTitle: string;
  date: string;
  questionsAnswered: number;
  accuracy: number;
  finalDifficulty: number;
  durationMinutes: number;
}

export interface AccuracyPoint {
  sessionNumber: number;
  accuracy: number;
  difficulty: number;
}
