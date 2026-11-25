import React, { useState, useEffect, useCallback } from 'react';
import { Headphones, Users, Flame, Music2, Loader2 } from 'lucide-react';
import ApiClient from '../services/api.js';
import socketService from '../services/socket.js';
import Avatar from './Avatar.jsx';
import { FriendActivitySkeleton } from './Skeletons.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function FollowingActivityCard({ user, onOpenPublicProfile, onNavigateFriends }) {
  const { tx } = useLanguage();
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadActivity = useCallback(async (silent = false) => {
    if (!user?.id) {
      setActivity([]);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await ApiClient.get('/follows/activity');
      setActivity(res.activity || []);
    } catch (e) {
      // Ignore quietly
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadActivity();
    const timer = setInterval(() => loadActivity(true), 45000);
    return () => clearInterval(timer);
  }, [loadActivity]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = socketService.getSocket();
    const refresh = () => loadActivity(true);
    socket.on('follow:update', refresh);
    return () => socket.off('follow:update', refresh);
  }, [user?.id, loadActivity]);

  return (
    <div className="right-widget-card">
      <div className="right-widget-header">
        <Headphones size={16} color="var(--color-primary)" />
        <span>{tx('Friends Activity', 'Aktivitas Teman')}</span>
        {onNavigateFriends && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onNavigateFriends}
            style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '0.72rem' }}
          >
            {tx('See all', 'Lihat')}
          </button>
        )}
      </div>

      {!user?.id ? (
        <div style={{ textAlign: 'center', padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Users size={22} style={{ opacity: 0.5, color: 'var(--color-primary)' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
            {tx('Register a free account to follow players and duel friends.', 'Daftar akun gratis untuk follow pemain dan mabar bareng teman.')}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => window.dispatchEvent(new CustomEvent('spotinize:open-guest-upgrade'))}
            style={{ fontWeight: 800, padding: '6px 14px', fontSize: '0.76rem' }}
          >
            {tx('Register Account', 'Daftar Akun')}
          </button>
        </div>
      ) : loading ? (
        <FriendActivitySkeleton count={5} />
      ) : activity.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '14px 6px', color: 'var(--color-text-dim)', fontSize: '0.8rem', lineHeight: 1.45 }}>
          <Users size={22} style={{ margin: '0 auto 6px', opacity: 0.45 }} />
          <div>{tx('Follow players to see who is online or listening on Spotify.', 'Follow pemain untuk melihat siapa yang aktif atau lagi dengerin Spotify.')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activity.slice(0, 8).map((person) => (
            <div
              key={person.id}
              className="activity-user-row"
              onClick={() => onOpenPublicProfile && person.username && onOpenPublicProfile(person.username)}
            >
              <div className="friend-card-avatar-wrap">
                <Avatar
                  src={person.avatarUrl}
                  alt={person.displayName}
                  seed={person.id || person.displayName}
                  style={{ width: '34px', height: '34px' }}
                />
                <span className={`friend-card-status-dot ${person.isOnline ? 'online' : ''}`} style={{ width: '10px', height: '10px' }} />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    color: 'var(--color-text-bright)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {person.displayName}
                  </span>
                  {person.currentStreak > 0 && (
                    <span className="streak-pill-mini" title={`${person.currentStreak} day streak`}>
                      <Flame size={10} /> {person.currentStreak}
                    </span>
                  )}
                  {person.isMutual && (
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      color: 'var(--color-primary)',
                      backgroundColor: 'var(--color-primary-subtle)',
                      padding: '1px 5px',
                      borderRadius: '999px',
                      flexShrink: 0
                    }}>
                      Mutual
                    </span>
                  )}
                </div>

                {person.nowPlaying ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    color: 'var(--color-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <Music2 size={11} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {person.nowPlaying.title} · {person.nowPlaying.artist}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                    @{person.username} · {person.isOnline ? tx('Online', 'Aktif') : 'Offline'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FollowingActivityCard;
