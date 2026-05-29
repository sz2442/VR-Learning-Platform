import { Navigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/components/auth';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation('auth');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold">VR Meta University</span>
          </div>

          <LoginForm />
        </div>
      </div>

      {/* Right side - Decoration */}
      <div className="hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 lg:block lg:flex-1">
        <div className="flex h-full items-center justify-center p-12">
          <div className="max-w-lg text-center text-white">
            <h2 className="font-display text-4xl font-bold">{t('learnSmarter')}</h2>
            <p className="mt-4 text-lg text-white/80">{t('learnSmarterDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
