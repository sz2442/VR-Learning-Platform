import { GraduationCap, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation('nav');

  return (
    <footer className="border-t border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-display text-xl font-bold">VR Meta</span>
                <span className="ml-1 text-xl font-light text-surface-500">University</span>
              </div>
            </Link>
            <p className="mt-4 max-w-md text-sm text-surface-500">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-semibold">{t('platform')}</h4>
            <ul className="space-y-2 text-sm text-surface-500">
              <li><Link to="/" className="hover:text-primary-500 transition-colors">{t('courses')}</Link></li>
              <li><Link to="/my-learning" className="hover:text-primary-500 transition-colors">{t('myLearning')}</Link></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">{t('about')}</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-4 font-semibold">{t('connect')}</h4>
            <div className="flex gap-3">
              <a href="#" className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-surface-200 pt-8 text-center text-sm text-surface-400 dark:border-surface-800">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
