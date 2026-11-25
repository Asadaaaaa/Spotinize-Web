import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Music, Ticket, RefreshCw, Check, X
} from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';
import VinylArt from './VinylArt.jsx';
import ItemRarityBadge, { RARITY_META } from './ItemRarityBadge.jsx';
import soundFx from '../services/soundFx.js';
import haptics from '../services/haptics.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function CrateChestIcon({ size = 16, color = 'currentColor', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <path d="M3 11h7.5" />
      <path d="M13.5 11h7.5" />
      <path d="M7.5 5v15" />
      <path d="M16.5 5v15" />
      <rect x="10.5" y="9.5" width="3" height="4" rx="0.8" />
    </svg>
  );
}

const RARITY_RANK = {
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
  MYTHIC: 5
};

function getHighestRarity(results = []) {
  let best = 'COMMON';
  let bestRank = 0;
  for (const r of results) {
    const key = String(r?.rarity || 'COMMON').toUpperCase();
    const rank = RARITY_RANK[key] || 1;
    if (rank > bestRank) {
      bestRank = rank;
      best = key;
    }
  }
  return best;
}

function getTypeLabel(type) {
  if (type === 'FRAME') return 'Frame';
  if (type === 'VINYL') return 'Vinyl';
  return 'Title';
}

export function CrateOpeningModal({
  modalState,
  user,
  useTicketForGacha,
  gachaInfo,
  busy,
  onClose,
  onPullAgain,
  onEquipItem
}) {
  const { tx } = useLanguage();
  const [phase, setPhase] = useState('tapping'); // 'tapping' | 'shaking' | 'burst' | 'revealed'
  const [tapCount, setTapCount] = useState(0);
  const [wobbleSeq, setWobbleSeq] = useState(0);
  const [requiredTaps, setRequiredTaps] = useState(4);
  const [shakeDurationMs, setShakeDurationMs] = useState(1400);
  const [equippedSingle, setEquippedSingle] = useState(false);

  const results = modalState?.data?.results || [];
  const highestRarity = useMemo(() => getHighestRarity(results), [results]);
  const highestMeta = RARITY_META[highestRarity] || RARITY_META.COMMON;
  const isHighTier = ['EPIC', 'LEGENDARY', 'MYTHIC'].includes(highestRarity);

  // Reset state & randomize taps + duration whenever a new pull starts
  useEffect(() => {
    if (!modalState) return;
    if (modalState.loading) {
      setPhase('tapping');
      setTapCount(0);
      setWobbleSeq(0);
      setRequiredTaps(3 + Math.floor(Math.random() * 4)); // 3-6 clicks
      setShakeDurationMs(900 + Math.floor(Math.random() * 1400)); // 0.9s-2.3s random
      setEquippedSingle(false);
    }
  }, [modalState?.loading, Boolean(modalState)]);

  // Step 1: Advance shaking -> burst
  useEffect(() => {
    if (!modalState || modalState.loading || !modalState.data || phase !== 'shaking') return;

    const burstTimer = setTimeout(() => {
      setPhase('burst');
      soundFx.playCrateBurst();
    }, shakeDurationMs);

    return () => clearTimeout(burstTimer);
  }, [modalState?.loading, modalState?.data, phase, shakeDurationMs]);

  // Step 2: Advance burst -> revealed & trigger confetti (zero rarity spoiler until revealed!)
  useEffect(() => {
    if (!modalState || modalState.loading || !modalState.data || phase !== 'burst') return;

    const rarityKey = getHighestRarity(modalState.data.results || []);
    const rarityMeta = RARITY_META[rarityKey] || RARITY_META.COMMON;

    const revealTimer = setTimeout(() => {
      setPhase('revealed');
      soundFx.playCrateReveal(rarityKey);
      haptics.crateReveal(rarityKey);

      try {
        if (rarityKey === 'LEGENDARY' || rarityKey === 'MYTHIC') {
          const colors = [rarityMeta.color, '#ffffff', '#1db954'];
          confetti({ particleCount: 55, angle: 60, spread: 58, origin: { x: 0.15, y: 0.6 }, colors, zIndex: 1500 });
          confetti({ particleCount: 55, angle: 120, spread: 58, origin: { x: 0.85, y: 0.6 }, colors, zIndex: 1500 });
        } else if (rarityKey === 'EPIC' || rarityKey === 'RARE') {
          confetti({
            particleCount: rarityKey === 'EPIC' ? 42 : 24,
            spread: 65,
            origin: { y: 0.56 },
            colors: [rarityMeta.color, '#e5e7eb', '#1db954'],
            zIndex: 1500
          });
        } else {
          confetti({
            particleCount: 14,
            spread: 45,
            origin: { y: 0.58 },
            colors: ['#94a3b8', '#e5e7eb'],
            zIndex: 1500
          });
        }
      } catch (_) {
        // ignore confetti failure
      }
    }, 360);

    return () => clearTimeout(revealTimer);
  }, [modalState?.loading, modalState?.data, phase]);

  // Escape to close only after reveal
  useEffect(() => {
    if (!modalState) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && phase === 'revealed') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalState, phase, onClose]);

  if (!modalState) return null;

  const pullCount = modalState.pullCount || modalState.data?.pullCount || 1;
  const crateId = modalState.crateId || 'crate_groove';
  const totalRefundNotes = modalState.data?.totalRefundNotes || 0;
  const newCount = results.filter(r => !r.wasDuplicate).length;
  const isSingle = results.length === 1;
  const singleResult = isSingle ? results[0] : null;
  const pullPriceNotes = modalState.cratePrices?.[pullCount] || gachaInfo?.prices?.[pullCount] || pullCount * 200;

  const handleCrateTap = () => {
    if (phase !== 'tapping') return;
    const nextSeq = wobbleSeq + 1;
    setWobbleSeq(nextSeq);
    soundFx.playCrateTap(nextSeq);
    haptics.crateTap(nextSeq);
    if (!modalState.loading && modalState.data) {
      const next = tapCount + 1;
      setTapCount(next);
      if (next >= requiredTaps) {
        setPhase('shaking');
      }
    }
  };

  const renderPreview = (item, sizePx) => {
    if (item.type === 'FRAME') {
      return (
        <Avatar
          src={user?.avatarUrl}
          alt={user?.displayName}
          seed={user?.id || user?.username}
          frame={item}
          style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
        />
      );
    }
    if (item.type === 'VINYL') {
      return <VinylArt size={sizePx} borderRadius="50%" skin={item} forceDisc />;
    }
    return (
      <span
        style={{
          fontSize: sizePx >= 64 ? '0.92rem' : '0.72rem',
          fontWeight: 800,
          padding: sizePx >= 64 ? '7px 16px' : '4px 10px',
          borderRadius: '999px',
          color: '#e5e7eb',
          backgroundColor: '#181820',
          border: '1px solid rgba(255,255,255,0.12)',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {item.name}
      </span>
    );
  };

  const handleEquipClick = async () => {
    if (!singleResult?.item || !onEquipItem) return;
    await onEquipItem(singleResult.item);
    setEquippedSingle(true);
  };

  const chestAnimClass =
    phase === 'burst'
      ? 'crate-anim-burst'
      : phase === 'shaking'
        ? 'crate-anim-shake'
        : wobbleSeq > 0
          ? 'crate-anim-tap-wobble'
          : 'crate-anim-float';

  return (
    <div
      className="crate-anim-backdrop"
      onClick={() => phase === 'revealed' && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        backgroundColor: 'rgba(5, 5, 9, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      {phase !== 'revealed' ? (
        /* OPENING STAGE — Neutral monochrome matte, click-to-wobble, zero spoilers */
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '320px',
            width: '100%',
            padding: '42px 24px 36px',
            borderRadius: '24px',
            backgroundColor: '#111116',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px'
          }}
        >
          <div style={{ position: 'relative', width: '132px', height: '132px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(phase === 'shaking' || wobbleSeq > 0) && (
              <div
                key={phase === 'tapping' ? `tap-${wobbleSeq}` : 'shaking-ring'}
                className="crate-anim-shockwave"
                style={{
                  position: 'absolute',
                  width: '102px',
                  height: '102px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  pointerEvents: 'none',
                  animationIterationCount: phase === 'tapping' ? 1 : 'infinite'
                }}
              />
            )}

            <button
              type="button"
              key={phase === 'tapping' ? `chest-${wobbleSeq}` : `chest-${phase}`}
              onClick={handleCrateTap}
              className={chestAnimClass}
              aria-label={tx('Tap crate to open', 'Klik crate untuk membuka')}
              style={{
                position: 'relative',
                zIndex: 2,
                width: '112px',
                height: '112px',
                borderRadius: '50%',
                backgroundColor: '#16161e',
                border: '1.5px solid rgba(255, 255, 255, 0.16)',
                boxShadow: '0 8px 28px rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: phase === 'tapping' ? 'pointer' : 'default',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <CrateChestIcon size={48} color="#f3f4f6" />
            </button>
          </div>

          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#e5e7eb', letterSpacing: '-0.01em' }}>
              {phase === 'tapping'
                ? tx('Tap crate to open', 'Klik crate untuk membuka')
                : tx('Opening...', 'Membuka...')}
            </div>
            {pullCount > 1 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                {pullCount}x Crates
              </div>
            )}
          </div>
        </div>
      ) : (
        /* REVEALED STAGE */
        <div
          onClick={(e) => e.stopPropagation()}
          className="crate-anim-card-reveal"
          style={{
            maxWidth: isSingle ? '380px' : '680px',
            width: '100%',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '22px',
            backgroundColor: '#111116',
            border: `1px solid ${isHighTier ? highestMeta.border : 'rgba(255, 255, 255, 0.09)'}`,
            boxShadow: isHighTier
              ? `0 28px 70px rgba(0,0,0,0.8), 0 0 32px ${highestMeta.color}22`
              : '0 28px 70px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap', minWidth: 0 }}>
              <CrateChestIcon size={17} color={highestMeta.color} />
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: '#f3f4f6' }}>
                {isSingle ? tx('Crate Unlocked', 'Crate Terbuka') : `${tx('Crate Unlocked', 'Crate Terbuka')} (${pullCount}x)`}
              </h3>
              {!isSingle && newCount > 0 && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  · {newCount} {tx('New', 'Baru')}
                </span>
              )}
              {totalRefundNotes > 0 && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e5e7eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={11} color="#94a3b8" /> +{totalRefundNotes} Notes
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              title={tx('Close', 'Tutup')}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#16161e',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div style={{ padding: isSingle ? '28px 24px 24px' : '18px 20px', overflowY: 'auto', flex: 1 }}>
            {isSingle && singleResult ? (
              (() => {
                const meta = RARITY_META[singleResult.rarity] || RARITY_META.COMMON;
                const isTitleItem = singleResult.item.type === 'TITLE';
                return (
                  <div
                    className="crate-anim-card-reveal"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '14px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: 'var(--color-text-dim)',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      }}
                    >
                      {getTypeLabel(singleResult.item.type)}
                    </span>

                    {isTitleItem ? (
                      <div style={{ padding: '14px 0' }}>
                        {renderPreview(singleResult.item, 74)}
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '108px',
                          height: '108px',
                          borderRadius: '50%',
                          backgroundColor: '#16161e',
                          border: `1.5px solid ${meta.border}`,
                          boxShadow: `0 0 28px ${meta.color}28`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {renderPreview(singleResult.item, 74)}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f3f4f6' }}>
                        {singleResult.item.name}
                      </div>

                      <ItemRarityBadge
                        rarity={singleResult.rarity}
                        scarcityLabel={singleResult.item.scarcityLabel}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: '2px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: singleResult.wasDuplicate ? '#facc15' : 'var(--color-primary)'
                      }}
                    >
                      {singleResult.wasDuplicate
                        ? `${tx('Duplicate', 'Duplikat')} -> +${singleResult.refundNotes} Notes`
                        : tx('NEW ITEM', 'ITEM BARU')}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '10px' }}>
                {results.map((r, idx) => {
                  const meta = RARITY_META[r.rarity] || RARITY_META.COMMON;
                  const cardGlow = ['EPIC', 'LEGENDARY', 'MYTHIC'].includes(String(r.rarity).toUpperCase());
                  return (
                    <div
                      key={`${r.item.id}-${idx}`}
                      className="crate-anim-card-reveal"
                      style={{
                        animationDelay: `${idx * 65}ms`,
                        animationFillMode: 'both',
                        padding: '10px',
                        borderRadius: '14px',
                        backgroundColor: '#16161e',
                        border: cardGlow ? `1px solid ${meta.border}` : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: cardGlow ? `0 0 18px ${meta.color}1f` : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div
                        style={{
                          height: '62px',
                          borderRadius: '10px',
                          backgroundColor: '#0e0e13',
                          border: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 6px'
                        }}
                      >
                        {renderPreview(r.item, 44)}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.item.name}
                        </div>
                        <ItemRarityBadge rarity={r.rarity} compact />
                      </div>

                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: '5px',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: r.wasDuplicate ? '#facc15' : 'var(--color-primary)'
                        }}
                      >
                        {r.wasDuplicate ? `+${r.refundNotes} Notes` : tx('NEW', 'BARU')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Minimal Footer */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              backgroundColor: '#0d0d12',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {isSingle && singleResult && !singleResult.wasDuplicate && onEquipItem && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || equippedSingle}
                  onClick={handleEquipClick}
                  icon={equippedSingle ? <Check size={14} /> : undefined}
                >
                  {equippedSingle ? tx('Equipped', 'Terpasang') : tx('Equip Now', 'Pasang')}
                </Button>
              )}

              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => onPullAgain(pullCount, crateId)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span>{tx(`Open Again (${pullCount}x)`, `Buka Lagi (${pullCount}x)`)}</span>
                  <span>·</span>
                  {useTicketForGacha ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Ticket size={12} /> {pullCount}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Music size={12} /> {pullPriceNotes}
                    </span>
                  )}
                </span>
              </Button>
            </div>

            <Button size="sm" variant="primary" onClick={onClose}>
              {tx('Done', 'Selesai')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrateOpeningModal;
