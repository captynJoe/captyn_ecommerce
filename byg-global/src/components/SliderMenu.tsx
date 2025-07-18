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

          {/* Condition */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Condition</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {conditions.map((condition) => (
                <label
                  key={condition.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    localConditions.includes(condition.value)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="condition"
                    value={condition.value}
                    checked={localConditions.includes(condition.value)}
                    onChange={() => toggleCondition(condition.value)}
                    className="sr-only"
                  />
                  <div className={`w-3 h-3 rounded-full ${
                    localConditions.includes(condition.value) ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                  }`} />
                  <span className={`text-sm font-medium ${condition.color} dark:text-gray-300`}>
                    {condition.label}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={applyConditions}
              className="mt-2 w-full py-2 px-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Condition Filters
            </button>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Price Range (KSh)</h3>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Minimum
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={localPriceRange.min || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setLocalPriceRange({ ...localPriceRange, min: value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Maximum
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={localPriceRange.max || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setLocalPriceRange({ ...localPriceRange, max: value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="No limit"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyPriceRange}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Apply Price Filter
              </button>
              {(localPriceRange.min > 0 || localPriceRange.max > 0) && (
                <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                  Current: KSh {localPriceRange.min.toLocaleString()} - {localPriceRange.max > 0 ? `KSh ${localPriceRange.max.toLocaleString()}` : 'No limit'}
                </div>
              )}
            </div>
          </div>

          {/* Network Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Network Type</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {networks.map((network) => (
                <label
                  key={network.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    networkType === network.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="network"
                    value={network.id}
                    checked={networkType === network.id}
                    onChange={() => handleNetworkTypeChange(network.id)}
                    className="sr-only"
                  />
                  <span className="text-lg">{network.icon}</span>
                  <span className="text-sm font-medium">{network.label}</span>
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
