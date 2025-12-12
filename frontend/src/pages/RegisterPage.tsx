import { Navigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { RegisterForm } from '@/components/auth';
import { useAuthStore } from '@/stores/authStore';

export function RegisterPage() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Decoration */}
      <div className="hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 lg:block lg:flex-1">
        <div className="flex h-full items-center justify-center p-12">
          <div className="max-w-lg text-center text-white">
            <h2 className="font-display text-4xl font-bold">Start Your Learning Journey</h2>
            <p className="mt-4 text-lg text-white/80">
              Join thousands of learners who are mastering new skills 
              with our adaptive learning platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold">VR Meta University</span>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
