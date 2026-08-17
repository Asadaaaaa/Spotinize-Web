import React from 'react';
import { Trophy, Clock, CheckCircle2, XCircle, AlertCircle, UserX } from 'lucide-react';
import Avatar from './Avatar.jsx';

export function LiveLeaderboard({ leaderboard = [], currentUserId = null, showRanking = true }) {
  const getMedal = (index) => {
    return `#${index + 1}`;
  };

  const getStatusBadge = (status, connectionStatus) => {
    if (connectionStatus === 'DISCONNECTED') {
      return <span className="badge badge-red"><UserX size={12} /> DC</span>;
    }
    switch (status) {
      case 'GUESSED':
        return <span className="badge badge-green"><CheckCircle2 size={12} /> Guessed</span>;
      case 'WRONG':
        return <span className="badge badge-red"><XCircle size={12} /> Wrong</span>;
      case 'SKIPPED':
        return <span className="badge badge-gray"><AlertCircle size={12} /> Skipped</span>;
      case 'LEFT':
        return <span className="badge badge-gray">Left</span>;
      case 'THINKING':
      default:
        return <span className="badge badge-yellow">Thinking...</span>;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      width: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Leaderboard
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
          {leaderboard.length} Pemain
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {leaderboard.map((player, index) => {
          const isMe = player.userId === currentUserId;
          return (
            <div
              key={player.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isMe ? 'var(--color-primary-subtle)' : 'var(--color-surface-hover)',
                border: isMe ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {/* Rank & User Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {showRanking && (
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '24px', textAlign: 'center' }}>
                    {getMedal(index)}
                  </span>
                )}
                <Avatar
                  src={player.avatarUrl}
                  alt={player.displayName}
                  size="sm"
                  seed={player.userId || player.displayName}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: isMe ? 'var(--color-primary)' : 'var(--color-text-bright)'
                  }}>
                    {player.displayName} {isMe && '(You)'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getStatusBadge(player.status, player.connectionStatus)}
                    {player.totalThinkingTime > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Clock size={10} /> {player.totalThinkingTime}s
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  color: isMe ? 'var(--color-primary)' : 'var(--color-text-bright)'
                }}>
                  {player.score || 0}
                </span>
                <span style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: 'var(--color-text-dim)',
                  letterSpacing: '0.05em'
                }}>
                  PTS
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LiveLeaderboard;
