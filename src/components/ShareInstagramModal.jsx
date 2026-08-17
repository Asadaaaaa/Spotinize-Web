import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { 
  X, Download, Check, Music, Trophy, Flame, Zap, Award, 
  Clock, CheckCircle2, Copy, Sparkles, User, ExternalLink
} from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';

function SpotifyIcon({ size = 16, color = '#1DB954' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export function ShareInstagramModal({
  isOpen,
  onClose,
  user,
  score = 0,
  isWinner = false,
  mode = 'SOLO', // 'PROFILE' | 'SOLO' | 'MULTIPLAYER'
  category = 'Global Trends',
  totalSongs = 5,
  thinkingTime = 0,
  leaderboard = [],
  rank = 1,
  tracks = []
}) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isProfileMode = mode === 'PROFILE';
  const isMultiplayerMode = mode === 'MULTIPLAYER';
  const isSoloMode = !isProfileMode && !isMultiplayerMode;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 3.5 // Razor sharp 1080x1920 HD
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
      ? `${window.location.origin}/user/${user.username}`
      : 'https://bit.ly/spotinize';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          padding: '18px 20px',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {/* Modal Header */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {isProfileMode ? 'Share Profil ke Story' : (isMultiplayerMode ? 'Share Hasil Duel Multiplayer' : 'Share Skor Game Solo')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Story card 9:16 siap posting ke Instagram Story
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* 9:16 Clean Story Preview Card */}
        <div
          ref={cardRef}
          style={{
            width: '300px',
            height: '533px', // 9:16 aspect ratio
            backgroundColor: '#0c0c10',
            border: '1px solid #22222a',
            borderRadius: '24px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)'
          }}
        >
          {/* ==================== 1. TOP BRAND HEADER ==================== */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SpotifyIcon size={18} color="#1DB954" />
              <span style={{ fontWeight: 900, fontSize: '0.92rem', letterSpacing: '0.04em', color: '#ffffff' }}>
                SPOTINIZE
              </span>
            </div>

            <div style={{
              backgroundColor: '#181820',
              border: '1px solid #282834',
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.62rem',
              fontWeight: 800,
              color: '#1DB954',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              {isProfileMode ? 'Player Profile' : (isMultiplayerMode ? 'Multiplayer Duel' : 'Solo Game')}
            </div>
          </div>

          {/* ==================== 2. MAIN BODY CONTENT ==================== */}

          {/* ----- CASE A: PROFILE STORY ----- */}
          {isProfileMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', flex: 1, justifyContent: 'center' }}>
              
              {/* User Avatar & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar
                  src={user?.avatarUrl}
                  alt={user?.displayName}
                  size="md"
                  seed={user?.id || user?.displayName}
                  style={{ width: '56px', height: '56px', border: '2px solid #1DB954' }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.displayName || 'Player'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#1DB954', fontWeight: 700 }}>
                    @{user?.username || 'player'}
                  </div>
                </div>
              </div>

              {/* Bio if set */}
              {user?.bio && (
                <div style={{
                  backgroundColor: '#14141a',
                  border: '1px solid #22222c',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.74rem',
                  color: '#d1d1d6',
                  fontStyle: 'italic',
                  lineHeight: 1.35
                }}>
                  "{user.bio}"
                </div>
              )}

              {/* Career Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ backgroundColor: '#14141a', border: '1px solid #22222c', borderRadius: '12px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>Best Score</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1DB954', fontFamily: 'var(--font-mono)' }}>
                    {user?.bestScore || 0}
                  </div>
                </div>

                <div style={{ backgroundColor: '#14141a', border: '1px solid #22222c', borderRadius: '12px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>Win Rate</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {user?.winRate || 0}%
                  </div>
                </div>

                <div style={{ backgroundColor: '#14141a', border: '1px solid #22222c', borderRadius: '12px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>Games Played</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    {user?.gamesPlayed || 0}
                  </div>
                </div>

                <div style={{ backgroundColor: '#14141a', border: '1px solid #22222c', borderRadius: '12px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>Avg Score</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {user?.averageScore || 0}
                  </div>
                </div>
              </div>

              {/* Favorite Song Card if set */}
              {user?.favoriteSongTitle && (
                <div style={{
                  backgroundColor: '#14141a',
                  border: '1px solid rgba(29, 185, 84, 0.3)',
                  borderRadius: '12px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <img
                    src={user.favoriteSongCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                    alt={user.favoriteSongTitle}
                    style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1DB954', textTransform: 'uppercase' }}>Lagu Favorit</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.favoriteSongTitle}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8e8e93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.favoriteSongArtist}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ----- CASE B: SOLO RESULT STORY ----- */}
          {isSoloMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', flex: 1, justifyContent: 'center' }}>
              
              {/* Category Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {category} • {totalSongs} LAGU
                </span>
              </div>

              {/* Hero Score Box */}
              <div style={{
                backgroundColor: '#14141a',
                border: '1px solid #22222c',
                borderRadius: '16px',
                padding: '14px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Final Score
                </span>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '3.2rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: '#1DB954',
                  margin: '4px 0 6px 0'
                }}>
                  {score}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.75rem', color: '#d1d1d6', borderTop: '1px solid #22222c', paddingTop: '8px', marginTop: '4px' }}>
                  <span>⏱️ <b>{thinkingTime}s</b> thinking</span>
                  <span>🎯 <b>{totalSongs}/{totalSongs}</b> tertebak</span>
                </div>
              </div>

              {/* Tracklist Preview of Guessed Songs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Lagu yang Ditebak
                </span>

                {tracks && tracks.length > 0 ? (
                  tracks.slice(0, 3).map((t, idx) => (
                    <div
                      key={t.spotifyId || t.id || idx}
                      style={{
                        backgroundColor: '#14141a',
                        border: '1px solid #22222c',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8e8e93' }}>#{idx + 1}</span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#8e8e93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.artist}
                          </div>
                        </div>
                      </div>
                      <CheckCircle2 size={14} color="#1DB954" style={{ flexShrink: 0 }} />
                    </div>
                  ))
                ) : (
                  <div style={{ backgroundColor: '#14141a', border: '1px solid #22222c', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#8e8e93', textAlign: 'center' }}>
                    Semua lagu tertebak sempurna ⚡
                  </div>
                )}
              </div>

              {/* Player Tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <Avatar
                  src={user?.avatarUrl}
                  alt={user?.displayName}
                  size="sm"
                  seed={user?.id || user?.displayName}
                  style={{ width: '28px', height: '28px' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>
                  {user?.displayName || 'Player'}
                </span>
              </div>
            </div>
          )}

          {/* ----- CASE C: MULTIPLAYER RESULT STORY ----- */}
          {isMultiplayerMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', flex: 1, justifyContent: 'center' }}>
              
              {/* Match Result Badge */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isWinner || rank === 1 ? 'rgba(29, 185, 84, 0.15)' : '#181820',
                  border: isWinner || rank === 1 ? '1px solid #1DB954' : '1px solid #282834',
                  color: isWinner || rank === 1 ? '#1DB954' : '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontWeight: 900,
                  fontSize: '0.85rem'
                }}>
                  {isWinner || rank === 1 ? '🥇 1ST PLACE WINNER' : `RANK #${rank} DARI ${leaderboard.length || 2} PEMAIN`}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#8e8e93', marginTop: '4px' }}>
                  {category} • {totalSongs} Lagu
                </div>
              </div>

              {/* User Score Box */}
              <div style={{
                backgroundColor: '#14141a',
                border: '1px solid #22222c',
                borderRadius: '16px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>
                  Poin Kamu
                </span>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: '#1DB954',
                  lineHeight: 1,
                  marginTop: '2px'
                }}>
                  {score} <span style={{ fontSize: '1rem', color: '#8e8e93' }}>PTS</span>
                </div>
              </div>

              {/* Room Leaderboard Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Peringkat Duel
                </span>

                {leaderboard.slice(0, 3).map((p, idx) => {
                  const isMe = p.userId === user?.id;
                  return (
                    <div
                      key={p.userId || idx}
                      style={{
                        backgroundColor: isMe ? 'rgba(29, 185, 84, 0.1)' : '#14141a',
                        border: isMe ? '1px solid #1DB954' : '1px solid #22222c',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isMe ? '#1DB954' : '#ffffff' }}>
                          {p.displayName} {isMe && '(You)'}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 900, color: isMe ? '#1DB954' : '#ffffff' }}>
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
            backgroundColor: '#181820',
            border: '1px solid #282834',
            borderRadius: '14px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '0.68rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase' }}>
              {isProfileMode ? 'Tantang gue di Spotinize' : (isMultiplayerMode ? 'Mabar tebak lagu' : 'Bisa tebak lebih cepat?')}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#1DB954' }}>
              bit.ly/spotinize
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
            icon={<Download size={16} />}
            style={{ fontWeight: 800, height: '42px' }}
          >
            {downloading ? 'Membuat Story...' : 'Download PNG Story'}
          </Button>

          <Button
            variant="secondary"
            onClick={handleCopyLink}
            icon={copied ? <Check size={16} color="var(--color-primary)" /> : <Copy size={16} />}
            style={{ height: '42px', whiteSpace: 'nowrap' }}
          >
            {copied ? 'Tersalin' : 'Copy Link'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ShareInstagramModal;
