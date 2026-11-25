import React, { useEffect } from 'react';
import { Flame, Check } from 'lucide-react';
import Button from './Button.jsx';
import soundFx from '../services/soundFx.js';
import haptics from '../services/haptics.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function getTodayMondayIndex() {
  const jsDay = new Date().getDay(); // 0=Sun..6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // 0=Mon..6=Sun
}

export function StreakCelebrationModal({ isOpen, onClose, newStreak = 1, previousStreak = 0 }) {
  const { lang, tx } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      soundFx.playVictory();
      haptics.victory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dayLabels = lang === 'id' ? DAYS_ID : DAYS_EN;
  const todayIdx = getTodayMondayIndex();
  const streakNum = Math.max(1, Number(newStreak) || 1);
  const litStartIdx = Math.max(0, todayIdx - (streakNum - 1));

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1120 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: '#0f1015',
          border: '1px solid rgba(251, 146, 60, 0.35)',
          borderRadius: '22px',
          padding: '26px 22px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '18px'
        }}
      >
        {/* Animated Duolingo-style Flame Emblem */}
        <div className="streak-flame-hero">
          <div className="streak-flame-ring" />
          <div className="streak-flame-core">
            <Flame size={46} color="#fb923c" fill="#fb923c" />
          </div>
        </div>

        {/* Streak Count */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div
            className="streak-count-pop"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '3.2rem',
              fontWeight: 900,
              lineHeight: 1,
              color: '#fb923c'
            }}
          >
            {streakNum}
          </div>
          <h3 style={{ fontSize: '1.18rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
            {streakNum === 1
              ? tx('Streak Started!', 'Streak Dimulai!')
              : tx(`${streakNum} Day Streak!`, `Streak ${streakNum} Hari!`)}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>
            {previousStreak > 0 && streakNum > previousStreak
              ? tx('Awesome! Keep playing daily to keep the flame alive.', 'Mantap! Terus main setiap hari agar apimu tetap menyala.')
              : tx('First flame lit today! Play again tomorrow to grow your streak.', 'Api pertamamu menyala hari ini! Main lagi besok untuk memperpanjang streak.')}
          </p>
        </div>

        {/* 7-Day Weekly Calendar Strip */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#16171f',
            border: '1px solid #262834',
            borderRadius: '16px',
            padding: '14px 10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px'
          }}
        >
          {dayLabels.map((label, idx) => {
            const isToday = idx === todayIdx;
            const isPastLit = idx < todayIdx && idx >= litStartIdx;
            const isLit = isToday || isPastLit;
            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    color: isToday ? '#fb923c' : isPastLit ? '#e4e4e7' : '#71717a',
                    textTransform: 'uppercase'
                  }}
                >
                  {label}
                </span>
                <div
                  className={`streak-cal-day ${isToday ? 'lit-today' : isPastLit ? 'lit-past' : ''}`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isLit ? '#fb923c' : '#1f212b',
                    border: isToday
                      ? '2px solid #fdba74'
                      : isPastLit
                        ? '1px solid #fb923c'
                        : '1px solid #2c2f3d',
                    color: isLit ? '#0b0b0f' : '#52525b'
                  }}
                >
                  {isToday ? (
                    <Flame size={15} strokeWidth={2.5} fill="#0b0b0f" />
                  ) : isPastLit ? (
                    <Check size={14} strokeWidth={3} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={onClose}
          style={{
            height: '44px',
            fontWeight: 900,
            backgroundColor: '#fb923c',
            borderColor: '#fb923c',
            color: '#0b0b0f'
          }}
        >
          {tx('Continue', 'Lanjutkan')}
        </Button>
      </div>
    </div>
  );
}

export default StreakCelebrationModal;
