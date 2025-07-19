"use client";

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

type NetworkType = "unlocked" | "locked" | "all";

export default function NetworkFilterMenu() {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("all");

  const networks = [
    { id: "all", label: "All Networks" },
    { id: "unlocked", label: "Unlocked Only" },

  ];

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
        Network Selection
      </h3>
      <div className="space-y-2">
        {networks.map((network) => (
          <label
            key={network.id}
            className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <input
              type="radio"
              name="network"
              value={network.id}
              checked={selectedNetwork === network.id}
              onChange={(e) => setSelectedNetwork(e.target.value as NetworkType)}
              className="form-radio text-blue-600 focus:ring-blue-500"
            />
            <span className="text-black dark:text-white font-medium">{network.label}</span>
          </label>
        ))}
      </div>
      
      {selectedNetwork === "locked" && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Carrier-locked devices are restricted to specific networks. Please verify compatibility before purchase.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
