import React from 'react';
import { Sparkles, Lock, Shield, Award, Gem, Crown, Minus } from 'lucide-react';

export const RARITY_META = {
  COMMON: { label: 'Common', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.14)', border: 'rgba(148, 163, 184, 0.35)' },
  RARE: { label: 'Rare', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.4)' },
  EPIC: { label: 'Epic', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.16)', border: 'rgba(192, 132, 252, 0.45)' },
  LEGENDARY: { label: 'Legendary', color: '#facc15', bg: 'rgba(250, 204, 21, 0.16)', border: 'rgba(250, 204, 21, 0.5)' },
  MYTHIC: { label: 'Mythic', color: '#fb7185', bg: 'rgba(244, 63, 94, 0.2)', border: 'rgba(251, 113, 133, 0.55)' }
};

export const RANKED_TIER_META = {
  UNRANKED: { label: 'Unranked', color: '#71717a', icon: 'minus' },
  BRONZE: { label: 'Bronze', color: '#cd7f32', icon: 'shield' },
  SILVER: { label: 'Silver', color: '#cbd5e1', icon: 'shield' },
  GOLD: { label: 'Gold', color: '#facc15', icon: 'award' },
  PLATINUM: { label: 'Platinum', color: '#2dd4bf', icon: 'gem' },
  DIAMOND: { label: 'Diamond', color: '#38bdf8', icon: 'gem' },
  MAESTRO: { label: 'Maestro', color: '#fb7185', icon: 'crown' }
};

export function ItemRarityBadge({ rarity = 'COMMON', source = null, originTag = null, scarcityLabel = null, compact = false }) {
  const meta = RARITY_META[String(rarity || 'COMMON').toUpperCase()] || RARITY_META.COMMON;
  const isAiExclusive = source === 'daily_login_ai';

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: compact ? '0.68rem' : '0.74rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)'
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: meta.color,
            opacity: 0.85,
            flexShrink: 0
          }}
        />
        <span>{meta.label}</span>
      </span>

      {isAiExclusive && (
        <span style={{ fontSize: '0.66rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>
          · Weekly Exclusive
        </span>
      )}

      {!isAiExclusive && originTag && !compact && (
        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>
          · {originTag}
        </span>
      )}

      {scarcityLabel && (
        <span style={{ fontSize: '0.66rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>
          · {scarcityLabel}
        </span>
      )}
    </div>
  );
}

export function RankedTierBadge({ tier = 'UNRANKED', rp = null, compact = false }) {
  const meta = RANKED_TIER_META[String(tier || 'UNRANKED').toUpperCase()] || RANKED_TIER_META.UNRANKED;
  const iconSz = compact ? 11 : 13;
  const renderTierIcon = () => {
    switch (meta.icon) {
      case 'crown': return <Crown size={iconSz} color={meta.color} />;
      case 'gem': return <Gem size={iconSz} color={meta.color} />;
      case 'award': return <Award size={iconSz} color={meta.color} />;
      case 'shield': return <Shield size={iconSz} color={meta.color} />;
      default: return <Minus size={iconSz} color={meta.color} />;
    }
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: compact ? '0.68rem' : '0.75rem',
        fontWeight: 800,
        padding: compact ? '2px 7px' : '3px 9px',
        borderRadius: '999px',
        color: meta.color,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${meta.color}55`
      }}
    >
      {renderTierIcon()}
      <span>{meta.label}</span>
      {typeof rp === 'number' && tier !== 'UNRANKED' && (
        <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.85 }}>{rp} RP</span>
      )}
    </span>
  );
}

export default ItemRarityBadge;
