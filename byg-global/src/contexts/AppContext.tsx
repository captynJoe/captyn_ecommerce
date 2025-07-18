'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AppContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sort: string;
  setSort: (sort: string) => void;
  filterCondition: string;
  setFilterCondition: (condition: string) => void;
  priceRange: { min: number; max: number };
  setPriceRange: (range: { min: number; max: number }) => void;
  rating: number;
  setRating: (rating: number) => void;
  networkType: string;
  setNetworkType: (type: string) => void;
  onFilterChange: () => void;
  setOnFilterChange: (callback: () => void) => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('bestMatch');
  const [filterCondition, setFilterCondition] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [rating, setRating] = useState(90);
  const [networkType, setNetworkType] = useState('all');
  const [onFilterChange, setOnFilterChange] = useState<() => void>(() => () => {});
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      }
    }
  }, []);

  // Update theme when isDark changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <AppContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        sort,
        setSort,
        filterCondition,
        setFilterCondition,
        priceRange,
        setPriceRange,
        rating,
        setRating,
        networkType,
        setNetworkType,
        onFilterChange,
        setOnFilterChange,
        isDark,
        setIsDark,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
