import React, { useState, useEffect } from 'react';

function renderTierOverlaySvg({ rarity, rimColor, grooveColor, sizeMode = 'small' }) {
  if (rarity === 'COMMON') return null;

  if (rarity === 'RARE') {
    return (
      <svg
        viewBox="0 0 100 100"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="41" fill="none" stroke={rimColor} strokeWidth="1.2" strokeDasharray="6 5" opacity="0.6" />
        <circle cx="50" cy="50" r="24" fill="none" stroke={rimColor} strokeWidth="1" opacity="0.45" />
      </svg>
    );
  }

  if (rarity === 'EPIC') {
    return (
      <svg
        viewBox="0 0 100 100"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="43" fill="none" stroke={rimColor} strokeWidth="1.8" strokeDasharray="18 7" strokeLinecap="round" opacity="0.8" />
        <circle cx="50" cy="50" r="32" fill="none" stroke={grooveColor} strokeWidth="1.2" />
        <polygon points="50,3 52.5,7 50,11 47.5,7" fill={rimColor} opacity="0.9" />
        <polygon points="50,89 52.5,93 50,97 47.5,93" fill={rimColor} opacity="0.9" />
        <polygon points="3,50 7,47.5 11,50 7,52.5" fill={rimColor} opacity="0.9" />
        <polygon points="89,50 93,47.5 97,50 93,52.5" fill={rimColor} opacity="0.9" />
      </svg>
    );
  }

  if (rarity === 'LEGENDARY') {
    return (
      <svg
        viewBox="0 0 100 100"
        className="frame-anim-orbit"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="43.5" fill="none" stroke={rimColor} strokeWidth="2" strokeDasharray="24 10 4 10" strokeLinecap="round" opacity="0.9" />
        <circle cx="50" cy="50" r="34" fill="none" stroke={rimColor} strokeWidth="1" strokeDasharray="8 8" opacity="0.55" />
        <polygon points="50,2 53,6.5 50,11 47,6.5" fill={rimColor} />
        <polygon points="50,89 53,93.5 50,98 47,93.5" fill={rimColor} />
      </svg>
    );
  }

  // MYTHIC
  const accent = sizeMode === 'stage' ? '#ffffff' : rimColor;
  return (
    <>
      <svg
        viewBox="0 0 100 100"
        className="frame-anim-orbit"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="44" fill="none" stroke={rimColor} strokeWidth="2.2" strokeDasharray="20 9 5 9" strokeLinecap="round" />
        <polygon points="50,1.5 53.5,6.5 50,11.5 46.5,6.5" fill={rimColor} />
        <polygon points="50,88.5 53.5,93.5 50,98.5 46.5,93.5" fill={rimColor} />
      </svg>
      <svg
        viewBox="0 0 100 100"
        className="frame-anim-counter-orbit"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="35" fill="none" stroke={accent} strokeWidth="1.2" strokeDasharray="9 11" opacity="0.65" />
        <polygon points="3,50 7,46.5 11,50 7,53.5" fill={rimColor} />
        <polygon points="89,50 93,46.5 97,50 93,53.5" fill={rimColor} />
      </svg>
    </>
  );
}

