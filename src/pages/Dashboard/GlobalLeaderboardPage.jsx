import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Calendar, Shield, Zap, ChevronRight, Users, Globe } from 'lucide-react';
import Avatar from '../../components/Avatar.jsx';
import { RankedTierBadge } from '../../components/ItemRarityBadge.jsx';
import ApiClient from '../../services/api.js';
import { LeaderboardSkeleton } from '../../components/Skeletons.jsx';
import { useLanguage } from '../../hooks/useLanguage.jsx';

export function GlobalLeaderboardPage({ currentUserId, onOpenPublicProfile }) {
  const { tx } = useLanguage();
  const [boardType, setBoardType] = useState('alltime'); // 'daily' | 'alltime' | 'weekly' | 'season'
  const [scope, setScope] = useState('global'); // 'global' | 'friends'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ApiClient.get(`/profile/leaderboard?type=${boardType}&scope=${scope}&limit=30`)
      .then(res => setLeaderboard(res.leaderboard || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [boardType, scope]);

  const getMedal = (index) => {
    if (index === 0) return <span style={{ color: '#facc15' }}>#1</span>;
    if (index === 1) return <span style={{ color: '#cbd5e1' }}>#2</span>;
    if (index === 2) return <span style={{ color: '#cd7f32' }}>#3</span>;
    return `#${index + 1}`;
  };

  const handleUserClick = (username) => {
    if (onOpenPublicProfile && username) {
      onOpenPublicProfile(username);
    }
  };

  const tabs = [
    { id: 'alltime', label: 'All-Time', icon: <Trophy size={13} /> },
    { id: 'daily', label: 'Daily', icon: <Zap size={13} /> },
    { id: 'weekly', label: 'Weekly', icon: <Calendar size={13} /> },
    { id: 'season', label: 'Ranked', icon: <Shield size={13} /> }
  ];

  const getScoreDisplay = (item) => {
    if (boardType === 'daily') {
      return { value: item.score || 0, label: 'DAILY PTS', sub: `${item.correctCount || 0}/5 • ${item.totalThinkingTime || 0}s` };
    }
    if (boardType === 'weekly') {
      return { value: item.weeklyScore || 0, label: 'WEEKLY PTS', sub: `${item.weeklyGames || 0} games • avg ${item.weeklyAvg || 0}` };
    }
    if (boardType === 'season') {
      return { value: item.rp || 0, label: 'SEASON RP', sub: `${item.rankedWins || 0}W / ${item.rankedGamesPlayed || 0}G` };
    }
    return {
      value: item.powerScore ?? item.allTimePowerScore ?? 0,
      label: 'POWER SCORE',
      sub: `${item.officialGamesCount || 0} official · avg ${Math.round(item.officialAvgScore || 0)}`
    };
  };

  return (
    <div className="home-column-wrap mobile-page-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '1.6rem' }}>Leaderboard</h2>
          </div>

          <div className="segmented-pill" style={{ flexShrink: 0 }}>
            <button
              type="button"
              className={`segmented-pill-btn ${scope === 'global' ? 'active' : ''}`}
              onClick={() => setScope('global')}
            >
              <Globe size={13} /> <span>Global</span>
            </button>
            <button
              type="button"
              className={`segmented-pill-btn ${scope === 'friends' ? 'active' : ''}`}
              onClick={() => setScope('friends')}
            >
              <Users size={13} /> <span>Friends</span>
            </button>
          </div>
        </div>

        {/* Board Tabs */}
        <div
          className="segmented-pill"
          style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
        >
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              className={`segmented-pill-btn ${boardType === t.id ? 'active' : ''}`}
              onClick={() => setBoardType(t.id)}
              style={{ justifyContent: 'center', whiteSpace: 'nowrap', padding: '7px 6px' }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '-4px' }}>
          {boardType === 'alltime'
            ? tx('Strict Power Score: Skill (65%) + Consistency (35%).', 'Power Score Ketat: Skill (65%) + Konsistensi (35%).')
            : boardType === 'daily'
              ? tx('Today’s Spotinize Daily global & friends rankings.', 'Peringkat Spotinize Daily hari ini.')
              : boardType === 'weekly'
                ? tx('Resets every Monday 00:00 WIB.', 'Reset setiap Senin pukul 00:00 WIB.')
                : tx('Current Ranked Season RP standings.', 'Peringkat RP Season Ranked aktif.')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <LeaderboardSkeleton count={6} />
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)' }}>
              {tx('No leaderboard data yet for this filter.', 'Belum ada data leaderboard untuk filter ini.')}
            </div>
          ) : (
            leaderboard.map((item, idx) => {
              const isMe = (item.id || item.userId) === currentUserId;
              const scoreInfo = getScoreDisplay(item);
              return (
                <div
                  key={item.id || item.userId}
                  onClick={() => handleUserClick(item.username)}
                  className="leaderboard-item"
                  title={tx(`Open profile /user/${item.username}`, `Buka profil /user/${item.username}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: idx === 0 ? 'var(--color-primary-subtle)' : isMe ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                    border: idx === 0 ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <span style={{
                      fontWeight: 900,
                      fontSize: idx < 3 ? '1.25rem' : '1rem',
                      minWidth: '30px',
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {getMedal(idx)}
                    </span>
                    <Avatar
                      src={item.avatarUrl}
                      alt={item.displayName}
                      seed={item.id || item.displayName}
                      frame={item.equippedFrame}
                      style={{ width: '42px', height: '42px', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.96rem',
                          color: isMe ? 'var(--color-primary)' : 'var(--color-text-bright)'
                        }}>
                          {item.displayName}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '999px', backgroundColor: '#1f2937', color: '#e5e7eb' }}>
                          Lv.{item.level || 1}
                        </span>
                        {item.equippedTitle && (
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            padding: '1px 7px',
                            borderRadius: '999px',
                            color: item.equippedTitle.visualConfig?.color || '#facc15',
                            backgroundColor: item.equippedTitle.visualConfig?.bgColor || 'rgba(250,204,21,0.14)'
                          }}>
                            {item.equippedTitle.name}
                          </span>
                        )}
                        {item.rankedTier && item.rankedTier !== 'UNRANKED' && (
                          <RankedTierBadge tier={item.rankedTier} compact />
                        )}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--color-text-dim)', marginTop: '3px' }}>
                        @{item.username} • {scoreInfo.sub}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                        {scoreInfo.value}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', display: 'block' }}>
                        {scoreInfo.label}
                      </span>
                    </div>
                    <ChevronRight size={17} color="var(--color-text-dim)" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default GlobalLeaderboardPage;
