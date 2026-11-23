import React, { useState } from 'react';
import starAiLogoImg from '../../assets/images/star_ai_logo_1794898373999.jpg';

interface StarAILogoProps {
  size?: number;
  className?: string;
}

/**
 * Unified official STAR AI institutional crest:
 * Navy & royal blue shield with gold border, open academic book, AI circuit nodes, and radiant 4-point gold star.
 */
export const StarAILogo: React.FC<StarAILogoProps> = ({ size = 36, className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="STAR AI Logo"
        className={className}
      >
        <defs>
          <linearGradient id="starShieldBg" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="55%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="starGold" x1="20" y1="8" x2="44" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <path
          d="M32 4L54 11.5V29.5C54 44.2 44.3 55.2 32 60C19.7 55.2 10 44.2 10 29.5V11.5L32 4Z"
          fill="url(#starShieldBg)"
          stroke="url(#starGold)"
          strokeWidth="2.4"
        />
        <path
          d="M32 12L35.2 21.8L45 25L35.2 28.2L32 38L28.8 28.2L19 25L28.8 21.8L32 12Z"
          fill="url(#starGold)"
        />
        <path
          d="M17 34.5C22.5 34.5 27.5 36.2 32 39.2C36.5 36.2 41.5 34.5 47 34.5V47C41.5 47 36.5 48.6 32 51.2C27.5 48.6 22.5 47 17 47V34.5Z"
          fill="#eff6ff"
          fillOpacity="0.16"
          stroke="#93c5fd"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <img
      src={starAiLogoImg}
      alt="STAR AI Logo"
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      style={{ width: size, height: size }}
      className={`rounded-xl object-cover bg-slate-950 border border-amber-400/50 shadow-xs select-none ${className}`}
    />
  );
};
