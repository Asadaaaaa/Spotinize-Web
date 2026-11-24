import React, { useState } from 'react';
import { X, Volume2, VolumeX, LogOut, Settings, Music, Users, User } from 'lucide-react';
import Button from './Button.jsx';
import audioPlayer from '../services/audioPlayer.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function InGameSettingsModal({ isOpen, onClose, gameState, onQuitGame }) {
  const { t, tx, tCategory } = useLanguage();
  const [volume, setVolume] = useState(() => Math.round(audioPlayer.getVolume() * 100));
  const [muted, setMuted] = useState(() => audioPlayer.isMuted());
  const [confirmQuit, setConfirmQuit] = useState(false);

  if (!isOpen) return null;

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    audioPlayer.setVolume(val / 100);
    if (val > 0 && muted) {
      setMuted(false);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioPlayer.setMuted(nextMuted);
  };

  const handleClose = () => {
    setConfirmQuit(false);
    onClose();
  };

  const isMultiplayer = gameState?.mode === 'MULTIPLAYER';

  return (
    <div className="modal-backdrop" onClick={handleClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          padding: '22px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('gameSettingsTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Volume Music Control */}
        <div style={{
          backgroundColor: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-bright)' }}>
              {t('gameVolume')}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {muted ? 'MUTE' : `${volume}%`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleToggleMute}
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px', minWidth: '38px', height: '38px' }}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? <VolumeX size={18} color="var(--color-danger)" /> : <Volume2 size={18} color="var(--color-primary)" />}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                flex: 1,
                accentColor: 'var(--color-primary)',
                cursor: 'pointer',
                height: '6px'
              }}
            />
          </div>
        </div>

        {/* Game Info */}
        <div style={{
          backgroundColor: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isMultiplayer ? <Users size={14} /> : <User size={14} />} Mode
            </span>
            <span style={{ fontWeight: 700, color: 'var(--color-text-bright)' }}>
              {isMultiplayer ? 'Multiplayer' : 'Solo'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Music size={14} /> {tx('Category', 'Kategori')}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--color-text-bright)' }}>
              {tCategory(gameState?.category || 'Global Trends')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-dim)' }}>Round</span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
              {gameState?.currentRound || 1} / {gameState?.numberOfSongs || 5}
            </span>
          </div>

          {isMultiplayer && gameState?.roomCode && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-dim)' }}>{tx('Room Code', 'Kode Room')}</span>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)' }}>
                {gameState.roomCode}
              </span>
            </div>
          )}
        </div>

        {/* Quit Game Section */}
        {!confirmQuit ? (
          <Button
            variant="danger"
            fullWidth
            onClick={() => setConfirmQuit(true)}
            icon={<LogOut size={16} />}
            style={{ height: '44px' }}
          >
            {t('gameQuitBtn')}
          </Button>
        ) : (
          <div style={{
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-bright)', textAlign: 'center', fontWeight: 600 }}>
              {t('gameQuitConfirm')}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setConfirmQuit(false)}
              >
                {t('gameCancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                onClick={() => {
                  setConfirmQuit(false);
                  onClose();
                  onQuitGame();
                }}
              >
                {t('gameYesQuit')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InGameSettingsModal;