export function VinylArt({
  src,
  alt = 'Album Artwork',
  size = 48,
  borderRadius = '8px',
  skin = null,
  forceDisc = false,
  style = {}
}) {
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setHasError(!src);
  }, [src]);

  const skinConfig = skin?.visualConfig || null;
  const rarity = String(skin?.rarity || 'COMMON').toUpperCase();

  if (!forceDisc && !hasError && src) {
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
          border: skinConfig?.rimColor ? `2px solid ${skinConfig.rimColor}` : '1px solid var(--color-border)',
          ...style
        }}
      />
    );
  }

  const discColor = skinConfig?.discColor || '#0a0a0a';
  const grooveColor = skinConfig?.grooveColor || 'rgba(255, 255, 255, 0.08)';
  const labelColor = skinConfig?.labelColor || '#181818';
  const rimColor = skinConfig?.rimColor || 'var(--color-primary)';

  const tierAnimClass =
    rarity === 'MYTHIC'
      ? 'vinyl-anim-mythic'
      : rarity === 'LEGENDARY'
        ? 'vinyl-anim-legendary'
        : '';

  const tierShadow =
    rarity === 'MYTHIC'
      ? `inset 0 0 12px rgba(0,0,0,0.8), 0 0 14px ${rimColor}55`
      : rarity === 'LEGENDARY'
        ? `inset 0 0 10px rgba(0,0,0,0.8), 0 0 10px ${rimColor}44`
        : rarity === 'EPIC'
          ? `inset 0 0 10px rgba(0,0,0,0.8), 0 0 6px ${rimColor}28`
          : 'inset 0 0 10px rgba(0,0,0,0.8)';

  return (
    <div
      className={tierAnimClass}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius,
        backgroundColor: discColor,
        border: `${rarity === 'LEGENDARY' || rarity === 'MYTHIC' ? '2px' : '1.5px'} solid ${rimColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: tierShadow,
        flexShrink: 0,
        ...style
      }}
      title={skin?.name ? `${alt} (${skin.name})` : alt}
    >
      {/* Standard subtle grooves */}
      <div style={{
        position: 'absolute',
        inset: '15%',
        borderRadius: '50%',
        border: `1px solid ${grooveColor}`
      }} />
      <div style={{
        position: 'absolute',
        inset: '28%',
        borderRadius: '50%',
        border: `1px solid ${grooveColor}`
      }} />

      {/* Tier-specific SVG geometry / animations */}
      {renderTierOverlaySvg({ rarity, rimColor, grooveColor, sizeMode: 'small' })}

      {/* Center Vinyl Label */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: typeof size === 'number' ? `${Math.max(14, Math.round(size * 0.36))}px` : '36%',
        height: typeof size === 'number' ? `${Math.max(14, Math.round(size * 0.36))}px` : '36%',
        borderRadius: '50%',
        backgroundColor: labelColor,
        border: `1.5px solid ${rimColor}`,
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

export function VinylDiscStage({
  skin = null,
  spinning = false,
  coverSrc = null,
  coverAlt = 'Album Artwork',
  showArtwork = false,
  fadeIn = false,
  placeholderIcon = null
}) {
  const cfg = skin?.visualConfig || null;
  const rarity = String(skin?.rarity || 'COMMON').toUpperCase();
  const rimColor = cfg?.rimColor || 'var(--color-primary)';
  const grooveColor = cfg?.grooveColor || 'rgba(255, 255, 255, 0.12)';

  const isAnimatedTier = Boolean(cfg && (rarity === 'LEGENDARY' || rarity === 'MYTHIC'));
  const hasGlow = Boolean(cfg && ['EPIC', 'LEGENDARY', 'MYTHIC'].includes(rarity));

  const discStyle = cfg
    ? {
        background: cfg.discColor || '#0c0c10',
        border: `2.5px solid ${rimColor}`,
        boxShadow: hasGlow
          ? `0 10px 28px rgba(0,0,0,0.65), 0 0 ${rarity === 'MYTHIC' ? '26px' : rarity === 'LEGENDARY' ? '20px' : '12px'} ${rimColor}44, inset 0 0 18px rgba(0,0,0,0.75)`
          : '0 10px 24px rgba(0,0,0,0.55), inset 0 0 16px rgba(0,0,0,0.8)'
      }
    : undefined;

  const tierStageAnim = isAnimatedTier
    ? (rarity === 'MYTHIC' ? 'vinyl-anim-mythic' : 'vinyl-anim-legendary')
    : '';

  return (
    <div
      className={`track-vinyl-disc ${spinning ? 'spinning' : ''} ${tierStageAnim}`}
      style={discStyle}
      title={skin?.name || undefined}
    >
      {cfg && (
        <>
          <div style={{ position: 'absolute', inset: '9%', borderRadius: '50%', border: `1px solid ${grooveColor}`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '17%', borderRadius: '50%', border: `1px solid ${grooveColor}`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '25%', borderRadius: '50%', border: `1px solid ${grooveColor}`, pointerEvents: 'none' }} />
          {renderTierOverlaySvg({ rarity, rimColor, grooveColor, sizeMode: 'stage' })}
        </>
      )}

      {showArtwork && coverSrc ? (
        <VinylArt
          src={coverSrc}
          alt={coverAlt}
          size={98}
          borderRadius="50%"
          skin={skin}
          style={{
            position: 'relative',
            zIndex: 1,
            border: cfg?.rimColor ? `2.5px solid ${cfg.rimColor}` : '2px solid rgba(255,255,255,0.16)',
            ...(fadeIn ? { animation: 'vinylFadeIn 0.6s ease forwards' } : {})
          }}
        />
      ) : cfg ? (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '62px',
            height: '62px',
            borderRadius: '50%',
            backgroundColor: cfg.labelColor || '#181818',
            border: `2px solid ${rimColor}`,
            boxShadow: '0 0 12px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.22)' }} />
        </div>
      ) : (
        placeholderIcon
      )}

      <span className="track-vinyl-spindle" style={cfg?.rimColor ? { borderColor: cfg.rimColor } : undefined} />
    </div>
  );
}

export default VinylArt;
