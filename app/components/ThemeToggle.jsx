'use client';

import { useTheme } from '../theme-provider';

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const nextMode = resolvedTheme === 'dark' ? 'light' : 'dark';
  const nextModeEmoji = nextMode === 'dark' ? '🌓' : '🌗';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextMode} mode`}
    >
      {nextModeEmoji}
    </button>
  );
}
