"use client";

import { useState, FormEvent, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import Image from "next/image";
import { Menu, Search, X } from "lucide-react";

interface NavbarProps {
  onMenuOpen: () => void;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  className?: string;
}

export default function Navbar({
  onMenuOpen,
  onSearch,
  showSearch = true,
  className = "",
}: NavbarProps) {
  const { isDark } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setIsSearchOpen(false);
    }
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  return (
    <header className={`sticky top-0 z-50 ${className}`}>
      <div className={`w-full ${isDark ? "bg-black" : "bg-white"} shadow-md`}>
        <div className="max-w-7xl mx-auto">
          {/* Header with Menu, Logo, and Search */}
          <div className="flex flex-col w-full">
            <div className="h-32 sm:h-36 md:h-40 flex items-center justify-between px-5 sm:px-6 md:px-8">
              {/* Menu Button */}
              <div className="flex items-center min-w-0">
                <button
                  onClick={onMenuOpen}
                  className={`p-2.5 sm:p-3 rounded-xl transition-colors hover:bg-gray-800/30 touch-manipulation ${isDark ? "text-white" : "text-black"}`}
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>

              {/* Logo - Centered */}
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
                    style={{ 
                      objectFit: 'contain',
                      imageRendering: 'crisp-edges'
                    }}
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

            {/* Search Form - appears below header when open */}
            {showSearch && isSearchOpen && (
              <div className="flex justify-center pb-6 sm:pb-7 px-4 sm:px-6">
                <form onSubmit={handleSearch} className="w-full max-w-sm search-form">
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
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
