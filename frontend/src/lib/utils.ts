import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDifficultyColor(level: number): string {
  if (level <= 3) return 'difficulty-easy';
  if (level <= 6) return 'difficulty-medium';
  return 'difficulty-hard';
}

export function getDifficultyLabel(level: number): string {
  if (level <= 3) return 'Easy';
  if (level <= 6) return 'Medium';
  return 'Hard';
}

export function getDifficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300';
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatAccuracy(accuracy: number): string {
  return `${Math.round(accuracy)}%`;
}

export function parseJwt(token: string): { exp: number; [key: string]: unknown } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}
