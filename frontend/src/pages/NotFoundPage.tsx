import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

export function NotFoundPage() {
  const { t } = useTranslation('errors');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-9xl font-bold text-primary-500">404</h1>
        <h2 className="mt-4 font-display text-3xl font-bold text-surface-900 dark:text-white">
          {t('pageNotFound')}
        </h2>
        <p className="mt-2 text-surface-600 dark:text-surface-400">
          {t('pageNotFoundDesc')}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button as={Link} to="/" className="gap-2">
            <Home className="h-4 w-4" />
            {t('goHome')}
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('goBack')}
          </Button>
        </div>
      </div>
    </div>
  );
}
