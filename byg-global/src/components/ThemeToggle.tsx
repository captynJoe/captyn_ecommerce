"use client";

import { Moon, Sun } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export default function ThemeToggle() {
  const { isDark, setIsDark } = useApp();

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        <>
          <Moon className="w-5 h-5" />
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="w-5 h-5" />
          <span>Light Mode</span>
        </>
      )}
    </button>
  );
}
