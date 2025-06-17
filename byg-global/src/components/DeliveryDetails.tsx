"use client";

import { useState } from "react";

interface DeliveryDetailsProps {
  onDetailsChange: (details: {
    fullName: string;
    phone: string;
    email: string;
    county: string;
    address: string;
    additionalInfo: string;
  }) => void;
}

// Kenyan counties with their distances from Nairobi (approximate)
export const kenyanCounties = [
  { name: 'Nairobi', distance: 0 },
  { name: 'Kiambu', distance: 1 },
  { name: 'Machakos', distance: 1 },
  { name: 'Kajiado', distance: 1 },
  { name: 'Murang\'a', distance: 2 },
  { name: 'Kirinyaga', distance: 2 },
  { name: 'Embu', distance: 2 },
  { name: 'Nyeri', distance: 2 },
  { name: 'Nakuru', distance: 2 },
  { name: 'Nyandarua', distance: 2 },
  { name: 'Makueni', distance: 2 },
  { name: 'Kitui', distance: 3 },
  { name: 'Meru', distance: 3 },
  { name: 'Tharaka-Nithi', distance: 3 },
  { name: 'Laikipia', distance: 3 },
  { name: 'Nandi', distance: 3 },
  { name: 'Uasin Gishu', distance: 3 },
  { name: 'Kericho', distance: 3 },
  { name: 'Bomet', distance: 3 },
  { name: 'Nyamira', distance: 3 },
  { name: 'Kisii', distance: 3 },
  { name: 'Homa Bay', distance: 4 },
  { name: 'Migori', distance: 4 },
  { name: 'Kisumu', distance: 4 },
  { name: 'Siaya', distance: 4 },
  { name: 'Vihiga', distance: 4 },
  { name: 'Kakamega', distance: 4 },
  { name: 'Bungoma', distance: 4 },
  { name: 'Trans Nzoia', distance: 4 },
  { name: 'West Pokot', distance: 4 },
  { name: 'Turkana', distance: 5 },
  { name: 'Samburu', distance: 5 },
  { name: 'Isiolo', distance: 4 },
  { name: 'Marsabit', distance: 5 },
  { name: 'Mandera', distance: 5 },
  { name: 'Wajir', distance: 5 },
  { name: 'Garissa', distance: 4 },
  { name: 'Tana River', distance: 4 },
  { name: 'Lamu', distance: 5 },
  { name: 'Kilifi', distance: 4 },
  { name: 'Mombasa', distance: 4 },
  { name: 'Kwale', distance: 4 },
  { name: 'Taita-Taveta', distance: 4 },
  { name: 'Narok', distance: 2 },
  { name: 'Baringo', distance: 3 },
  { name: 'Elgeyo-Marakwet', distance: 4 },
  { name: 'Busia', distance: 4 }
].sort((a, b) => a.name.localeCompare(b.name));

export default function DeliveryDetails({ onDetailsChange }: DeliveryDetailsProps) {

  const [details, setDetails] = useState({
    fullName: '',
    phone: '',
    email: '',
    county: '',
    address: '',
    additionalInfo: ''
  });

  const handleChange = (field: string, value: string) => {
    const newDetails = { ...details, [field]: value };
    setDetails(newDetails);
    onDetailsChange(newDetails);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mt-8 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Delivery Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={details.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Enter your full name"
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={details.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Enter your phone number"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={details.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Enter your email address"
            required
          />
        </div>

        {/* County */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            County *
          </label>
          <select
            value={details.county}
            onChange={(e) => handleChange('county', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            required
          >
            <option value="">Select County</option>
            {kenyanCounties.map((county) => (
              <option key={county.name} value={county.name}>
                {county.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Delivery Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Delivery Address *
        </label>
        <textarea
          value={details.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          placeholder="Enter your full delivery address (building name, street, area)"
          rows={3}
          required
        />
      </div>

      {/* Additional Information */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Additional Information
        </label>
        <textarea
          value={details.additionalInfo}
          onChange={(e) => handleChange('additionalInfo', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          placeholder="Any additional delivery instructions or landmarks"
          rows={2}
        />
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        * Required fields
      </div>
    </div>
  );
}
