'use client';

import { useTheme } from '../theme-provider';

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const nextMode = resolvedTheme === 'dark' ? 'Light' : 'Dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextMode.toLowerCase()} mode`}
    >
      {nextMode} mode
    </button>
  );
}
