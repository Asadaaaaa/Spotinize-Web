import React from 'react';
import { Music, Disc3 } from 'lucide-react';

export function PreparingGameModal({
  isOpen = true,
  progress = 0,
  category = 'Global Trends'
}) {
  if (!isOpen) return null;

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="modal-backdrop" style={{ zIndex: 1000, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.88)' }}>
      <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '36px 28px', border: '1px solid var(--color-border)' }}>
        
        {/* Animated Vinyl Icon */}
        <div style={{
          position: 'relative',
          width: '84px',
          height: '84px',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29, 185, 84, 0.25) 0%, rgba(0,0,0,0) 70%)',
            animation: 'pulse 2s infinite'
          }} />
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-bg-alt)',
            border: '2px solid var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(29, 185, 84, 0.35)',
            animation: 'spin 3s linear infinite'
          }}>
            <Disc3 size={40} color="var(--color-primary)" />
          </div>
        </div>

        {/* Modal Title */}
        <h3 style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.01em', color: 'var(--color-text-bright)' }}>
          Mempersiapkan Game
        </h3>

        {/* Loading Progress Bar */}
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          marginBottom: '20px'
        }}>
          <div style={{
            width: `${clampedProgress}%`,
            height: '100%',
            backgroundColor: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.35s ease-out',
            boxShadow: '0 0 12px rgba(29, 185, 84, 0.6)'
          }} />
        </div>

        {/* Animated Equalizer Wave Bars */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '5px',
          height: '24px',
          marginBottom: '20px'
        }}>
          <span className="wave-bar" style={{ height: '22px', animationDuration: '0.6s' }} />
          <span className="wave-bar" style={{ height: '12px', animationDuration: '0.9s' }} />
          <span className="wave-bar" style={{ height: '24px', animationDuration: '0.5s' }} />
          <span className="wave-bar" style={{ height: '16px', animationDuration: '0.7s' }} />
          <span className="wave-bar" style={{ height: '20px', animationDuration: '0.8s' }} />
          <span className="wave-bar" style={{ height: '10px', animationDuration: '0.6s' }} />
        </div>

        {/* Badge Info (Only Category) */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          fontSize: '0.85rem',
          color: 'var(--color-text-dim)'
        }}>
          <Music size={14} color="var(--color-primary)" />
          <span>Kategori: <strong>{category}</strong></span>
        </div>
      </div>
    </div>
  );
}

export default PreparingGameModal;
