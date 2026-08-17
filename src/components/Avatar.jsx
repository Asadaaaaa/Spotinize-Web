import React, { useState } from 'react';
import { User } from 'lucide-react';

export function Avatar({
  src,
  alt = 'User',
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  seed = 'user',
  style = {}
}) {
  const [errorCount, setErrorCount] = useState(0);

  const sizeClass = size === 'lg' ? 'avatar-lg' : size === 'sm' ? 'avatar-sm' : '';

  const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed || 'player')}`;

  // If both src and fallback fail, render clean styled SVG placeholder
  if (errorCount >= 2 || (!src && errorCount >= 1)) {
    const pxSize = size === 'lg' ? 72 : size === 'sm' ? 32 : 42;
    return (
      <div
        className={`avatar ${sizeClass} ${className}`.trim()}
        style={{
          width: `${pxSize}px`,
          height: `${pxSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-surface-hover)',
          color: 'var(--color-primary)',
          flexShrink: 0,
          ...style
        }}
      >
        <User size={size === 'lg' ? 36 : size === 'sm' ? 16 : 22} />
      </div>
    );
  }

  const currentSrc = errorCount === 0 && src ? src : fallbackUrl;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`avatar ${sizeClass} ${className}`.trim()}
      onError={() => setErrorCount(prev => prev + 1)}
      loading="lazy"
      style={style}
    />
  );
}

export default Avatar;
