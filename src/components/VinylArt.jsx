import React, { useState } from 'react';
import { Disc3 } from 'lucide-react';

export function VinylArt({
  src,
  alt = 'Album Artwork',
  size = 48,
  borderRadius = '8px',
  style = {}
}) {
  const [hasError, setHasError] = useState(!src);

  if (!hasError && src) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
          borderRadius,
          objectFit: 'cover',
          flexShrink: 0,
          backgroundColor: '#121212',
          border: '1px solid var(--color-border)',
          ...style
        }}
      />
    );
  }

  // Sleek Black Vinyl Record Fallback
  return (
    <div
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius,
        backgroundColor: '#0a0a0a',
        background: 'radial-gradient(circle, #1f1f1f 0%, #0d0d0d 60%, #000000 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
        flexShrink: 0,
        ...style
      }}
      title={alt}
    >
      {/* Grooves */}
      <div style={{
        position: 'absolute',
        inset: '15%',
        borderRadius: '50%',
        border: '1px solid rgba(255, 255, 255, 0.07)'
      }} />
      <div style={{
        position: 'absolute',
        inset: '28%',
        borderRadius: '50%',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }} />

      {/* Center Vinyl Label */}
      <div style={{
        width: typeof size === 'number' ? `${Math.max(14, Math.round(size * 0.36))}px` : '36%',
        height: typeof size === 'number' ? `${Math.max(14, Math.round(size * 0.36))}px` : '36%',
        borderRadius: '50%',
        backgroundColor: '#181818',
        border: '1.5px solid var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Center Spindle Hole */}
        <div style={{
          width: typeof size === 'number' ? `${Math.max(4, Math.round(size * 0.1))}px` : '10%',
          height: typeof size === 'number' ? `${Math.max(4, Math.round(size * 0.1))}px` : '10%',
          borderRadius: '50%',
          backgroundColor: '#000000',
          border: '1px solid rgba(255,255,255,0.2)'
        }} />
      </div>
    </div>
  );
}

export default VinylArt;
