import React from 'react';

export function Logo({ size = 'md', style = {} }) {
  const sizeStyles = {
    sm: { fontSize: '1.15rem', dotSize: '4px' },
    md: { fontSize: '1.4rem', dotSize: '5px' },
    lg: { fontSize: '1.85rem', dotSize: '6px' },
    xl: { fontSize: '2.4rem', dotSize: '8px' },
    hero: { fontSize: 'clamp(2.5rem, 8vw, 3.8rem)', dotSize: '10px' }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        userSelect: 'none',
        fontFamily: 'var(--font-main, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        fontWeight: 900,
        fontSize: currentSize.fontSize,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        ...style
      }}
    >
      <span style={{ color: 'var(--color-text-bright, #FFFFFF)' }}>
        SPOTI
      </span>
      <span style={{ 
        color: 'var(--color-primary, #1DB954)',
        textShadow: '0 0 16px rgba(29, 185, 84, 0.35)'
      }}>
        NIZE
      </span>
      <span 
        style={{
          display: 'inline-block',
          width: currentSize.dotSize,
          height: currentSize.dotSize,
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary, #1DB954)',
          marginLeft: '3px',
          boxShadow: '0 0 8px rgba(29, 185, 84, 0.7)'
        }} 
      />
    </div>
  );
}

export default Logo;
