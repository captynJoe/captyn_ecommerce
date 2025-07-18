"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Filter, Star, DollarSign, Package, Zap, SlidersHorizontal } from "lucide-react";

interface ModernFiltersProps {
  sortBy: string;
  setSortByAction: (v: string) => void;
  filterCondition: string;
  setFilterConditionAction: (v: string) => void;
  onFilterChangeAction: () => void;
  priceRange: { min: number; max: number };
  setPriceRangeAction: (range: { min: number; max: number }) => void;
  rating: number;
  setRatingAction: (rating: number) => void;
  networkType: string;
  setNetworkTypeAction: (network: string) => void;
  isDark: boolean;
}

export default function ModernFilters({
  sortBy,
  setSortByAction,
  filterCondition,
  setFilterConditionAction,
  onFilterChangeAction,
  priceRange,
  setPriceRangeAction,
  rating,
  setRatingAction,
  networkType,
  setNetworkTypeAction,
  isDark
}: ModernFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update active filters count
  useEffect(() => {
    const filters = [];
    if (sortBy !== 'bestMatch') filters.push('sort');
    if (filterCondition !== 'all') filters.push('condition');
    if (priceRange.min > 0 || priceRange.max > 0) filters.push('price');
    if (rating > 0) filters.push('rating');
    if (networkType !== 'all') filters.push('network');
    setActiveFilters(filters);
  }, [sortBy, filterCondition, priceRange, rating, networkType]);

  const clearAllFilters = () => {
    setSortByAction('bestMatch');
    setFilterConditionAction('all');
    setPriceRangeAction({ min: 0, max: 0 });
    setRatingAction(0);
    setNetworkTypeAction('all');
    onFilterChangeAction();
  };

  const applyPriceFilter = () => {
    onFilterChangeAction();
    setIsOpen(false);
  };

  const sortOptions = [
    { value: 'bestMatch', label: 'Best Match', icon: <Star className="w-4 h-4" /> },
    { value: 'priceAsc', label: 'Price: Low to High', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'priceDesc', label: 'Price: High to Low', icon: <DollarSign className="w-4 h-4" /> },
  ];

  const conditionOptions = [
    { value: 'all', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'refurbished', label: 'Refurbished' },
    { value: 'very good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'used', label: 'Used' },
    { value: 'for parts', label: 'For Parts Only' },
  ];

  const networkOptions = [
    { value: 'all', label: 'All Networks' },
    { value: 'unlocked', label: 'Unlocked Only' },
    { value: 'locked', label: 'Carrier Locked' },
  ];

  const ratingOptions = [
    { value: 0, label: 'Any Rating' },
    { value: 1, label: '⭐ & up' },
    { value: 2, label: '⭐⭐ & up' },
    { value: 3, label: '⭐⭐⭐ & up' },
    { value: 4, label: '⭐⭐⭐⭐ & up' },
    { value: 5, label: '⭐⭐⭐⭐⭐ only' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
          isDark 
            ? "border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700 text-white" 
            : "border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700"
        } ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="font-medium">Filters</span>
        {activeFilters.length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
            {activeFilters.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 w-80 rounded-xl shadow-2xl border z-50 ${
          isDark 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}>
            <h3 className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
              Filters
            </h3>
            <div className="flex items-center gap-2">
              {activeFilters.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
            {/* Sort By */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}>
                Sort By
              </label>
              <div className="grid grid-cols-1 gap-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortByAction(option.value);
                      onFilterChangeAction();
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      sortBy === option.value
                        ? isDark 
                          ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                          : "border-blue-500 bg-blue-50 text-blue-600"
                        : isDark
                          ? "border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}>
                Condition
              </label>
              <div className="grid grid-cols-2 gap-2">
                {conditionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterConditionAction(option.value);
                      onFilterChangeAction();
                    }}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${
                      filterCondition === option.value
                        ? isDark 
                          ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                          : "border-blue-500 bg-blue-50 text-blue-600"
                        : isDark
                          ? "border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}>
                Price Range (KSh)
              </label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={priceRange.min || ''}
                      onChange={(e) => setPriceRangeAction({ 
                        min: e.target.value === '' ? 0 : Number(e.target.value), 
                        max: priceRange.max 
                      })}
                      placeholder="Min"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark 
                          ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" 
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={priceRange.max || ''}
                      onChange={(e) => setPriceRangeAction({ 
                        min: priceRange.min, 
                        max: e.target.value === '' ? 0 : Number(e.target.value) 
                      })}
                      placeholder="Max"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDark 
                          ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" 
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                </div>
                <button
                  onClick={applyPriceFilter}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Apply Price Range
                </button>
              </div>
            </div>

            {/* Seller Rating */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}>
                Seller Rating
              </label>
              <div className="grid grid-cols-1 gap-2">
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setRatingAction(option.value);
                      onFilterChangeAction();
                    }}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${
                      rating === option.value
                        ? isDark 
                          ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                          : "border-blue-500 bg-blue-50 text-blue-600"
                        : isDark
                          ? "border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Type */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}>
                Network Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {networkOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setNetworkTypeAction(option.value);
                      onFilterChangeAction();
                    }}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${
                      networkType === option.value
                        ? isDark 
                          ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                          : "border-blue-500 bg-blue-50 text-blue-600"
                        : isDark
                          ? "border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
