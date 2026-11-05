import React from 'react';

/**
 * StockPilot AI Glowing "S" Logo Component.
 * Supports various preset sizes and custom styling.
 */
export function StockPilotAILogo({
  size = 'md',
  variant = 'square',
  className = '',
  style = {},
  alt = 'StockPilot AI Logo',
}) {
  const sizeMap = {
    xs: 'w-4 h-4 rounded-sm',
    sm: 'w-5 h-5 rounded-md',
    md: 'w-7 h-7 rounded-lg',
    lg: 'w-8 h-8 rounded-xl',
    xl: 'w-12 h-12 rounded-2xl',
    '2xl': 'w-16 h-16 rounded-2xl',
  };

  const sizeClass = sizeMap[size] || size;
  const imageSrc = variant === 'transparent'
    ? '/stockpilot-ai-logo-transparent.png'
    : '/stockpilot-ai-logo.png';

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`object-cover shrink-0 select-none ${sizeClass} ${className}`}
      style={{
        boxShadow: variant === 'square' ? '0 2px 10px rgba(14, 165, 233, 0.22)' : undefined,
        ...style,
      }}
      loading="eager"
      onError={(e) => {
        // Fallback to square if transparent not found
        if (variant === 'transparent') {
          e.target.src = '/stockpilot-ai-logo.png';
        }
      }}
    />
  );
}
