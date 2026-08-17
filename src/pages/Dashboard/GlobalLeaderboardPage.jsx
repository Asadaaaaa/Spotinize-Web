import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Award, Clock, Sparkles, ChevronRight } from 'lucide-react';
import Avatar from '../../components/Avatar.jsx';
import ApiClient from '../../services/api.js';

export function GlobalLeaderboardPage({ currentUserId, onOpenPublicProfile }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.get('/profile/leaderboard')
      .then(res => setLeaderboard(res.leaderboard || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const handleUserClick = (username) => {
    if (onOpenPublicProfile && username) {
      onOpenPublicProfile(username);
    }
  };

  return (
    <div className="container-narrow mobile-page-container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <span className="badge badge-green" style={{ marginBottom: '6px' }}>
            <Trophy size={12} /> Hall of Fame
          </span>
          <h2 style={{ fontSize: '1.6rem' }}>Global Leaderboard</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Pemain dengan skor tebak lagu tertinggi di Spotinize. Klik pemain untuk membuka halaman profilnya!
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaderboard.map((item, idx) => {
            const isMe = item.id === currentUserId;
            return (
              <div
                key={item.id}
                onClick={() => handleUserClick(item.username)}
                className="leaderboard-item"
                title={`Buka profil /user/${item.username}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: idx === 0 ? 'var(--color-primary-subtle)' : isMe ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                  border: idx === 0 ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <span style={{
                    fontWeight: 900,
                    fontSize: idx < 3 ? '1.3rem' : '1.1rem',
                    minWidth: '32px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {getMedal(idx)}
                  </span>
                  <Avatar
                    src={item.avatarUrl}
                    alt={item.displayName}
                    seed={item.id || item.displayName}
                    style={{ width: '44px', height: '44px', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '0.98rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: isMe ? 'var(--color-primary)' : 'var(--color-text-bright)'
                    }}>
                      {item.displayName} {isMe && <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>(Kamu)</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                      @{item.username} • {item.gamesPlayed || 0} Games • Win Rate {item.winRate || 0}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                      {item.bestScore || 0}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', display: 'block' }}>
                      BEST PTS
                    </span>
                  </div>
                  <ChevronRight size={18} color="var(--color-text-dim)" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GlobalLeaderboardPage;
