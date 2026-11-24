import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Users, Music2, Sparkles, UserPlus, UserCheck, Flame,
  Play, Square, Loader2, Trophy, CheckCircle2, X
} from 'lucide-react';
import ApiClient from '../../services/api.js';
import feedAudioManager from '../../services/feedAudioManager.js';
import { useTrackDetail } from '../../hooks/useTrackDetail.jsx';
import Avatar from '../../components/Avatar.jsx';
import VinylArt from '../../components/VinylArt.jsx';
import Button from '../../components/Button.jsx';
import FeedPostCard from '../../components/FeedPostCard.jsx';
import { SearchSkeleton } from '../../components/Skeletons.jsx';
import { useLanguage } from '../../hooks/useLanguage.jsx';

export function SearchPage({ user, onOpenPublicProfile, onPlayChallenge }) {
  const { tx } = useLanguage();
  const { openTrackDetail } = useTrackDetail();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'users' | 'tracks' | 'posts'
  const [results, setResults] = useState({ users: [], tracks: [], posts: [] });
  const [trending, setTrending] = useState({ globalTrends: [], indonesiaTrends: [], suggestedUsers: [] });
  const [searching, setSearching] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [busyFollow, setBusyFollow] = useState({});
  const [audioState, setAudioState] = useState(() => feedAudioManager.getState());

  useEffect(() => {
    const unsub = feedAudioManager.subscribe(setAudioState);
    return unsub;
  }, []);

  const loadTrending = useCallback(async () => {
    try {
      setLoadingTrending(true);
      const res = await ApiClient.get('/search/trending');
      setTrending({
        globalTrends: res.globalTrends || [],
        indonesiaTrends: res.indonesiaTrends || [],
        suggestedUsers: res.suggestedUsers || []
      });
    } catch (e) {
    } finally {
      setLoadingTrending(false);
    }
  }, []);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  const runSearch = useCallback(async (q, type) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults({ users: [], tracks: [], posts: [] });
      setSearching(false);
      return;
    }
    try {
      setSearching(true);
      const res = await ApiClient.get(`/search?q=${encodeURIComponent(trimmed)}&type=${type}`);
      setResults({
        users: res.users || [],
        tracks: res.tracks || [],
        posts: res.posts || []
      });
    } catch (e) {
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(query, activeTab);
    }, 240);
    return () => clearTimeout(timer);
  }, [query, activeTab, runSearch]);

  const handleToggleFollow = async (targetUser) => {
    if (!user?.id || !targetUser?.id || busyFollow[targetUser.id]) return;
    try {
      setBusyFollow(prev => ({ ...prev, [targetUser.id]: true }));
      const res = targetUser.isFollowing
        ? await ApiClient.delete(`/follows/${targetUser.id}`)
        : await ApiClient.post(`/follows/${targetUser.id}`);

      const patchList = (list) => list.map(u => (
        u.id === targetUser.id
          ? { ...u, isFollowing: res.isFollowing, isFollowedBy: res.isFollowedBy, isMutual: res.isMutual }
          : u
      ));

      setResults(prev => ({ ...prev, users: patchList(prev.users) }));
      setTrending(prev => ({ ...prev, suggestedUsers: patchList(prev.suggestedUsers) }));
    } catch (e) {
    } finally {
      setBusyFollow(prev => ({ ...prev, [targetUser.id]: false }));
    }
  };

  const handlePlayTrack = (track, prefix = 'search') => {
    const key = `${prefix}:${track.spotifyId || track.id || track.title}`;
    feedAudioManager.toggle({
      key,
      previewUrl: track.previewUrl,
      trackId: track.id
    });
  };

  const renderUserRow = (u) => (
    <div key={u.id} className="search-row-card">
      <div
        onClick={() => onOpenPublicProfile && u.username && onOpenPublicProfile(u.username)}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1, cursor: 'pointer' }}
      >
        <div className="friend-card-avatar-wrap">
          <Avatar src={u.avatarUrl} alt={u.displayName} seed={u.id || u.displayName} style={{ width: '42px', height: '42px' }} />
          <span className={`friend-card-status-dot ${u.isOnline ? 'online' : ''}`} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.displayName}
            </span>
            {u.isOfficial && <CheckCircle2 size={14} color="var(--color-primary)" />}
            {u.currentStreak > 0 && (
              <span className="streak-pill-mini"><Flame size={10} /> {u.currentStreak}</span>
            )}
            {u.isMutual && (
              <span className="badge badge-green" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>Mutual</span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>@{u.username}</span>
            <span>· <Trophy size={11} style={{ verticalAlign: '-1px' }} /> {u.bestScore || 0}</span>
          </div>
        </div>
      </div>

      {user?.id && u.id !== user.id && (
        <Button
          variant={u.isFollowing ? 'secondary' : 'primary'}
          size="sm"
          disabled={busyFollow[u.id]}
          onClick={() => handleToggleFollow(u)}
          icon={busyFollow[u.id] ? <Loader2 size={13} className="spin" /> : u.isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
        >
          {u.isFollowing
            ? (u.isMutual ? 'Mutual' : tx('Following', 'Mengikuti'))
            : (u.isFollowedBy ? tx('Follow Back', 'Follback') : tx('Follow', 'Ikuti'))}
        </Button>
      )}
    </div>
  );

  const renderTrackRow = (track, idx, prefix) => {
    const key = `${prefix}:${track.spotifyId || track.id || track.title}`;
    const isActive = audioState.currentKey === key;
    const hasAudio = Boolean(track.previewUrl || track.id);

    return (
      <div
        key={`${key}-${idx}`}
        className="search-row-card clickable-track-card"
        onClick={() => openTrackDetail(track)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          {track.rank && (
            <span style={{ width: '20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>
              {track.rank}
            </span>
          )}
          <VinylArt src={track.albumArt || track.coverUrl} alt={track.title} size={42} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {track.title}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {track.artist}
            </div>
          </div>
        </div>

        {hasAudio && (
          <button
            type="button"
            className={`trend-play-btn ${isActive ? 'active' : ''}`}
            style={{ width: '34px', height: '34px' }}
            onClick={(e) => {
              e.stopPropagation();
              handlePlayTrack(track, prefix);
            }}
            title={isActive ? 'Stop' : 'Preview'}
          >
            {isActive && audioState.isLoading ? (
              <Loader2 size={14} className="spin" />
            ) : isActive && audioState.isPlaying ? (
              <Square size={12} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </button>
        )}
      </div>
    );
  };

  const hasQuery = Boolean(query.trim());

  return (
    <div className="home-column-wrap mobile-page-container">
      {/* Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 900 }}>{tx('Search & Discover', 'Cari & Jelajahi')}</h2>

        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
          <input
            type="text"
            className="input"
            placeholder={tx('Search players, songs, or posts...', 'Cari pemain, lagu, atau postingan...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '42px', paddingRight: '40px', borderRadius: 'var(--radius-full)' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-dim)',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        {hasQuery && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: tx('All', 'Semua') },
              { id: 'users', label: tx('Players', 'Pemain') },
              { id: 'tracks', label: tx('Songs', 'Lagu') },
              { id: 'posts', label: tx('Posts', 'Postingan') }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`mini-chip-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasQuery ? (
        searching ? (
          <SearchSkeleton mode="results" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="section-mini-label">
                  <Users size={14} /> {tx('Players', 'Pemain')} ({results.users.length})
                </div>
                {results.users.map(renderUserRow)}
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'tracks') && results.tracks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="section-mini-label">
                  <Music2 size={14} /> {tx('Songs', 'Lagu')} ({results.tracks.length})
                </div>
                {results.tracks.map((t, i) => renderTrackRow(t, i, 'search-track'))}
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="section-mini-label">
                  <Sparkles size={14} /> {tx('Posts', 'Postingan')} ({results.posts.length})
                </div>
                <div className="feed-stream">
                  {results.posts.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id}
                      onOpenPublicProfile={onOpenPublicProfile}
                      onPlayChallenge={onPlayChallenge}
                    />
                  ))}
                </div>
              </div>
            )}

            {results.users.length === 0 && results.tracks.length === 0 && results.posts.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)' }}>
                {tx(`No results found for "${query}".`, `Tidak ditemukan hasil untuk "${query}".`)}
              </div>
            )}
          </div>
        )
      ) : (
        /* Discovery View when query is empty */
        loadingTrending ? (
          <SearchSkeleton mode="discovery" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* 1. People You May Know */}
            {trending.suggestedUsers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="section-mini-label">
                  <Sparkles size={14} color="var(--color-primary)" /> {tx('People You May Know', 'People You May Know')}
                </div>
                {trending.suggestedUsers.slice(0, 5).map(renderUserRow)}
              </div>
            )}

            {/* 2. Trends: Global & Indonesia side-by-side */}
            {(trending.globalTrends.length > 0 || trending.indonesiaTrends.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="section-mini-label">
                  <Flame size={14} color="var(--color-primary)" /> Trends
                </div>
                <div className="search-trends-grid">
                  {trending.globalTrends.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-bright)' }}>
                        🌍 Global Top 5
                      </div>
                      {trending.globalTrends.map((t, i) => renderTrackRow(t, i, 'global-trend'))}
                    </div>
                  )}

                  {trending.indonesiaTrends.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-bright)' }}>
                        🇮🇩 Indonesia Top 5
                      </div>
                      {trending.indonesiaTrends.map((t, i) => renderTrackRow(t, i, 'indo-trend'))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

export default SearchPage;
