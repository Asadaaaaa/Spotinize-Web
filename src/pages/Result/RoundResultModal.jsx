import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Music2 } from 'lucide-react';
import Button from '../../components/Button.jsx';
import VinylArt from '../../components/VinylArt.jsx';

export function RoundResultModal({
  isOpen,
  status = 'GUESSED', // 'GUESSED', 'WRONG', 'SKIPPED'
  revealedTrack,
  currentRound = 1,
  totalRounds = 5,
  onNextRound
}) {
  if (!isOpen || !revealedTrack) return null;

  const isCorrect = status === 'GUESSED';
  const isSkipped = status === 'SKIPPED';
  const isWrong = status === 'WRONG';

  return (
    <div className="modal-backdrop">
      <div 
        className="modal-content" 
        style={{
          maxWidth: '440px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          padding: '32px 24px'
        }}
      >
        {/* Status Badge */}
        <div>
          {isCorrect && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} className="badge badge-green">
              <CheckCircle2 size={16} /> TEBAKAN BENAR
            </div>
          )}
          {isWrong && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} className="badge badge-red">
              <XCircle size={16} /> WAKTU HABIS
            </div>
          )}
          {isSkipped && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} className="badge badge-gray">
              <AlertCircle size={16} /> LAGU DILEWATI
            </div>
          )}
        </div>

        {/* Album Artwork Reveal */}
        <div style={{
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          <VinylArt
            src={revealedTrack.albumArt}
            alt={revealedTrack.title}
            size={180}
            borderRadius="16px"
          />
        </div>

        {/* Song Metadata */}
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px', color: 'var(--color-text-bright)' }}>
            {revealedTrack.title}
          </h3>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            {revealedTrack.artist}
          </p>
          {revealedTrack.album && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Album: {revealedTrack.album}
            </p>
          )}
        </div>

        {/* Next Song Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onNextRound}
          icon={<ArrowRight size={20} />}
          style={{ height: '52px', fontSize: '1.1rem' }}
        >
          {currentRound >= totalRounds ? 'Lihat Hasil Akhir' : 'Lagu Berikutnya'}
        </Button>
      </div>
    </div>
  );
}

export default RoundResultModal;
