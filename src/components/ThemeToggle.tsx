import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 relative z-[70] lg:relative transition-colors rounded-md"
      aria-label="Toggle theme"
    >
      <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute left-2 top-2 h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
