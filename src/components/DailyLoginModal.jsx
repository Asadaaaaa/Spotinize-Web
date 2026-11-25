import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Sparkles, Lock, Loader2, Snowflake, Ticket, Music, Check } from 'lucide-react';
import Button from './Button.jsx';
import { RARITY_META } from './ItemRarityBadge.jsx';
import { ProfileFrameWrapper } from './ProfileFrameAvatar.jsx';
import VinylArt from './VinylArt.jsx';
import ApiClient from '../services/api.js';
import soundFx from '../services/soundFx.js';
import haptics from '../services/haptics.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function DailyLoginModal({ isOpen, onClose, onClaimed }) {
  const { user } = useAuth();
  const { tx } = useLanguage();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimBanner, setClaimBanner] = useState(null);
  const [error, setError] = useState(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.get('/daily-login/status');
      setStatus(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setClaimBanner(null);
      loadStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = async () => {
    if (!user?.id) {
      onClose?.();
      window.dispatchEvent(new CustomEvent('spotinize:open-guest-upgrade'));
      return;
    }
    if (claiming || !status?.canClaimToday) return;
    try {
      setClaiming(true);
      setError(null);
      const res = await ApiClient.post('/daily-login/claim');
      setStatus(res.status);
      setClaimBanner(res.claimed);
      soundFx.playReward();
      haptics.reward();
      onClaimed?.(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setClaiming(false);
    }
  };

  const cleanLabel = (label) => String(label || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

  const getItemTypeLabel = (itemType) => {
    switch (itemType) {
      case 'FRAME': return 'Profile Frame';
      case 'VINYL': return 'Vinyl Skin';
      case 'TITLE': return 'Profile Title';
      default: return 'Cosmetic';
    }
  };

  const getSubLabel = (d) => {
    if (d.rewardType === 'ITEM') {
      const rarityLabel = RARITY_META[d.rarity || d.item?.rarity]?.label || 'Rare';
      return `${getItemTypeLabel(d.itemType || d.item?.type)} · ${rarityLabel}`;
    }
    if (d.rewardType === 'TICKET') return 'Gacha Ticket';
    if (d.rewardType === 'STREAK_FREEZE') return 'Streak Protection';
    if (d.rewardType === 'XP') return 'Profile XP';
    return 'Store Currency';
  };

  const renderRewardPreview = (dayObj, isDay7 = false) => {
    const iconSize = isDay7 ? 28 : 22;
    if (dayObj.rewardType === 'ITEM' && dayObj.item) {
      const iType = dayObj.item.type || dayObj.itemType;
      if (iType === 'FRAME') {
        return (
          <ProfileFrameWrapper frame={dayObj.item} sizePx={isDay7 ? 52 : 38}>
            <div style={{
              width: isDay7 ? '46px' : '34px',
              height: isDay7 ? '46px' : '34px',
              borderRadius: '50%',
              backgroundColor: '#191922',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={isDay7 ? 18 : 14} color={dayObj.item.visualConfig?.primaryColor || '#facc15'} />
            </div>
          </ProfileFrameWrapper>
        );
      }
      if (iType === 'VINYL') {
        return <VinylArt size={isDay7 ? 52 : 38} borderRadius="50%" skin={dayObj.item} forceDisc />;
      }
      const titleColor = dayObj.item.visualConfig?.color || '#38bdf8';
      return (
        <div style={{
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '0.68rem',
          fontWeight: 800,
          color: titleColor,
          backgroundColor: dayObj.item.visualConfig?.bgColor || 'rgba(56, 189, 248, 0.14)',
          border: `1px solid ${titleColor}44`,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          Title
        </div>
      );
    }

    const wrapStyle = {
      width: '38px',
      height: '38px',
      borderRadius: '11px',
      backgroundColor: '#16161e',
      border: '1px solid #262632',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    if (dayObj.rewardType === 'TICKET') return <div style={wrapStyle}><Ticket size={iconSize} color="#38bdf8" /></div>;
    if (dayObj.rewardType === 'STREAK_FREEZE') return <div style={wrapStyle}><Snowflake size={iconSize} color="#60a5fa" /></div>;
    if (dayObj.rewardType === 'XP') return <div style={wrapStyle}><Sparkles size={iconSize} color="#c084fc" /></div>;
    return <div style={wrapStyle}><Music size={iconSize} color="var(--color-primary)" /></div>;
  };

  const days = status?.days || [];
  const regularDays = days.filter(d => d.day < 7);
  const day7 = days.find(d => d.day === 7) || null;
  const claimedCount = status?.claimedCount || 0;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content daily-login-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          backgroundColor: '#0f0f13',
          border: '1px solid #23232c',
          borderRadius: '20px'
        }}
      >
        {/* Slim 7-Step Progress Strip + Close Button */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--color-text-dim)', marginBottom: '8px', fontWeight: 700, gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{tx('Weekly Progress', 'Progres Mingguan')}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)' }}>{claimedCount}/7</span>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '4px', flexShrink: 0 }} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(step => {
              const done = step <= claimedCount;
              const isNext = !status?.claimedToday && step === status?.nextDayNumber;
              return (
                <div
                  key={step}
                  style={{
                    height: '5px',
                    borderRadius: '999px',
                    backgroundColor: done ? 'var(--color-primary)' : isNext ? 'rgba(29, 185, 84, 0.35)' : '#1e1e26',
                    transition: 'background-color 0.2s ease'
                  }}
                />
              );
            })}
          </div>
        </div>

        {claimBanner && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(29, 185, 84, 0.12)',
            border: '1px solid rgba(29, 185, 84, 0.45)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            fontSize: '0.84rem',
            fontWeight: 700
          }}>
            <CheckCircle2 size={16} color="var(--color-primary)" />
            <span>
              {tx(`Claimed Day ${claimBanner.dayNumber}:`, `Berhasil klaim Hari ${claimBanner.dayNumber}:`)} {claimBanner.label}
            </span>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '44px 0', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="spin" size={28} color="var(--color-primary)" />
          </div>
        ) : (
          <>
            {/* Days 1-6 Uniform 3-Column Grid */}
            <div className="daily-login-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '10px',
              marginBottom: '10px'
            }}>
              {regularDays.map((d) => {
                const active = d.isClaimableToday;
                const claimed = d.claimed;
                const rarityColor = d.rewardType === 'ITEM'
                  ? (RARITY_META[d.rarity || d.item?.rarity]?.color || '#38bdf8')
                  : null;

                return (
                  <div
                    key={d.day}
                    className="daily-login-day-card"
                    style={{
                      padding: '12px 10px',
                      borderRadius: '14px',
                      backgroundColor: active ? 'rgba(29, 185, 84, 0.1)' : '#15151b',
                      border: active
                        ? '1.5px solid var(--color-primary)'
                        : claimed
                          ? '1px solid #1e1e26'
                          : '1px solid #24242e',
                      opacity: claimed ? 0.58 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      textAlign: 'center',
                      minHeight: '116px'
                    }}
                  >
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '0.67rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: active ? 'var(--color-primary)' : 'var(--color-text-dim)'
                      }}>
                        {tx(`Day ${d.day}`, `Hari ${d.day}`)}
                      </span>
                      {claimed ? (
                        <Check size={13} color="var(--color-primary)" />
                      ) : active ? (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                      ) : null}
                    </div>

                    {renderRewardPreview(d, false)}

                    <div style={{ width: '100%' }}>
                      <div style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: 'var(--color-text-bright)',
                        lineHeight: 1.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={cleanLabel(d.label)}>
                        {cleanLabel(d.label)}
                      </div>
                      <div className="daily-login-sublabel" style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: rarityColor || 'var(--color-text-dim)',
                        marginTop: '2px'
                      }}>
                        {getSubLabel(d)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day 7 Featured Grand Reward Card */}
            {day7 && (
              <div
                className="daily-login-day7-card"
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: day7.isClaimableToday ? 'rgba(29, 185, 84, 0.1)' : '#15151b',
                  border: day7.isClaimableToday
                    ? '1.5px solid var(--color-primary)'
                    : '1px solid rgba(250, 204, 21, 0.35)',
                  opacity: day7.claimed ? 0.65 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  marginBottom: '18px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                  {renderRewardPreview(day7, true)}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {tx('Day 7 · Grand Reward', 'Hari 7 · Hadiah Utama')}
                      </span>
                      {day7.claimed && <CheckCircle2 size={13} color="var(--color-primary)" />}
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 900, color: 'var(--color-text-bright)', marginTop: '2px' }}>
                      {cleanLabel(day7.label)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ color: RARITY_META[day7.rarity || day7.item?.rarity]?.color || '#facc15', fontWeight: 700 }}>
                        {getSubLabel(day7)}
                      </span>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Lock size={10} /> {tx('Weekly Exclusive', 'Eksklusif Mingguan')}
                      </span>
                      {day7.item?.scarcityLabel && (
                        <>
                          <span>·</span>
                          <span>{day7.item.scarcityLabel}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clean Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                {tx('Resets Monday 00:00 WIB', 'Reset setiap Senin 00:00 WIB')}
              </span>

              {status?.canClaimToday ? (
                <Button variant="primary" onClick={handleClaim} disabled={claiming}>
                  {claiming ? tx('Claiming...', 'Mengklaim...') : tx(`Claim Day ${status.nextDayNumber}`, `Klaim Hari ${status.nextDayNumber}`)}
                </Button>
              ) : (
                <Button variant="secondary" onClick={onClose} icon={status?.claimedToday ? <Check size={14} color="var(--color-primary)" /> : undefined}>
                  {status?.claimedToday ? tx('Claimed Today', 'Sudah Klaim Hari Ini') : tx('Close', 'Tutup')}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DailyLoginModal;
