import React from 'react';
import { Flame, Play, Check, X } from 'lucide-react';
import Button from './Button.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function getTodayMondayIndex() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function StreakReminderModal({ isOpen, onClose, currentStreak = 0, onPlayNow, startingGame = false }) {
  const { lang, tx } = useLanguage();

  if (!isOpen) return null;

  const dayLabels = lang === 'id' ? DAYS_ID : DAYS_EN;
  const todayIdx = getTodayMondayIndex();
  const streakNum = Math.max(0, Number(currentStreak) || 0);
  const litStartIdx = Math.max(0, todayIdx - streakNum);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1090 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '390px',
          width: '100%',
          backgroundColor: '#0f1015',
          border: '1px solid #262834',
          borderRadius: '22px',
          padding: '24px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          position: 'relative'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-sm"
          style={{ position: 'absolute', top: '12px', right: '12px', padding: '6px' }}
          aria-label={tx('Close', 'Tutup')}
        >
          <X size={18} />
        </button>

        {/* Unlit Flame Icon */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: '#181922',
            border: '1.5px dashed rgba(251, 146, 60, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Flame size={38} color="#fb923c" style={{ opacity: 0.85 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <h3 style={{ fontSize: '1.16rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
            {streakNum > 0
              ? tx(`Protect Your ${streakNum}-Day Streak!`, `Jaga Streak ${streakNum} Harimu!`)
              : tx("Light Up Today's Streak!", 'Nyalakan Streak Hari Ini!')}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.45 }}>
            {tx(
              'Play at least 1 round today so your daily streak stays burning.',
              'Mainkan minimal 1 game hari ini untuk menyalakan dan menjaga streak harianmu.'
            )}
          </p>
        </div>

        {/* Compact Weekly Strip with Today Highlighted as Waiting */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#16171f',
            border: '1px solid #262834',
            borderRadius: '14px',
            padding: '12px 10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px'
          }}
        >
          {dayLabels.map((label, idx) => {
            const isToday = idx === todayIdx;
            const isPastLit = streakNum > 0 && idx < todayIdx && idx >= litStartIdx;
            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    color: isToday ? '#fb923c' : isPastLit ? '#e4e4e7' : '#71717a',
                    textTransform: 'uppercase'
                  }}
                >
                  {label}
                </span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isPastLit ? '#fb923c' : isToday ? 'rgba(251, 146, 60, 0.12)' : '#1f212b',
                    border: isToday
                      ? '1.5px dashed #fb923c'
                      : isPastLit
                        ? '1px solid #fb923c'
                        : '1px solid #2c2f3d',
                    color: isPastLit ? '#0b0b0f' : isToday ? '#fb923c' : '#52525b'
                  }}
                >
                  {isPastLit ? (
                    <Check size={13} strokeWidth={3} />
                  ) : isToday ? (
                    <Flame size={13} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            variant="primary"
            fullWidth
            disabled={startingGame}
            onClick={onPlayNow}
            icon={<Play size={16} fill="#000" />}
            style={{ height: '42px', fontWeight: 900 }}
          >
            {startingGame
              ? tx('Starting Game...', 'Menyiapkan Game...')
              : tx('Play Now', 'Main Sekarang')}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={onClose}
            style={{ height: '36px', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}
          >
            {tx('Maybe Later', 'Nanti Saja')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StreakReminderModal;
