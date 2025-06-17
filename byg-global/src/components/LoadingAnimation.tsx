"use client"

import React from "react"
import Image from "next/image"

const LoadingAnimation: React.FC = () => {
  const rippleWaves = [1, 2, 3, 4].map((i) => (
    <div
      key={`wave-${i}`}
      className={`
        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        rounded-full border-4 border-blue-500/50 animate-ripple
        w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] md:w-[240px] md:h-[240px]
      `}
      style={{
        animationDelay: `${(i - 1) * 0.75}s`,
        filter: "blur(1px)",
        transform: `translate(-50%, -50%) scale(${1 + i * 0.5})`
      }}
    />
  ))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="relative flex flex-col items-center">
        <div className="relative w-96 h-96 mb-8">
          {/* Globe background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/globe.svg"
              alt="Globe"
              width={300}
              height={300}
              className="opacity-20"
              priority
            />
          </div>

          {/* Market Indicators */}
          <div className="absolute inset-0 flex items-center justify-between px-8">
            {/* US Market - Left side */}
            <div className="flex flex-col items-center animate-market-fade" style={{ animationDelay: "0s" }}>
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-blue-400/50 rounded-full blur-md animate-market-glow" />
                <div className="w-4 h-4 bg-blue-400 rounded-full animate-market-pulse" />
              </div>
              <span className="text-blue-100 text-sm font-medium tracking-wider">US Market</span>
            </div>

            {/* Kenya Market - Right side */}
            <div className="flex flex-col items-center animate-market-fade" style={{ animationDelay: "0.5s" }}>
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-blue-400/50 rounded-full blur-md animate-market-glow" />
                <div className="w-4 h-4 bg-blue-400 rounded-full animate-market-pulse" />
              </div>
              <span className="text-blue-100 text-sm font-medium tracking-wider">Kenya</span>
            </div>
          </div>

          {/* CAPTYN Logo with waves */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
            {/* Ripple waves */}
            {rippleWaves}

            {/* Logo glow effects */}
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse z-10" />
            <div 
              className="absolute inset-2 bg-blue-400/20 rounded-full blur-xl animate-pulse z-10"
              style={{ animationDelay: "0.5s" }}
            />

            {/* CAPTYN Logo */}
            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-blue-400/50 shadow-lg shadow-blue-500/30 z-20">
              <Image
                src="/captynlogo.png"
                alt="CAPTYN Logo"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-8 text-center relative z-30">
          <h3 className="text-xl font-semibold text-blue-100 mb-3 tracking-wider animate-pulse">
            Connecting Markets
          </h3>
          <div className="w-64 h-1.5 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full w-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 animate-loading" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingAnimation
