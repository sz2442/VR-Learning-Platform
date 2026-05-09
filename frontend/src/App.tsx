import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import { Layout, QuizLayout, ProtectedRoute } from '@/components/layout';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  CourseDetailPage,
  QuizPage,
  MyLearningPage,
  NotFoundPage,
  VRTestPage,
  MlDebugPage,
  DashboardPage,
} from '@/pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes with main layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          </Route>

          {/* Auth routes (no layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* VR test — public, no layout (legacy route, course selector shown) */}
          <Route path="/vr-test" element={<VRTestPage />} />

          {/* Protected routes with main layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/my-learning" element={<MyLearningPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          </Route>

          {/* VR quiz routes — protected, no layout */}
          <Route element={<ProtectedRoute />}>
            {/* Mini quiz: /vr-quiz/:courseId/:moduleId/:quizType (e.g. /vr-quiz/1/3/mini) */}
            <Route path="/vr-quiz/:courseId/:moduleId/:quizType" element={<VRTestPage />} />
            {/* Final quiz: /vr-quiz/:courseId/:quizType (e.g. /vr-quiz/1/final) */}
            <Route path="/vr-quiz/:courseId/:quizType" element={<VRTestPage />} />
          </Route>

          {/* Quiz routes (minimal layout) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<QuizLayout />}>
              <Route path="/quiz/:sessionId" element={<QuizPage />} />
            </Route>
          </Route>

          {/* Admin routes — protected, no layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/ml-debug" element={<MlDebugPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-surface-50)',
            color: 'var(--color-surface-900)',
            border: '1px solid var(--color-surface-200)',
          },
        }}
      />

      {/* React Query Devtools (only in development) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
