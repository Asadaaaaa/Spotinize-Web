import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Play, Search, UserCheck, Trophy,
  Check, AlertCircle, Flame, HeartHandshake, UserMinus, CheckCircle2
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Avatar from '../../components/Avatar.jsx';
import { FriendsSkeleton } from '../../components/Skeletons.jsx';
import ApiClient from '../../services/api.js';
import socketService from '../../services/socket.js';
import { useLanguage } from '../../hooks/useLanguage.jsx';

export function FriendsPage({ user, onStartMultiplayerWithFriend, onOpenPublicProfile }) {
  const { tx } = useLanguage();
  const [mutuals, setMutuals] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [activeTab, setActiveTab] = useState('mutuals'); // 'mutuals' | 'following' | 'followers'

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyIds, setBusyIds] = useState({});
  const [feedback, setFeedback] = useState(null);

  const loadNetwork = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    try {
      const res = await ApiClient.get('/follows/me');
      setMutuals(res.mutuals || []);
      setFollowing(res.following || []);
      setFollowers(res.followers || []);
    } catch (err) {
      console.error('Failed to load follow network:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await ApiClient.get(`/search?q=${encodeURIComponent(trimmed)}&type=users`);
      setSearchResults(res.users || []);
    } catch (err) {
      console.error('Player search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    loadNetwork();
  }, [loadNetwork]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = socketService.getSocket();

    const handleRealtimeRefresh = () => {
      loadNetwork(true);
      if (searchQuery.trim()) {
        runSearch(searchQuery);
      }
    };

    socket.on('follow:update', handleRealtimeRefresh);
    socket.on('notification:new', handleRealtimeRefresh);
    return () => {
      socket.off('follow:update', handleRealtimeRefresh);
      socket.off('notification:new', handleRealtimeRefresh);
    };
  }, [user?.id, loadNetwork, runSearch, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const timer = setTimeout(() => runSearch(searchQuery), 220);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3200);
  };

  const handleToggleFollow = async (player) => {
    if (!player?.id || busyIds[player.id]) return;
    try {
      setBusyIds(prev => ({ ...prev, [player.id]: true }));
      if (player.isFollowing) {
        await ApiClient.delete(`/follows/${player.id}`);
        showFeedback('success', tx(`Unfollowed @${player.username}.`, `Berhenti mengikuti @${player.username}.`));
      } else {
        const res = await ApiClient.post(`/follows/${player.id}`);
        showFeedback(
          'success',
          res.isMutual
            ? tx(`You and ${player.displayName} are now Mutual! You can duel anytime.`, `Kamu & ${player.displayName} sekarang Mutual! Kalian bisa saling ajak duel.`)
            : tx(`Now following ${player.displayName}.`, `Sekarang mengikuti ${player.displayName}.`)
        );
      }
      await loadNetwork(true);
      if (searchQuery.trim()) {
        await runSearch(searchQuery);
      }
    } catch (err) {
      showFeedback('error', err.message || tx('Failed to update follow status.', 'Gagal memperbarui status follow.'));
    } finally {
      setBusyIds(prev => ({ ...prev, [player.id]: false }));
    }
  };

  const renderPlayerCard = (player) => (
    <Card key={player.id} className="friend-card">
      <div
        className="friend-card-profile"
        onClick={() => onOpenPublicProfile && player.username && onOpenPublicProfile(player.username)}
        style={{ cursor: player.username ? 'pointer' : 'default' }}
      >
        <div className="friend-card-avatar-wrap">
          <Avatar
            src={player.avatarUrl}
            alt={player.displayName}
            seed={player.id || player.displayName}
            className="friend-card-avatar"
          />
          <span className={`friend-card-status-dot ${player.isOnline ? 'online' : ''}`} />
        </div>
        <div className="friend-card-info">
          <div className="friend-card-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
              <div className="friend-card-name">{player.displayName}</div>
              {player.isOfficial && <CheckCircle2 size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />}
              {player.currentStreak > 0 && (
                <span className="streak-pill-mini"><Flame size={10} /> {player.currentStreak}</span>
              )}
            </div>
            <span className={`friend-card-status-pill ${player.isOnline ? 'online' : ''}`}>
              {player.isOnline ? tx('Online', 'Aktif') : 'Offline'}
            </span>
          </div>
          <div className="friend-card-meta">
            {player.username && <span className="friend-card-username">@{player.username}</span>}
            {player.isMutual && (
              <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>• Mutual</span>
            )}
            <span className="friend-card-stats">
              <span className="friend-card-stat">
                <Trophy size={11} color="var(--color-primary)" /> {player.bestScore || 0} pts
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="friend-card-actions">
        {player.isMutual && onStartMultiplayerWithFriend && (
          <Button
            variant="primary"
            size="sm"
            className="friend-action-grow"
            onClick={() => onStartMultiplayerWithFriend(player)}
            icon={<Play size={14} fill="#000" />}
          >
            {tx('Duel', 'Duel')}
          </Button>
        )}

        <Button
          variant={player.isFollowing ? 'secondary' : 'primary'}
          size="sm"
          className={player.isMutual ? 'friend-action-secondary' : 'friend-action-grow'}
          disabled={busyIds[player.id]}
          onClick={() => handleToggleFollow(player)}
          icon={
            busyIds[player.id] ? <Loader2 size={14} className="spin" /> :
            player.isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />
          }
        >
          {player.isFollowing
            ? tx('Following', 'Mengikuti')
            : (player.isFollowedBy ? tx('Follow Back', 'Follow Back') : tx('Follow', 'Ikuti'))}
        </Button>
      </div>
    </Card>
  );

  const isSearching = Boolean(searchQuery.trim());
  const activeList =
    activeTab === 'mutuals' ? mutuals :
    activeTab === 'following' ? following : followers;

  return (
    <div className="home-column-wrap mobile-page-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: '4px' }}>
            {tx('Friends', 'Friends')}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.45 }}>
            {tx(
              'Follow music players to see their posts & activity. Mutual follows can invite each other to live Multiplayer duels!',
              'Follow pemain lain untuk melihat post & aktivitasnya. Pengguna yang saling follow (Mutual) dapat saling ajak duel Multiplayer!'
            )}
          </p>
        </div>

        {feedback && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
            color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            {feedback.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Quick Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
          <input
            type="text"
            className="input"
            placeholder={tx('Search username to follow...', 'Cari username untuk di-follow...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '42px', borderRadius: 'var(--radius-full)' }}
          />
        </div>

        {isSearching ? (
          searching ? (
            <FriendsSkeleton count={3} />
          ) : searchResults.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--color-text-dim)' }}>
              {tx(`No players found for "${searchQuery}".`, `Pemain "${searchQuery}" tidak ditemukan.`)}
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searchResults.map(renderPlayerCard)}
            </div>
          )
        ) : (
          <>
            {/* 3 Tabs: Mutual / Following / Followers */}
            <div className="friend-tabs">
              <button
                type="button"
                className={`btn btn-sm friend-tab-btn ${activeTab === 'mutuals' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('mutuals')}
              >
                <HeartHandshake size={14} />
                <span>Mutual ({mutuals.length})</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm friend-tab-btn ${activeTab === 'following' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('following')}
              >
                <UserCheck size={14} />
                <span>{tx('Following', 'Mengikuti')} ({following.length})</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm friend-tab-btn ${activeTab === 'followers' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('followers')}
              >
                <Users size={14} />
                <span>{tx('Followers', 'Pengikut')} ({followers.length})</span>
              </button>
            </div>

            {loading ? (
              <FriendsSkeleton count={5} />
            ) : activeList.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--color-text-dim)' }}>
                <Users size={30} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  {activeTab === 'mutuals'
                    ? tx('No mutual friends yet', 'Belum ada teman Mutual')
                    : activeTab === 'following'
                      ? tx('Not following anyone yet', 'Belum mengikuti siapa pun')
                      : tx('No followers yet', 'Belum ada pengikut')}
                </div>
                <div style={{ fontSize: '0.82rem' }}>
                  {activeTab === 'mutuals'
                    ? tx('Follow back players who follow you to unlock direct Duel invites!', 'Follow balik pemain yang mengikutimu agar bisa langsung saling ajak duel!')
                    : tx('Use the search bar above to find players on Spotinize.', 'Gunakan kolom pencarian di atas untuk menemukan pemain Spotinize.')}
                </div>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeList.map(renderPlayerCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FriendsPage;
