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

export interface Question {
  questionId: number;
  text: string;
  difficultyLevel: number;
  answers: AnswerOption[];
}

export interface SubmitAnswerDto {
  sessionId: number;
  questionId: number;
  selectedAnswerId: number;
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
  currentDifficulty: number;
}

export interface QuizSession {
  sessionId: number;
}

// API Response wrapper
export interface ApiError {
  message: string;
  status?: number;
}
