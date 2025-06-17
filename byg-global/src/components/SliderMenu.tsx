"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingCart, X, AlertTriangle, Heart } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface SliderMenuProps {
  isOpen: boolean;
  onCloseAction: () => void;
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
  rating, 
  setRatingAction,
  networkType,
  setNetworkTypeAction
}: SliderMenuProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    { id: "all", label: "All Networks" },
    { id: "unlocked", label: "Unlocked Only" },
    { id: "locked", label: "Carrier Locked" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          aria-hidden="true"
          onClick={onCloseAction}
        />
      )}

      <aside
        ref={menuRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 left-0 h-full w-56 bg-white dark:bg-black shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } focus:outline-none overflow-y-auto`}
      >
        <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-bold text-black dark:text-white">Menu</h2>
          <button
            onClick={onCloseAction}
            aria-label="Close menu"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Network Selection
          </h3>
          <div className="space-y-2">
            {networks.map((network) => (
              <label
                key={network.id}
                className="flex items-center space-x-2 cursor-pointer text-sm"
              >
                <input
                  type="radio"
                  name="network"
                  value={network.id}
                  checked={networkType === network.id}
                  onChange={(e) => {
                    setNetworkTypeAction(e.target.value);
                    onFilterChangeAction();
                  }}
                  className="form-radio text-blue-600 focus:ring-blue-500"
                />
                <span className="text-black dark:text-white">{network.label}</span>
              </label>
            ))}
          </div>
          
          {networkType === "locked" && (
             <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Some devices might be locked to specific networks. Please verify device compatibility before purchase.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 space-y-4 text-black dark:text-white">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortByAction(e.target.value);
                onFilterChangeAction();
              }}
              className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white p-2 text-sm"
            >
              <option value="bestMatch">Best Match</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="newlyListed">Newly Listed</option>
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Condition:
            </label>
            <select
              value={filterCondition}
              onChange={(e) => {
                setFilterConditionAction(e.target.value);
                onFilterChangeAction();
              }}
              className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white p-2 text-sm"
            >
              <option value="all">All Conditions</option>
              <option value="new">New</option>
              <option value="refurbished">Refurbished</option>
              <option value="very good">Very Good</option>
              <option value="good">Good</option>
              <option value="used">Used</option>
              <option value="for parts">For Parts Only</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Price Range (KSh):
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min={0}
                value={priceRange.min}
                onChange={(e) => setPriceRangeAction({ min: Number(e.target.value), max: priceRange.max })}
                className="w-1/2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white p-2 text-sm"
                placeholder="Min"
              />
              <input
                type="number"
                min={0}
                value={priceRange.max}
                onChange={(e) => setPriceRangeAction({ min: priceRange.min, max: Number(e.target.value) })}
                className="w-1/2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white p-2 text-sm"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Seller Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Seller Rating:
            </label>
            <select
              value={rating}
              onChange={(e) => {
                setRatingAction(Number(e.target.value));
                onFilterChangeAction();
              }}
              className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white p-2 text-sm"
            >
              <option value={0}>Any Rating</option>
              <option value={1}>⭐ & up</option>
              <option value={2}>⭐⭐ & up</option>
              <option value={3}>⭐⭐⭐ & up</option>
              <option value={4}>⭐⭐⭐⭐ & up</option>
              <option value={5}>⭐⭐⭐⭐⭐ only</option>
            </select>
          </div>
        </div>

        <nav className="flex flex-col p-3 space-y-3 text-black dark:text-white border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/user"
            onClick={onCloseAction}
            className="hover:text-blue-600 dark:hover:text-blue-400 text-sm"
          >
            User Profile
          </Link>
          <Link
            href="/wishlist"
            onClick={onCloseAction}
            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
          >
            <Heart className="w-4 h-4" />
            Wishlist
          </Link>
          <Link
            href="/checkout"
            onClick={onCloseAction}
            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
          </Link>

          <div className="pt-3">
            <ThemeToggle />
          </div>
        </nav>
      </aside>
    </>
  );
}
