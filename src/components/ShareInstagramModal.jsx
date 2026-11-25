import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import {
  X, Download, Check, Music, Trophy, Flame, Zap, Award,
  Clock, CheckCircle2, Copy
} from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';
import Logo from './Logo.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

const CARD_WIDTH = 300;
const CARD_HEIGHT = 533;

function calcPreviewScale() {
  if (typeof window === 'undefined') return 1;
  const maxW = (window.innerWidth - 56) / CARD_WIDTH;
  const maxH = (window.innerHeight - 215) / CARD_HEIGHT;
  return Math.max(0.58, Math.min(1, maxW, maxH));
}

export function ShareInstagramModal({
  isOpen,
  onClose,
  user,
  score = 0,
  isWinner = false,
  mode = 'SOLO', // 'PROFILE' | 'SOLO' | 'MULTIPLAYER' | 'DAILY'
  category = 'Global Trends',
  totalSongs = 5,
  thinkingTime = 0,
  leaderboard = [],
  rank = 1,
  tracks = [],
  emojiGrid = null
}) {
  const { tx, tCategory } = useLanguage();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewScale, setPreviewScale] = useState(calcPreviewScale);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => setPreviewScale(calcPreviewScale());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  if (!isOpen) return null;

  const isProfileMode = mode === 'PROFILE';
  const isMultiplayerMode = mode === 'MULTIPLAYER';
  const isDailyMode = mode === 'DAILY';
  const isSoloMode = !isProfileMode && !isMultiplayerMode && !isDailyMode;
  const isLocalHost =
    typeof window === 'undefined' ||
    !window.location?.host ||
    /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(window.location.host);
  const siteDomain = isLocalHost ? 'spotinize.hopto.org' : window.location.host;
  const siteOrigin = isLocalHost ? 'https://spotinize.hopto.org' : window.location.origin;

  const modeBadgeLabel = isProfileMode
    ? 'PLAYER CARD'
    : isDailyMode
      ? 'DAILY'
      : isMultiplayerMode
        ? 'DUEL RESULT'
        : 'SOLO RESULT';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 3.6 // Crisp 1080x1920 HD output
      });
      const link = document.createElement('a');
      link.download = `spotinize-${mode.toLowerCase()}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export story card:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const url = isProfileMode && user?.username
      ? `${siteOrigin}/user/${user.username}`
      : siteOrigin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scaledWidth = Math.round(CARD_WIDTH * previewScale);
  const scaledHeight = Math.round(CARD_HEIGHT * previewScale);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content share-story-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          width: '100%',
          maxHeight: '94dvh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {/* Modal Header */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0 }}>
              {isProfileMode
                ? tx('Share Profile to Story', 'Share Profil ke Story')
                : isDailyMode
                  ? tx('Share Spotinize Daily', 'Share Spotinize Daily')
                  : isMultiplayerMode
                    ? tx('Share Multiplayer Duel Result', 'Share Hasil Duel Multiplayer')
                    : tx('Share Solo Game Score', 'Share Skor Game Solo')}
            </h3>
            <p style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {tx('9:16 story card ready for Instagram Story', 'Story card 9:16 siap untuk Instagram Story')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Responsive Scaled Preview Frame (Exports unscaled 300x533 HD card) */}
        <div
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            position: 'relative',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: `${CARD_WIDTH}px`,
              height: `${CARD_HEIGHT}px`,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left'
            }}
          >
            <div
              ref={cardRef}
              style={{
                width: `${CARD_WIDTH}px`,
                height: `${CARD_HEIGHT}px`,
                backgroundColor: '#0b0b0f',
                border: '1px solid #222530',
                borderRadius: '22px',
                padding: '22px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 0 #1DB954, 0 20px 44px rgba(0, 0, 0, 0.78)',
                color: '#ffffff',
                fontFamily: 'var(--font-main, system-ui, sans-serif)'
              }}
            >
              {/* ==================== 1. TOP BRAND BAR ==================== */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Logo size="sm" />
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    letterSpacing: '0.07em',
                    color: '#a1a1aa',
                    backgroundColor: '#13141a',
                    border: '1px solid #232632',
                    padding: '4px 9px',
                    borderRadius: '999px'
                  }}
                >
                  {modeBadgeLabel}
                </span>
              </div>

              {/* ==================== 2. MAIN BODY CONTENT ==================== */}

              {/* ----- CASE A: PROFILE STORY ----- */}
              {isProfileMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', width: '100%', flex: 1, justifyContent: 'center' }}>
                  {/* Identity Card */}
                  <div
                    style={{
                      backgroundColor: '#13141a',
                      border: '1px solid #232632',
                      borderRadius: '16px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar
                        src={user?.avatarUrl}
                        alt={user?.displayName}
                        size="md"
                        seed={user?.id || user?.displayName}
                        frame={user?.equippedFrame}
                        style={{ width: '58px', height: '58px', border: '2px solid #1DB954', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '1.08rem', fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user?.displayName || 'Player'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#1DB954', fontWeight: 700, marginTop: '1px' }}>
                          @{user?.username || 'player'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            backgroundColor: '#1c1e26',
                            border: '1px solid #2a2e3b',
                            color: '#e4e4e7'
                          }}>
                            Lv.{user?.level || 1}
                          </span>
                          {(user?.currentStreak || 0) > 0 && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '999px',
                              backgroundColor: '#1e1712',
                              border: '1px solid rgba(251, 146, 60, 0.35)',
                              color: '#fb923c'
                            }}>
                              <Flame size={10} /> {user.currentStreak}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {user?.bio && (
                      <div style={{
                        borderTop: '1px solid #20232e',
                        paddingTop: '8px',
                        fontSize: '0.72rem',
                        color: '#cbd5e1',
                        fontStyle: 'italic',
                        lineHeight: 1.38
                      }}>
                        "{user.bio}"
                      </div>
                    )}
                  </div>

                  {/* 2x2 Career Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{
                      backgroundColor: '#13141a',
                      border: '1px solid rgba(29, 185, 84, 0.35)',
                      borderRadius: '12px',
                      padding: '10px 12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>
                        <Trophy size={10} color="#1DB954" />
                        <span>Best Score</span>
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1DB954', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                        {user?.bestScore || 0}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#13141a',
                      border: '1px solid #232632',
                      borderRadius: '12px',
                      padding: '10px 12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>
                        <Zap size={10} color="#a1a1aa" />
                        <span>Guess Rate</span>
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                        {user?.guessRate ?? user?.winRate ?? 0}%
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#13141a',
                      border: '1px solid #232632',
                      borderRadius: '12px',
                      padding: '10px 12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>
                        <Music size={10} color="#a1a1aa" />
                        <span>Games Played</span>
                      </div>
                      <div style={{ fontSize: '1.12rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                        {user?.gamesPlayed || 0}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#13141a',
                      border: '1px solid #232632',
                      borderRadius: '12px',
                      padding: '10px 12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>
                        <Award size={10} color="#a1a1aa" />
                        <span>Avg Score</span>
                      </div>
                      <div style={{ fontSize: '1.12rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                        {user?.averageScore || 0}
                      </div>
                    </div>
                  </div>

                  {/* Favorite Song Strip */}
                  {user?.favoriteSongTitle && (
                    <div style={{
                      backgroundColor: '#13141a',
                      border: '1px solid #232632',
                      borderLeft: '3px solid #1DB954',
                      borderRadius: '12px',
                      padding: '9px 11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {user.favoriteSongCover ? (
                        <img
                          src={user.favoriteSongCover}
                          alt={user.favoriteSongTitle}
                          style={{ width: '40px', height: '40px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '7px',
                          backgroundColor: '#1b1d25',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Music size={16} color="#1DB954" />
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#1DB954', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {tx('Favorite Song', 'Lagu Favorit')}
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.favoriteSongTitle}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#8e8e93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.favoriteSongArtist}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ----- CASE D: SPOTINIZE DAILY STORY (Matte Dark, Spoiler-Free) ----- */}
              {isDailyMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', flex: 1, justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar
                      src={user?.avatarUrl}
                      alt={user?.displayName}
                      size="sm"
                      seed={user?.id || user?.displayName}
                      frame={user?.equippedFrame}
                      style={{ width: '40px', height: '40px', border: '1.5px solid #1DB954' }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.displayName || 'Player'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#1DB954', fontWeight: 800, letterSpacing: '0.04em' }}>
                        SPOTINIZE DAILY · SPOILER FREE
                      </div>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#13141a',
                    border: '1px solid rgba(29, 185, 84, 0.32)',
                    borderRadius: '18px',
                    padding: '18px 14px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Daily Score
                    </span>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '3.2rem',
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      color: '#1DB954',
                      margin: '6px 0 8px'
                    }}>
                      {score}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderTop: '1px solid #20232e', paddingTop: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} color="#1DB954" /> {thinkingTime}s
                      </span>
                      <span style={{ color: '#52525b' }}>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#fb923c', fontWeight: 700 }}>
                        <Flame size={11} /> {user?.currentStreak || 1} streak
                      </span>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#13141a',
                    border: '1px solid #232632',
                    borderRadius: '14px',
                    padding: '13px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                      Reveal Grid
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                      {tracks.slice(0, 5).map((t, i) => (
                        <span key={i} style={{
                          padding: '5px 8px',
                          borderRadius: '8px',
                          backgroundColor: t.isCorrect ? '#122018' : '#1a1b22',
                          border: `1px solid ${t.isCorrect ? '#1DB954' : '#2a2d3a'}`,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: t.isCorrect ? '#4ade80' : '#8e8e93',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          {t.isCorrect ? <Check size={11} /> : <X size={11} />} #{i + 1}
                        </span>
                      ))}
                    </div>
                    {emojiGrid && (
                      <div style={{ fontSize: '0.68rem', color: '#a1a1aa', textAlign: 'center', marginTop: '2px', lineHeight: 1.4 }}>
                        {emojiGrid}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----- CASE B: SOLO RESULT STORY ----- */}
              {isSoloMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', width: '100%', flex: 1, justifyContent: 'center' }}>
                  {/* Score Hero Card */}
                  <div style={{
                    backgroundColor: '#13141a',
                    border: '1px solid rgba(29, 185, 84, 0.32)',
                    borderRadius: '18px',
                    padding: '15px 14px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: '#a1a1aa',
                      backgroundColor: '#1a1c24',
                      border: '1px solid #272a36',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '8px'
                    }}>
                      {tCategory(category)} · {totalSongs} {tx('SONGS', 'LAGU')}
                    </div>

                    <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Final Score
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '3.25rem',
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      color: '#1DB954',
                      margin: '4px 0 10px'
                    }}>
                      {score}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.72rem', color: '#d4d4d8', borderTop: '1px solid #20232e', paddingTop: '9px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Clock size={12} color="#1DB954" /> <b>{thinkingTime}s</b>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Award size={12} color="#1DB954" /> <b>{tracks.filter(t => t.isCorrect !== false).length || totalSongs}/{totalSongs}</b> {tx('guessed', 'tertebak')}
                      </span>
                    </div>
                  </div>

                  {/* Tracklist Preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {tx('Track Highlights', 'Highlight Lagu')}
                    </span>

                    {tracks && tracks.length > 0 ? (
                      tracks.slice(0, 3).map((t, idx) => (
                        <div
                          key={t.spotifyId || t.id || idx}
                          style={{
                            backgroundColor: '#13141a',
                            border: '1px solid #232632',
                            borderRadius: '10px',
                            padding: '7px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#71717a', flexShrink: 0 }}>
                              0{idx + 1}
                            </span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.title}
                              </div>
                              <div style={{ fontSize: '0.64rem', color: '#8e8e93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.artist}
                              </div>
                            </div>
                          </div>
                          {t.isCorrect === false ? (
                            <X size={13} color="#71717a" style={{ flexShrink: 0 }} />
                          ) : (
                            <CheckCircle2 size={14} color="#1DB954" style={{ flexShrink: 0 }} />
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ backgroundColor: '#13141a', border: '1px solid #232632', borderRadius: '10px', padding: '10px', fontSize: '0.74rem', color: '#8e8e93', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <Zap size={13} color="#1DB954" />
                        <span>{tx('All rounds completed', 'Semua ronde selesai')}</span>
                      </div>
                    )}
                  </div>

                  {/* Player Footer Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
                    <Avatar
                      src={user?.avatarUrl}
                      alt={user?.displayName}
                      size="sm"
                      seed={user?.id || user?.displayName}
                      frame={user?.equippedFrame}
                      style={{ width: '28px', height: '28px', border: '1.5px solid #1DB954' }}
                    />
                    <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.displayName || 'Player'}
                      </span>
                      {user?.username && (
                        <span style={{ fontSize: '0.68rem', color: '#71717a', fontWeight: 600 }}>
                          @{user.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ----- CASE C: MULTIPLAYER RESULT STORY ----- */}
              {isMultiplayerMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', width: '100%', flex: 1, justifyContent: 'center' }}>
                  {/* Match Hero Card */}
                  <div style={{
                    backgroundColor: '#13141a',
                    border: isWinner || rank === 1 ? '1px solid rgba(29, 185, 84, 0.45)' : '1px solid #232632',
                    borderRadius: '18px',
                    padding: '15px 14px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: isWinner || rank === 1 ? '#122018' : '#1b1d25',
                      border: isWinner || rank === 1 ? '1px solid #1DB954' : '1px solid #2b2e3b',
                      color: isWinner || rank === 1 ? '#1DB954' : '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontWeight: 900,
                      fontSize: '0.74rem',
                      letterSpacing: '0.03em'
                    }}>
                      {isWinner || rank === 1 ? (
                        <>
                          <Trophy size={12} /> <span>1ST PLACE WINNER</span>
                        </>
                      ) : tx(`RANK #${rank} OF ${leaderboard.length || 2}`, `RANK #${rank} DARI ${leaderboard.length || 2}`)}
                    </div>

                    <div style={{ fontSize: '0.68rem', color: '#8e8e93', marginTop: '7px', fontWeight: 700 }}>
                      {tCategory(category)} · {totalSongs} {tx('Songs', 'Lagu')}
                    </div>

                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '2.7rem',
                      fontWeight: 900,
                      color: '#1DB954',
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      marginTop: '8px'
                    }}>
                      {score} <span style={{ fontSize: '0.88rem', color: '#8e8e93', fontWeight: 800 }}>PTS</span>
                    </div>
                  </div>

                  {/* Duel Standings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {tx('Duel Standings', 'Klasemen Duel')}
                    </span>

                    {leaderboard.slice(0, 3).map((p, idx) => {
                      const isMe = p.userId === user?.id;
                      return (
                        <div
                          key={p.userId || idx}
                          style={{
                            backgroundColor: isMe ? '#121d17' : '#13141a',
                            border: isMe ? '1px solid #1DB954' : '1px solid #232632',
                            borderRadius: '10px',
                            padding: '7px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <span style={{
                              fontSize: '0.76rem',
                              fontWeight: 900,
                              fontFamily: 'var(--font-mono)',
                              color: idx === 0 ? '#facc15' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#cd7f32' : '#8e8e93',
                              flexShrink: 0
                            }}>
                              #{idx + 1}
                            </span>
                            <span style={{
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              color: isMe ? '#1DB954' : '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {p.displayName} {isMe && '(You)'}
                            </span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 900, color: isMe ? '#1DB954' : '#ffffff', flexShrink: 0 }}>
                            {p.score} PTS
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================== 3. FOOTER CALL TO ACTION ==================== */}
              <div style={{
                width: '100%',
                backgroundColor: '#13141a',
                border: '1px solid #232632',
                borderRadius: '12px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.64rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {isProfileMode
                    ? tx('View player profile', 'Lihat profil pemain')
                    : isMultiplayerMode
                      ? tx('Play together', 'Mabar tebak lagu')
                      : tx('Can you guess faster?', 'Bisa tebak lebih cepat?')}
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#1DB954', whiteSpace: 'nowrap' }}>
                  {siteDomain}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '2px' }}>
          <Button
            variant="primary"
            fullWidth
            onClick={handleDownload}
            disabled={downloading}
            icon={<Download size={15} />}
            style={{ fontWeight: 800, height: '40px', fontSize: '0.84rem' }}
          >
            {downloading ? tx('Creating Story...', 'Membuat Story...') : tx('Download PNG', 'Download PNG')}
          </Button>

          <Button
            variant="secondary"
            onClick={handleCopyLink}
            icon={copied ? <Check size={15} color="var(--color-primary)" /> : <Copy size={15} />}
            style={{ height: '40px', whiteSpace: 'nowrap', fontSize: '0.82rem' }}
          >
            {copied ? tx('Copied', 'Tersalin') : tx('Copy Link', 'Salin Link')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ShareInstagramModal;
