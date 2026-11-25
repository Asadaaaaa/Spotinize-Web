import React from 'react';

export function Logo({ size = 'md', iconOnly = false, style = {} }) {
  const sizeStyles = {
    sm: { fontSize: '1.15rem', dotSize: '4px', iconSize: 20, gap: '7px' },
    md: { fontSize: '1.4rem', dotSize: '5px', iconSize: 24, gap: '8px' },
    lg: { fontSize: '1.85rem', dotSize: '6px', iconSize: 30, gap: '10px' },
    xl: { fontSize: '2.4rem', dotSize: '8px', iconSize: 38, gap: '12px' },
    hero: { fontSize: 'clamp(2.5rem, 8vw, 3.8rem)', dotSize: '10px', iconSize: 'clamp(38px, 7vw, 54px)', gap: '14px' }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  const iconEl = (
    <img
      src="/spotinize-logo.png"
      alt="Spotinize"
      style={{
        width: currentSize.iconSize,
        height: currentSize.iconSize,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'block'
      }}
    />
  );

  if (iconOnly) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', userSelect: 'none', ...style }}>
        {iconEl}
      </div>
    );
  }

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
        userSelect: 'none',
        fontFamily: 'var(--font-main, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        fontWeight: 900,
        fontSize: currentSize.fontSize,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        ...style
      }}
    >
      {iconEl}
      <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
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
      </span>
    </div>
  );
}

export default Logo;
