import React from 'react';
import { Disc3, Music, Sparkles, Crown, AudioWaveform } from 'lucide-react';

export function ProfileFrameWrapper({ frame, sizePx = 42, children }) {
  const config = frame?.visualConfig || null;
  if (!frame || !config) {
    return <>{children}</>;
  }

  const rarity = String(frame.rarity || 'COMMON').toUpperCase();
  const primary = config.primaryColor || '#1db954';
  const secondary = config.secondaryColor || '#14532d';
  const ringStyle = config.ringStyle || 'solid';

  const isAnimatedTier = rarity === 'LEGENDARY' || rarity === 'MYTHIC';
  const showMotif =
    sizePx >= 36 &&
    ['EPIC', 'LEGENDARY', 'MYTHIC'].includes(rarity) &&
    config.motif &&
    config.motif !== 'none';

  const motifSize = sizePx >= 72 ? 15 : 10;

  const renderMotifIcon = () => {
    switch (config.motif) {
      case 'crown': return <Crown size={motifSize} color={primary} />;
      case 'vinyl': return <Disc3 size={motifSize} color={primary} />;
      case 'spark': return <Sparkles size={motifSize} color={primary} />;
      case 'equalizer': return <AudioWaveform size={motifSize} color={primary} />;
      case 'note':
      default:
        return <Music size={motifSize} color={primary} />;
    }
  };

  // Tier 1: COMMON -> Pure solid ring color, zero shapes, zero icons, zero animation
  if (rarity === 'COMMON') {
    return (
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: sizePx >= 64 ? '4px' : '2.5px',
          borderRadius: '50%',
          flexShrink: 0
        }}
        title={frame.name || undefined}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2.5px solid ${primary}`,
            pointerEvents: 'none'
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', borderRadius: '50%' }}>
          {children}
        </div>
      </div>
    );
  }

  // Tier 2: RARE -> Simple static geometric shapes, zero icons, zero animation
  if (rarity === 'RARE') {
    const isDashed = ringStyle === 'dashed';
    const isDouble = ringStyle === 'double';
    const isNotched = ringStyle === 'notched' || ringStyle === 'groove' || (!isDashed && !isDouble);

    return (
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: sizePx >= 64 ? '5px' : '3px',
          borderRadius: '50%',
          flexShrink: 0
        }}
        title={frame.name || undefined}
      >
        <svg
          viewBox="0 0 100 100"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          {isDashed ? (
            <>
              <circle cx="50" cy="50" r="46" fill="none" stroke={secondary} strokeWidth="2.5" opacity="0.65" />
              <circle cx="50" cy="50" r="46" fill="none" stroke={primary} strokeWidth="3.5" strokeDasharray="10 6" strokeLinecap="round" />
            </>
          ) : isDouble ? (
            <>
              <circle cx="50" cy="50" r="47.5" fill="none" stroke={primary} strokeWidth="2.2" />
              <circle cx="50" cy="50" r="42.5" fill="none" stroke={secondary} strokeWidth="2.2" />
            </>
          ) : (
            <>
              <circle cx="50" cy="50" r="46" fill="none" stroke={primary} strokeWidth="3" />
              {isNotched && (
                <>
                  <polygon points="50,1 53.5,5 50,9 46.5,5" fill={primary} />
                  <polygon points="50,91 53.5,95 50,99 46.5,95" fill={primary} />
                  <polygon points="1,50 5,46.5 9,50 5,53.5" fill={primary} />
                  <polygon points="91,50 95,46.5 99,50 95,53.5" fill={primary} />
                </>
              )}
            </>
          )}
        </svg>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', borderRadius: '50%' }}>
          {children}
        </div>
      </div>
    );
  }

  // Tier 3: EPIC -> Rich static geometric arcs + facets + optional corner motif icon (NO animation)
  if (rarity === 'EPIC') {
    return (
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: sizePx >= 64 ? '6px' : '3.5px',
          borderRadius: '50%',
          flexShrink: 0
        }}
        title={frame.name || undefined}
      >
        <svg
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            filter: `drop-shadow(0 0 5px ${primary}44)`
          }}
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="47" fill="none" stroke={secondary} strokeWidth="2.5" opacity="0.8" />
          <circle
            cx="50"
            cy="50"
            r="46.5"
            fill="none"
            stroke={primary}
            strokeWidth="3.5"
            strokeDasharray="24 8 6 8"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="41.5" fill="none" stroke={primary} strokeWidth="1.4" opacity="0.65" />
          {/* Cardinal faceted diamonds */}
          <polygon points="50,0.5 54,5.5 50,10.5 46,5.5" fill={primary} />
          <polygon points="50,89.5 54,94.5 50,99.5 46,94.5" fill={primary} />
          <polygon points="0.5,50 5.5,46 10.5,50 5.5,54" fill={primary} />
          <polygon points="89.5,50 94.5,46 99.5,50 94.5,54" fill={primary} />
        </svg>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', borderRadius: '50%' }}>
          {children}
        </div>
        {showMotif && (
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              zIndex: 2,
              width: sizePx >= 72 ? '22px' : '16px',
              height: sizePx >= 72 ? '22px' : '16px',
              borderRadius: '50%',
              backgroundColor: '#121216',
              border: `1.5px solid ${primary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
              pointerEvents: 'none'
            }}
          >
            {renderMotifIcon()}
          </div>
        )}
      </div>
    );
  }

  // Tier 4 & 5: LEGENDARY & MYTHIC -> Animated ornate multi-layer SVG halos + glowing aura + motif icon
  const isMythic = rarity === 'MYTHIC';
  const auraAnim = isAnimatedTier
    ? (isMythic ? 'frame-anim-prism' : (config.animation === 'pulse' ? 'frame-anim-pulse' : 'frame-anim-shimmer'))
    : '';

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: sizePx >= 64 ? '7px' : '4px',
        borderRadius: '50%',
        flexShrink: 0,
        color: primary
      }}
      title={frame.name ? `${frame.name} (${rarity})` : undefined}
    >
      {/* Inner radiant ring */}
      <div
        className={auraAnim}
        style={{
          position: 'absolute',
          inset: sizePx >= 64 ? '2px' : '1px',
          borderRadius: '50%',
          border: `2.5px solid ${primary}`,
          boxShadow: isMythic
            ? `0 0 0 2px ${secondary}88, 0 0 16px ${primary}88`
            : `0 0 0 2px ${secondary}77, 0 0 12px ${primary}66`,
          pointerEvents: 'none'
        }}
      />

      {/* Animated rotating filigree / astral arcs */}
      <svg
        viewBox="0 0 100 100"
        className="frame-anim-orbit"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="47.5"
          fill="none"
          stroke={primary}
          strokeWidth={isMythic ? '3' : '2.8'}
          strokeDasharray={isMythic ? '18 10 5 10' : '26 12'}
          strokeLinecap="round"
        />
        <polygon points="50,0 53.5,5 50,9 46.5,5" fill={isMythic ? secondary : primary} />
        <polygon points="50,91 53.5,95 50,100 46.5,95" fill={isMythic ? secondary : primary} />
      </svg>

      {/* Mythic counter-rotating prism constellation */}
      {isMythic && (
        <svg
          viewBox="0 0 100 100"
          className="frame-anim-counter-orbit"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke={secondary}
            strokeWidth="2"
            strokeDasharray="10 14"
            strokeLinecap="round"
            opacity="0.9"
          />
          <polygon points="2,50 6.5,46.5 11,50 6.5,53.5" fill={primary} />
          <polygon points="89,50 93.5,46.5 98,50 93.5,53.5" fill={primary} />
        </svg>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', borderRadius: '50%' }}>
        {children}
      </div>

      {showMotif && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            zIndex: 2,
            width: sizePx >= 72 ? '23px' : '16px',
            height: sizePx >= 72 ? '23px' : '16px',
            borderRadius: '50%',
            backgroundColor: '#121216',
            border: `1.5px solid ${primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px rgba(0,0,0,0.7), 0 0 8px ${primary}66`,
            pointerEvents: 'none'
          }}
        >
          {renderMotifIcon()}
        </div>
      )}
    </div>
  );
}

export default ProfileFrameWrapper;
