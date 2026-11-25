import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, UserX, Heart, Skull } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function LiveLeaderboard({
  leaderboard = [],
  currentUserId = null,
  showRanking = true,
  gameSubtype = 'CLASSIC',
  teamStandings = null
}) {
  const { tx } = useLanguage();
  const getMedal = (index) => `#${index + 1}`;

  const getStatusBadge = (player) => {
    if (player.connectionStatus === 'DISCONNECTED') {
      return <span className="badge badge-red"><UserX size={12} /> DC</span>;
    }
    if (player.isEliminated) {
      return <span className="badge badge-red"><Skull size={12} /> Eliminated</span>;
    }
    switch (player.status) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Leaderboard · {gameSubtype}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
          {leaderboard.length} {tx(leaderboard.length === 1 ? 'Player' : 'Players', 'Pemain')}
        </span>
      </div>

      {teamStandings && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8' }}>TEAM A</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{teamStandings.A?.avgScore || 0} AVG</div>
          </div>
          <div style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fb7185' }}>TEAM B</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{teamStandings.B?.avgScore || 0} AVG</div>
          </div>
        </div>
      )}

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
                opacity: player.isEliminated ? 0.65 : 1,
                transition: 'all var(--transition-fast)'
              }}
            >
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
                  frame={player.equippedFrame}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: isMe ? 'var(--color-primary)' : 'var(--color-text-bright)'
                    }}>
                      {player.displayName} {isMe && '(You)'}
                    </span>
                    {player.teamId && (
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '999px',
                        color: player.teamId === 'A' ? '#38bdf8' : '#fb7185',
                        backgroundColor: player.teamId === 'A' ? 'rgba(56,189,248,0.16)' : 'rgba(244,63,94,0.16)'
                      }}>
                        T{player.teamId}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    {getStatusBadge(player)}
                    {gameSubtype === 'SURVIVAL' && !player.isEliminated && (
                      <span style={{ fontSize: '0.7rem', color: '#fb7185', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <Heart size={10} fill="#fb7185" /> {player.lives ?? 3}
                      </span>
                    )}
                    {player.totalThinkingTime > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Clock size={10} /> {player.totalThinkingTime}s
                      </span>
                    )}
                  </div>
                </div>
              </div>

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
