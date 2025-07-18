"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart, X, AlertTriangle, Heart, Filter, DollarSign, Smartphone, SlidersHorizontal, Package } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface SliderMenuProps {
  isOpen: boolean;
  onCloseAction: () => void;
  sortBy: string;
  setSortByAction: (v: string) => void;
  filterCondition: string[];  // changed to array of strings for multi-select
  setFilterConditionAction: (v: string[]) => void;
  onFilterChangeAction: () => void;
  priceRange: { min: number; max: number };
  setPriceRangeAction: (range: { min: number; max: number }) => void;
  networkType: string;
  setNetworkTypeAction: (network: string) => void;
}

export default function SliderMenu({ 
  isOpen, 
  onCloseAction, 
  sortBy, 
  setSortByAction, 
  filterCondition, 
  setFilterConditionAction, 
  onFilterChangeAction, 
  priceRange, 
  setPriceRangeAction, 
  networkType,
  setNetworkTypeAction
}: SliderMenuProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);

  // Local state for multi-select conditions
  const [localConditions, setLocalConditions] = useState<string[]>(Array.isArray(filterCondition) ? filterCondition : ["all"]);

  // Sync local price range with props
  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  // Sync local conditions with props when filterCondition changes
  useEffect(() => {
    setLocalConditions(Array.isArray(filterCondition) ? filterCondition : ["all"]);
  }, [filterCondition]);

  useEffect(() => {
    if (!isOpen) return;

    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseAction();
      }
    };

    document.addEventListener("keydown", keydownHandler);

    if (menuRef.current) {
      menuRef.current.focus();
    }

    return () => {
      document.removeEventListener("keydown", keydownHandler);
    };
  }, [isOpen, onCloseAction]);

  const networks = [
    { id: "all", label: "All Networks", icon: "📱" },
    { id: "unlocked", label: "Unlocked Only", icon: "🔓" },
  ];

  const conditions = [
    { value: "all", label: "All Conditions", color: "text-gray-600" },
    { value: "new", label: "New", color: "text-green-600" },
    { value: "refurbished", label: "Refurbished", color: "text-blue-600" },
    { value: "very good", label: "Very Good", color: "text-emerald-600" },
    { value: "good", label: "Good", color: "text-yellow-600" },
    { value: "used", label: "Used", color: "text-orange-600" },
    { value: "for parts", label: "For Parts Only", color: "text-red-600" },
  ];

  const sortOptions = [
    { value: "bestMatch", label: "Best Match", icon: "🎯" },
    { value: "priceAsc", label: "Price: Low to High", icon: "📈" },
    { value: "priceDesc", label: "Price: High to Low", icon: "📉" },
  ];

  const handleApplyPriceRange = () => {
    setPriceRangeAction(localPriceRange);
    onFilterChangeAction();
  };

  const handleResetFilters = () => {
    setSortByAction("bestMatch");
    setFilterConditionAction(["all"]);
    setLocalConditions(["all"]);
    setLocalPriceRange({ min: 0, max: 0 });
    setPriceRangeAction({ min: 0, max: 0 });
    setNetworkTypeAction("all");
    onFilterChangeAction();
  };

  // Handle condition checkbox toggle
  const toggleCondition = (value: string) => {
    console.log("Toggling condition:", value);
    if (value === "all") {
      setLocalConditions(["all"]);
    } else {
      let newConditions = localConditions.filter(c => c !== "all");
      if (localConditions.includes(value)) {
        newConditions = newConditions.filter(c => c !== value);
      } else {
        newConditions.push(value);
      }
      if (newConditions.length === 0) {
        newConditions = ["all"];
      }
      setLocalConditions(newConditions);
    }
  };

  // Apply selected conditions
  const applyConditions = () => {
    console.log("Applying conditions:", localConditions);
    setFilterConditionAction(localConditions);
    onFilterChangeAction();
  };

  // Handle network type change and trigger search immediately
  const handleNetworkTypeChange = (value: string) => {
    console.log("Network type changed to:", value);
    setNetworkTypeAction(value);
    onFilterChangeAction();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          aria-hidden="true"
          onClick={onCloseAction}
        />
      )}

      <aside
        ref={menuRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Filters and Navigation"
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } focus:outline-none overflow-y-auto border-r border-gray-200 dark:border-gray-700`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters & Menu</h2>
            </div>
            <button
              onClick={onCloseAction}
              aria-label="Close menu"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Reset Filters Button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Sort By */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sort By</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {sortOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    sortBy === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="sort"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={(e) => {
                      setSortByAction(e.target.value);
                      onFilterChangeAction();
                    }}
                    className="sr-only"
                  />
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Navigation Links */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <nav className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Quick Links
            </h3>
            
            <Link
              href="/user"
              onClick={onCloseAction}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">👤</span>
              </div>
              <span className="text-sm font-medium">User Profile</span>
            </Link>
            
            <Link
              href="/wishlist"
              onClick={onCloseAction}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">Wishlist</span>
            </Link>
            
            <Link
              href="/checkout"
              onClick={onCloseAction}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">Shopping Cart</span>
            </Link>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
