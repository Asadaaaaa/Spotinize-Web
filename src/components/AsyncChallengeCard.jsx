import React, { useState } from 'react';
import { Swords, Trophy, Play, Loader2 } from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';
import ApiClient from '../services/api.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function AsyncChallengeCard({ post, currentUserId, onPlayChallenge, onOpenPublicProfile }) {
  const { tx, tCategory } = useLanguage();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const challenge = post.challenge || {};
  const entries = challenge.entries || [];

  const handlePlay = async () => {
    if (!currentUserId || starting) return;
    try {
      setStarting(true);
      setError(null);
      const gameState = await ApiClient.post(`/feed/challenges/${post.id}/play`);
      if (onPlayChallenge && gameState?.id) {
        onPlayChallenge(gameState);
      }
    } catch (err) {
      setError(err.message || tx('Failed to start challenge', 'Gagal memulai tantangan'));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="challenge-card-box">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Swords size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-text-bright)' }}>
              {tCategory(challenge.category || 'Global Trends')} · {challenge.numberOfSongs || 5} {tx('Songs', 'Lagu')}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>
              {tx('Target to beat:', 'Target skor:')} <strong style={{ color: 'var(--color-primary)' }}>{challenge.targetScore || 0} pts</strong>
            </div>
          </div>
        </div>

        {currentUserId && (
          <Button
            variant="primary"
            size="sm"
            disabled={starting}
            onClick={handlePlay}
            icon={starting ? <Loader2 size={14} className="spin" /> : <Play size={14} fill="#000" />}
          >
            {starting ? tx('Loading...', 'Memuat...') : tx('Beat This Score', 'Lawan Skor Ini')}
          </Button>
        )}
      </div>

      {error && (
        <div style={{ fontSize: '0.78rem', color: '#ff707e' }}>{error}</div>
      )}

      {entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className="challenge-mini-row"
              onClick={() => onOpenPublicProfile && entry.username && onOpenPublicProfile(entry.username)}
              style={{ cursor: entry.username ? 'pointer' : 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: entry.rank === 1 ? 'var(--color-primary)' : 'var(--color-text-dim)',
                  width: '20px'
                }}>
                  #{entry.rank}
                </span>
                <Avatar src={entry.avatarUrl} alt={entry.displayName} seed={entry.userId} style={{ width: '22px', height: '22px' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.displayName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>{entry.thinkingTime}s</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 800, color: entry.rank === 1 ? 'var(--color-primary)' : 'var(--color-text)' }}>
                  {entry.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AsyncChallengeCard;
