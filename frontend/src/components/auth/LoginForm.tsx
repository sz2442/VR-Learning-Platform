import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '@/components/ui';
import { useLogin } from '@/hooks';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation('auth');

  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl font-bold">{t('welcomeBack')}</h1>
        <p className="text-surface-500 mt-1">{t('signInToContinue')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            id="email"
            type="email"
            label={t('email')}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Mail className="absolute right-3 top-9 h-5 w-5 text-surface-400" />
        </div>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            label={t('password')}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-surface-400 hover:text-surface-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isPending}
        >
          {t('signIn')}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-surface-500">
        {t('noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
          {t('signUpLink')}
        </Link>
      </div>
    </Card>
  );
}
