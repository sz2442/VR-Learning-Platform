import { Link } from 'react-router-dom';
import { Menu, X, GraduationCap, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks';
import { Button, ThemeToggle } from '@/components/ui';
import { cn } from '@/lib/utils';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();

  const navLinks = [
    { href: '/', label: 'Courses' },
    { href: '/my-learning', label: 'My Learning', auth: true },
  ];

  return (
    <header className="glass sticky top-0 z-50 border-b border-surface-200 dark:border-surface-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25 transition-transform group-hover:scale-105">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-xl font-bold">VR Meta</span>
              <span className="ml-1 text-xl font-light text-surface-500">University</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              (!link.auth || isAuthenticated) && (
                <Link
                  key={link.href}
                  to={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <div className="hidden items-center gap-3 md:flex">
                <div className="flex items-center gap-2 rounded-lg bg-surface-100 px-3 py-1.5 dark:bg-surface-800">
                  <User className="h-4 w-4 text-surface-500" />
                  <span className="text-sm font-medium">{user?.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-surface-500 hover:text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Sign up</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 md:hidden',
            mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
          )}
        >
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              (!link.auth || isAuthenticated) && (
                <Link
                  key={link.href}
                  to={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ))}
            
            <div className="mt-2 border-t border-surface-200 pt-2 dark:border-surface-700">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-surface-500">
                    <User className="h-4 w-4" />
                    {user?.name}
                  </div>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
