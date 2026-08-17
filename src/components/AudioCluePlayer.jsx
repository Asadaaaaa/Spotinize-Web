import React from 'react';
import { Play, FastForward, Loader2 } from 'lucide-react';
import Button from './Button.jsx';

const REVEAL_STAGES = [0.1, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0];

export function AudioCluePlayer({
  revealLevel = 0.1,
  isPlaying = false,
  isAudioReady = true,
  isAudioLoading = false,
  disabled = false,
  onPlay,
  onRevealNext
}) {
  const currentIndex = REVEAL_STAGES.indexOf(Number(revealLevel));
  const hasNextReveal = currentIndex >= 0 && currentIndex < REVEAL_STAGES.length - 1;
  const nextStage = hasNextReveal ? REVEAL_STAGES[currentIndex + 1] : null;

  const isButtonDisabled = disabled || !isAudioReady || isAudioLoading;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
      width: '100%',
      maxWidth: '540px',
      margin: '0 auto'
    }}>
      {/* Visual Timeline Track */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 4px'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Progressive Reveal
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {revealLevel}s / 5.0s
          </span>
        </div>

        {/* Step bars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          height: '10px'
        }}>
          {REVEAL_STAGES.map((stage, idx) => {
            const isUnlocked = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={stage}
                title={`${stage}s clue`}
                style={{
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isUnlocked ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                  border: isCurrent ? '1px solid #ffffff' : 'none',
                  transition: 'background-color var(--transition-fast)'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Main Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        width: '100%'
      }}>
        {/* Play Clue Button */}
        <Button
          variant="primary"
          size="lg"
          disabled={isButtonDisabled}
          onClick={onPlay}
          style={{
            flex: '1 1 180px',
            minWidth: '160px',
            height: '52px',
            boxShadow: isPlaying ? '0 0 24px rgba(29, 185, 84, 0.4)' : 'none'
          }}
          icon={isAudioLoading ? (
            <Loader2 className="spin" size={20} color="#000" />
          ) : isPlaying ? (
            <div className="wave-bars">
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
            </div>
          ) : (
            <Play size={20} fill="#000" />
          )}
        >
          {isAudioLoading 
            ? 'Memuat Audio...' 
            : isPlaying 
              ? `Memutar ${revealLevel}s...` 
              : `PLAY ${revealLevel}s`}
        </Button>

        {/* Reveal Next Clue Button */}
        {hasNextReveal && (
          <Button
            variant="secondary"
            size="lg"
            disabled={disabled || isPlaying || isAudioLoading}
            onClick={onRevealNext}
            style={{ flex: '1 1 140px', minWidth: '130px', height: '52px' }}
            title={isPlaying ? 'Tunggu audio selesai' : `Buka clue ${nextStage}s`}
            icon={<FastForward size={18} />}
          >
            Reveal {nextStage}s
          </Button>
        )}
      </div>

      {/* Subtext info */}
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', textAlign: 'center' }}>
        {isPlaying ? 'Dengarkan baik-baik potongan lagunya...' : 'Klik Play untuk mulai dan menghitung waktu.'}
      </p>
    </div>
  );
}

export default AudioCluePlayer;
