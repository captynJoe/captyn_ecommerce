"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import Image from "next/image";
import { Menu, Search, X } from "lucide-react";

interface NavbarProps {
  onMenuOpenAction?: () => void;
  onSearchAction?: (query: string) => void;
  showSearch?: boolean;
  className?: string;
}

export default function Navbar({
  onMenuOpenAction,
  onSearchAction,
  showSearch = true,
  className = "",
}: NavbarProps) {
  const { isDark } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      const input = searchQuery.trim();
      if (!input) {
        setSuggestions([]);
        return;
      }
      // Fetch dynamic suggestions from API
      fetch(`/api/products/ebay?q=${encodeURIComponent(input)}&limit=10`)
        .then(res => res.json())
        .then(data => {
          // Get unique product titles that match the input
          const apiTitles = (data.itemSummaries || [])
            .map((item: any) => item.title)
            .filter((title: string, i: number, arr: string[]) =>
              title.toLowerCase().includes(input.toLowerCase()) &&
              arr.findIndex(t => t.toLowerCase() === title.toLowerCase()) === i
            );
          setSuggestions(apiTitles);
        })
        .catch(() => setSuggestions([]));
    }, 200);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchQuery]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (onSearchAction && searchQuery.trim()) {
      onSearchAction(searchQuery.trim());
      setIsSearchOpen(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    if (onSearchAction) {
      onSearchAction(suggestion);
    }
    setIsSearchOpen(false);
    setSuggestions([]);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]');
        searchInput?.focus();
      }, 100);
    } else {
      setSearchQuery("");
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchForm = document.querySelector('.search-form');
      const searchButton = document.querySelector('.search-button');
      if (
        isSearchOpen &&
        searchForm &&
        !searchForm.contains(event.target as Node) &&
        searchButton &&
        !searchButton.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  return (
    <header className={`sticky top-0 z-50 ${className}`}>
      <div className={`w-full ${isDark ? "bg-black" : "bg-white"} shadow-md`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col w-full">
            <div className="h-32 sm:h-36 md:h-40 flex items-center justify-between px-5 sm:px-6 md:px-8">
              {/* Menu Button */}
              <div className="flex items-center min-w-0">
                {onMenuOpenAction && (
                  <button
                    onClick={onMenuOpenAction}
                    className={`p-2.5 sm:p-3 rounded-xl transition-colors hover:bg-gray-800/30 touch-manipulation ${isDark ? "text-white" : "text-black"}`}
                    aria-label="Open menu"
                  >
                    <Menu className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                )}
              </div>
              {/* Logo */}
              <div className="flex items-center justify-center flex-1">
                <a
                  href="/"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/";
                  }}
                >
                  <Image
                    src={isDark ? "/captynlogo.png" : "/captynlogo-white.png"}
                    alt="Captyn Logo"
                    width={140}
                    height={56}
                    className={`drop-shadow-lg w-24 h-auto sm:w-28 md:w-32 lg:w-36 select-none pointer-events-none`}
                    priority
                    quality={100}
                    style={{ objectFit: 'contain', imageRendering: 'crisp-edges' }}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </a>
              </div>
              {/* Search Button */}
              <div className="flex items-center min-w-0">
                {showSearch && (
                  <button
                    onClick={toggleSearch}
                    className={`p-2.5 sm:p-3 rounded-xl transition-colors hover:bg-gray-800/30 search-button touch-manipulation ${isDark ? "text-white" : "text-black"}`}
                    aria-label="Toggle search"
                  >
                    <Search className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                )}
              </div>
            </div>
            {/* Search Form */}
            {showSearch && isSearchOpen && (
              <div className="flex flex-col justify-center items-center pb-6 sm:pb-7 px-4 sm:px-6 relative">
                <form onSubmit={handleSearch} className="w-full max-w-sm search-form" autoComplete="off">
                  <div className={`relative rounded-xl shadow-sm ${isDark ? "bg-gray-900/80" : "bg-white/95"}`}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className={`w-full pl-4 pr-12 py-2.5 text-sm bg-transparent rounded-xl ${
                        isDark 
                          ? "text-white placeholder-gray-400 focus:ring-1 focus:ring-gray-600" 
                          : "text-black placeholder-gray-500 focus:ring-1 focus:ring-gray-200"
                      } focus:outline-none transition-all duration-200`}
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      inputMode="search"
                      style={{ fontSize: '16px' }}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (relatedTarget && relatedTarget.closest('.search-form')) {
                          e.target.focus();
                        }
                      }}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <button
                        type="submit"
                        className={`p-1.5 transition-colors rounded-md hover:bg-gray-100/10 ${isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-black"}`}
                        aria-label="Search"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={toggleSearch}
                        className={`p-1.5 transition-colors rounded-md hover:bg-gray-100/10 ${isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-black"}`}
                        aria-label="Close search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <ul className={`absolute z-50 top-full mt-1 max-w-sm w-full rounded-md shadow-lg overflow-hidden ${
                    isDark ? "bg-gray-800 border border-gray-700 text-gray-300" : "bg-white border border-gray-300 text-gray-900"
                  }`}>
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        tabIndex={0}
                        className={`cursor-pointer px-4 py-2 text-sm hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white ${
                          isDark ? "text-gray-300" : "text-gray-900"
                        }`}
                        onMouseDown={e => {
                          e.preventDefault();
                          handleSuggestionClick(suggestion);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSuggestionClick(suggestion);
                          }
                        }}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
