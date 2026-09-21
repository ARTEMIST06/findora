import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'compact' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = '',
  onClick,
}) => {
  // Dimensions based on size
  const iconSizes = {
    sm: 28,
    md: 38,
    lg: 48,
    xl: 64,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  const iconDim = iconSizes[size];
  const isDark = variant === 'dark';

  // SVG Icon representing the custom Findora 'F' with magnifying lens discovery symbol
  const LogoIcon = (
    <svg
      width={iconDim}
      height={iconDim}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]"
      id="findora-logo-mark"
    >
      <defs>
        {/* Main F top swoop gradient */}
        <linearGradient id="fTopGrad" x1="10" y1="15" x2="110" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Stem navy-purple gradient */}
        <linearGradient id="fStemGrad" x1="15" y1="40" x2="70" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="60%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        {/* Lens glow gradient */}
        <linearGradient id="lensRingGrad" x1="25" y1="50" x2="65" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0E7FF" />
        </linearGradient>

        {/* Ambient shadow */}
        <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1E3A8A" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Rounded soft container if wanted or standalone icon */}
      <g filter="url(#logoShadow)">
        {/* Top Arm of 'F' - aerodynamic curved wing */}
        <path
          d="M 28 22 C 28 16 33 12 40 12 L 88 12 C 98 12 105 19 104 29 C 103 38 96 44 86 44 L 64 44 C 54 44 48 49 46 58 L 44 68 C 44 70 42 72 40 72 L 30 72 C 27 72 25 70 25 67 L 28 22 Z"
          fill="url(#fTopGrad)"
        />

        {/* Lower body of 'F' with integrated discovery lens */}
        <path
          d="M 25 52 L 52 52 C 58 52 64 56 64 62 L 64 80 C 64 92 54 102 42 102 L 30 102 C 24 102 20 98 21 92 L 25 52 Z"
          fill="url(#fStemGrad)"
        />

        {/* Discovery Magnifying Ring integrated into the stem of F */}
        <circle
          cx="44"
          cy="74"
          r="16"
          stroke="url(#lensRingGrad)"
          strokeWidth="6.5"
          fill="#0F172A"
          fillOpacity="0.4"
        />

        {/* Magnifying Glass Inner Refraction Dot */}
        <circle
          cx="40"
          cy="70"
          r="3"
          fill="#38BDF8"
          fillOpacity="0.9"
        />

        {/* Magnifying Glass Handle protruding diagonally */}
        <path
          d="M 55 85 L 67 97 C 69 99 69 102 67 104 C 65 106 62 106 60 104 L 48 92 Z"
          fill="url(#lensRingGrad)"
          stroke="#4338CA"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center cursor-pointer select-none ${className}`}
        title="Findora - Find it. Compare it. Buy smarter."
      >
        {LogoIcon}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 group cursor-pointer select-none ${className}`}
      id="findora-brand-header"
    >
      {LogoIcon}

      <div className="flex flex-col">
        <div className="flex items-center tracking-tight leading-none">
          <span
            className={`font-extrabold tracking-tight ${textSizes[size]} ${
              isDark ? 'text-[#0B132B]' : 'text-white'
            }`}
          >
            Find
          </span>
          {/* Stylized 'o' with dual-tone ring */}
          <span className="relative inline-flex items-center justify-center">
            <span
              className={`font-extrabold ${textSizes[size]} text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400`}
            >
              o
            </span>
          </span>
          <span
            className={`font-extrabold tracking-tight ${textSizes[size]} ${
              isDark ? 'text-[#0B132B]' : 'text-white'
            }`}
          >
            ra
          </span>
          <span
            className={`font-semibold ml-0.5 self-start text-[10px] ${
              isDark ? 'text-blue-600' : 'text-blue-400'
            }`}
          >
            ™
          </span>
        </div>

        {showTagline && (
          <span
            className={`font-medium tracking-wide mt-0.5 ${taglineSizes[size]} ${
              isDark ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Find it. Compare it. Buy smarter.
          </span>
        )}
      </div>
    </div>
  );
};
