import apiClient from './client';

// ── ML Debug types ─────────────────────────────────────────────────────────

export interface PredictionLogEntry {
  sessionId: number;
  currentDifficulty: number;
  predictedDifficulty: number;
  confidence: number;
  source: string;
  timestamp: string;
}

export interface MlPredictionsResponse {
  total: number;
  predictions: PredictionLogEntry[];
}

export interface MlStatusResponse {
  reachable: boolean;
  status: string;
  model_loaded?: boolean;
  model_version?: string;
  uptime_seconds?: number;
  error?: string;
}

export interface TestPredictionResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// ── Platform stats types ───────────────────────────────────────────────────

export interface PlatformStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  activeSessionsToday: number;
  totalSessionsAllTime: number;
  averageAccuracyPlatform: number;
  totalQuestionsAnswered: number;
}

// ── User management types ──────────────────────────────────────────────────

export interface AdminUser {
  userId: number;
  email: string;
  role: string;
  createdAt: string;
  totalSessions: number;
  isActive: boolean;
}

// ── Course management types ────────────────────────────────────────────────

export interface AdminCourse {
  courseId: number;
  title: string;
  isPublished: boolean;
  totalStudents: number;
  averageAccuracy: number;
}

// ── API methods ────────────────────────────────────────────────────────────

export const adminApi = {
  // ML debug
  getMlPredictions: (count = 20): Promise<MlPredictionsResponse> =>
    apiClient.get(`/admin/ml-predictions?count=${count}`).then((r) => r.data),

  getMlStatus: (): Promise<MlStatusResponse> =>
    apiClient.get('/admin/ml-status').then((r) => r.data),

  sendTestPrediction: (): Promise<TestPredictionResponse> =>
    apiClient.post('/admin/ml-test').then((r) => r.data),

  // Platform stats
  getPlatformStats: (): Promise<PlatformStats> =>
    apiClient.get('/admin/platform-stats').then((r) => r.data),

  // User management
  getUsers: (): Promise<AdminUser[]> =>
    apiClient.get('/admin/users').then((r) => r.data),

  updateUserRole: (id: number, role: string): Promise<void> =>
    apiClient.put(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  deactivateUser: (id: number): Promise<void> =>
    apiClient.put(`/admin/users/${id}/deactivate`).then((r) => r.data),

  // Course management
  getCourses: (): Promise<AdminCourse[]> =>
    apiClient.get('/admin/courses').then((r) => r.data),

  togglePublish: (id: number): Promise<{ isPublished: boolean }> =>
    apiClient.put(`/admin/courses/${id}/publish`).then((r) => r.data),
};
