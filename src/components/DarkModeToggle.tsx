'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-all duration-200 hover-lift active:scale-95"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme === 'light' ? '#F3F4F6' : '#374151';
        e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
      }}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300 transition-transform duration-200" />
      ) : (
        <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300 transition-transform duration-200" />
      )}
    </button>
  );
}