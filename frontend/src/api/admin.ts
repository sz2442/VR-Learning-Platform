import apiClient from './client';

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

export const adminApi = {
  getMlPredictions: (count = 20): Promise<MlPredictionsResponse> =>
    apiClient.get(`/admin/ml-predictions?count=${count}`).then((r) => r.data),

  getMlStatus: (): Promise<MlStatusResponse> =>
    apiClient.get('/admin/ml-status').then((r) => r.data),

  sendTestPrediction: (): Promise<TestPredictionResponse> =>
    apiClient.post('/admin/ml-test').then((r) => r.data),
};
