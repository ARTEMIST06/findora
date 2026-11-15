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
  // Dimensions based on size (icon variant only)
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

  // 'light' = white wordmark for dark backgrounds; every other variant
  // renders black (monochrome — the mark uses currentColor throughout).
  const isLight = variant === 'light';
  const colourClass = isLight ? 'text-white' : 'text-black';
  const taglineClass = isLight ? 'text-white/60' : 'text-slate-500';

  // The ring-O: a magnifier ring that reads as the letter O in FINDORA.
  // Geometry (viewBox 0 0 100 120): the circle spans y 8–76 (68 units).
  // The svg is 1.25em tall so the circle renders at ~0.71em — cap height —
  // and a -0.46em bottom margin drops the circle's bottom edge exactly onto
  // the text baseline (the handle then dips ~0.17em below it, like a tail).
  // In a flex row with items-baseline the svg's bottom margin edge is its
  // baseline, so the ring aligns with the surrounding capitals.
  const RingO = (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
      style={{ height: '1.25em', width: '1.04em', marginBottom: '-0.46em' }}
      id="findora-logo-mark"
    >
      <circle cx="42" cy="42" r="34" stroke="currentColor" strokeWidth="14" />
      <line
        x1="66"
        y1="66"
        x2="92"
        y2="92"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    const dim = iconSizes[size];
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center cursor-pointer select-none ${colourClass} ${className}`}
        title="Findora - Find it. Compare it. Buy smarter."
      >
        <svg
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0"
          style={{ height: dim, width: (dim * 100) / 120 }}
        >
          <circle cx="42" cy="42" r="34" stroke="currentColor" strokeWidth="14" />
          <line
            x1="66"
            y1="66"
            x2="92"
            y2="92"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 group cursor-pointer select-none ${colourClass} ${className}`}
      id="findora-brand-header"
    >
      <div className="flex flex-col">
        <div className="flex items-baseline tracking-tight leading-none">
          <span className={`font-extrabold uppercase ${textSizes[size]}`}>Find</span>
          {RingO}
          <span className={`font-extrabold uppercase ${textSizes[size]}`}>ra</span>
        </div>

        {showTagline && (
          <span
            className={`hidden sm:block font-medium tracking-wide mt-1 ${taglineSizes[size]} ${taglineClass}`}
          >
            Find it. Compare it. Buy smarter.
          </span>
        )}
      </div>
    </div>
  );
};
