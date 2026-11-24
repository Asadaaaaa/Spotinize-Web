import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Flame, Zap, Award, Share2, History,
  Edit3, Music, User, ArrowLeft, Play, Square,
  Loader2, UserPlus, UserCheck, MessageSquare, Bookmark, Disc3, ExternalLink
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ShareInstagramModal from '../../components/ShareInstagramModal.jsx';
import EditProfileModal from '../../components/EditProfileModal.jsx';
import FeedPostCard from '../../components/FeedPostCard.jsx';
import ApiClient from '../../services/api.js';
import socketService from '../../services/socket.js';
import feedAudioManager from '../../services/feedAudioManager.js';
import { useTrackDetail } from '../../hooks/useTrackDetail.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useDialog } from '../../hooks/useDialog.jsx';
import { useLanguage } from '../../hooks/useLanguage.jsx';
import Avatar from '../../components/Avatar.jsx';
import VinylArt from '../../components/VinylArt.jsx';
import { ProfileSkeleton, FeedSkeleton } from '../../components/Skeletons.jsx';

export function ProfilePage({
  user: authUser,
  targetUsername,
  onStartDuel,
  onOpenPublicProfile,
  onPlayChallenge,
  onBack
}) {
  const { updateUser } = useAuth();
  const { showAlert } = useDialog();
  const { tx, tCategory } = useLanguage();
  const { openTrackDetail } = useTrackDetail();

  const [profileData, setProfileData] = useState(authUser || null);
  const [histories, setHistories] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [pinnedSongs, setPinnedSongs] = useState([]);
  const [badges, setBadges] = useState([]);
  const [followCounts, setFollowCounts] = useState({ followersCount: 0, followingCount: 0 });
  const [tasteCompatibility, setTasteCompatibility] = useState(null);
  const [spotifyShowcase, setSpotifyShowcase] = useState(null);
  const [savedTracks, setSavedTracks] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'history' | 'saved' | 'spotify'
  const [spotifyBusy, setSpotifyBusy] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followStatus, setFollowStatus] = useState({ isFollowing: false, isFollowedBy: false, isMutual: false });
  const [followBusy, setFollowBusy] = useState(false);
  const [audioState, setAudioState] = useState(() => feedAudioManager.getState());

  useEffect(() => {
    const unsub = feedAudioManager.subscribe(setAudioState);
    return unsub;
  }, []);

  const isSelf = Boolean(
    !targetUsername ||
    (authUser?.username && targetUsername && authUser.username.toLowerCase() === targetUsername.toLowerCase()) ||
    (authUser?.id && profileData?.id && authUser.id === profileData.id)
  );

  const loadUserPosts = useCallback(async (uid) => {
    if (!uid) return;
    try {
      setLoadingPosts(true);
      const res = await ApiClient.get(`/feed/user/${uid}`);
      setUserPosts(res.posts || []);
    } catch (e) {
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const loadProfileData = useCallback(() => {
    setLoading(true);
    setError(null);

    if (targetUsername) {
      ApiClient.get(`/profile/by-username/${encodeURIComponent(targetUsername.toLowerCase().trim())}`)
        .then((res) => {
          if (res.user) {
            setProfileData(res.user);
            if (res.histories) setHistories(res.histories);
            setPinnedSongs(res.pinnedSongs || []);
            setBadges(res.badges || []);
            setFollowCounts({
              followersCount: res.followersCount || 0,
              followingCount: res.followingCount || 0
            });
            setTasteCompatibility(res.tasteCompatibility || null);
            setSpotifyShowcase(res.spotifyShowcase || null);
            loadUserPosts(res.user.id);
          } else {
            setError(tx('Player not found', 'Pemain tidak ditemukan'));
          }
        })
        .catch(err => {
          setError(err.message || tx('Failed to load player profile', 'Gagal memuat profil pemain'));
        })
        .finally(() => setLoading(false));
    } else if (authUser?.id) {
      Promise.all([
        ApiClient.get(`/profile/${authUser.id}`),
        ApiClient.get(`/profile/${authUser.id}/histories`),
        ApiClient.get('/saved-tracks').catch(() => ({ tracks: [] }))
      ]).then(([pRes, hRes, sRes]) => {
        if (pRes.user) {
          setProfileData(pRes.user);
          setPinnedSongs(pRes.pinnedSongs || []);
          setBadges(pRes.badges || []);
          setFollowCounts({
            followersCount: pRes.followersCount || 0,
            followingCount: pRes.followingCount || 0
          });
          setTasteCompatibility(null);
          setSpotifyShowcase(pRes.spotifyShowcase || null);
          loadUserPosts(pRes.user.id);
        }
        if (hRes.histories) setHistories(hRes.histories);
        if (sRes?.tracks) setSavedTracks(sRes.tracks);
      }).catch(err => {
        setError(err.message || tx('Failed to load profile', 'Gagal memuat profil'));
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [targetUsername, authUser?.id, loadUserPosts, tx]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const loadFollowStatus = useCallback(async () => {
    if (!authUser?.id || isSelf || !profileData?.id) return;
    try {
      const res = await ApiClient.get(`/follows/status/${profileData.id}`);
      setFollowStatus(res || { isFollowing: false, isFollowedBy: false, isMutual: false });
    } catch (e) {}
  }, [authUser?.id, isSelf, profileData?.id]);

  useEffect(() => {
    loadFollowStatus();
  }, [loadFollowStatus]);

  useEffect(() => {
    if (!authUser?.id || isSelf || !profileData?.id) return;
    const socket = socketService.getSocket();
    const handleUpdate = () => loadFollowStatus();
    socket.on('follow:update', handleUpdate);
    return () => socket.off('follow:update', handleUpdate);
  }, [authUser?.id, isSelf, profileData?.id, loadFollowStatus]);

  const handleToggleFollow = async () => {
    if (!profileData?.id || followBusy) return;
    try {
      setFollowBusy(true);
      const res = followStatus.isFollowing
        ? await ApiClient.delete(`/follows/${profileData.id}`)
        : await ApiClient.post(`/follows/${profileData.id}`);
      setFollowStatus({
        isFollowing: Boolean(res.isFollowing),
        isFollowedBy: Boolean(res.isFollowedBy),
        isMutual: Boolean(res.isMutual)
      });
    } catch (err) {
      await showAlert(err.message || tx('Failed to update follow status', 'Gagal memperbarui status follow'), {
        title: tx('Failed', 'Gagal'),
        variant: 'danger'
      });
    } finally {
      setFollowBusy(false);
    }
  };

  const handleConnectSpotify = async () => {
    if (!authUser?.id || spotifyBusy) return;
    try {
      setSpotifyBusy(true);
      const res = await ApiClient.get(`/auth/spotify/connect?userId=${encodeURIComponent(authUser.id)}`);
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (e) {
      showAlert(e.message || 'Gagal membuka Spotify OAuth', 'Spotify');
    } finally {
      setSpotifyBusy(false);
    }
  };

  const handleDisconnectSpotify = async () => {
    if (!authUser?.id || spotifyBusy) return;
    try {
      setSpotifyBusy(true);
      await ApiClient.post('/auth/spotify/disconnect', { userId: authUser.id });
      setProfileData(prev => prev ? { ...prev, spotifyConnected: false } : prev);
      setSpotifyShowcase(null);
      if (updateUser) updateUser({ ...profileData, spotifyConnected: false });
      if (activeTab === 'spotify') setActiveTab('posts');
    } catch (e) {
      showAlert(e.message || 'Gagal memutus Spotify', 'Spotify');
    } finally {
      setSpotifyBusy(false);
    }
  };

  const handleProfileUpdated = (updatedUser) => {
    setProfileData(updatedUser);
    if (updateUser) updateUser(updatedUser);
    if (updatedUser?.id) loadUserPosts(updatedUser.id);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profileData) {
    return (
      <div className="home-column-wrap mobile-page-container" style={{ paddingTop: '56px', textAlign: 'center' }}>
        <User size={44} style={{ margin: '0 auto 12px', opacity: 0.45, color: 'var(--color-text-dim)' }} />
        <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{tx('Player Not Found', 'Pemain Tidak Ditemukan')}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>{error}</p>
        {onBack && (
          <Button variant="primary" onClick={onBack} icon={<ArrowLeft size={16} />}>
            {tx('Back to Home', 'Kembali ke Home')}
          </Button>
        )}
      </div>
    );
  }

  const favAudioKey = `profile-fav:${profileData.id}`;
  const isFavPlaying = audioState.currentKey === favAudioKey;

  return (
    <div className="home-column-wrap mobile-page-container">
      {/* Optional Back Bar for Public Profile */}
      {onBack && !isSelf && (
        <div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: '6px 10px' }}>
            <ArrowLeft size={15} /> {tx('Back', 'Kembali')}
          </button>
        </div>
      )}

      {/* 1. UNIFIED 2-COLUMN PROFILE CARD */}
      <Card className="profile-unified-card">
        {/* Share Story in Top-Right Corner */}
        <Button
          variant="secondary"
          size="sm"
          className="profile-share-corner"
          onClick={() => setShowShareModal(true)}
          icon={<Share2 size={12} />}
          style={{ padding: '4px 10px', fontSize: '0.72rem', height: '28px' }}
        >
          Share Story
        </Button>

        <div className="profile-unified-grid">
          {/* LEFT COLUMN: Larger Photo + Tilted Tag -> Name + @username side-by-side -> Clean Bio -> Action */}
          <div className="profile-left-col">
            <div
              style={{ position: 'relative', cursor: isSelf ? 'pointer' : 'default', marginTop: '6px', marginBottom: '4px' }}
              onClick={() => isSelf && setShowEditModal(true)}
              title={isSelf ? tx('Click to edit profile', 'Klik untuk edit profil') : ''}
            >
              <Avatar
                src={profileData.avatarUrl}
                alt={profileData.displayName}
                size="lg"
                seed={profileData.id || profileData.displayName}
                style={{
                  width: '108px',
                  height: '108px',
                  border: '2px solid var(--color-border)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.45)'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                {profileData.displayName}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>
                @{profileData.username}
              </span>
              {profileData.currentStreak > 0 && (
                <span className="streak-pill-mini">
                  <Flame size={10} /> {profileData.currentStreak}
                </span>
              )}
            </div>

            {profileData.bio && (
              <p style={{
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.4,
                margin: 0,
                fontStyle: 'italic'
              }}>
                "{profileData.bio}"
              </p>
            )}

            {/* Followers / Following + Taste Compatibility */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
              <span><strong style={{ color: 'var(--color-text-bright)' }}>{followCounts.followersCount}</strong> {tx('Followers', 'Pengikut')}</span>
              <span>·</span>
              <span><strong style={{ color: 'var(--color-text-bright)' }}>{followCounts.followingCount}</strong> {tx('Following', 'Mengikuti')}</span>
              {!isSelf && tasteCompatibility && (
                <>
                  <span>·</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
                    🎧 {tasteCompatibility.score}% {tx('Taste Match', 'Kecocokan')}
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', justifyContent: 'center', marginTop: '4px', width: '100%' }}>
              {isSelf && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    icon={<Edit3 size={12} />}
                    style={{ fontWeight: 800, padding: '6px 10px', fontSize: '0.73rem', whiteSpace: 'nowrap' }}
                  >
                    {tx('Edit Profile', 'Edit Profil')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={spotifyBusy}
                    onClick={profileData.spotifyConnected ? handleDisconnectSpotify : handleConnectSpotify}
                    icon={<Disc3 size={12} color={profileData.spotifyConnected ? 'var(--color-primary)' : 'currentColor'} />}
                    style={{ padding: '6px 10px', fontSize: '0.73rem', whiteSpace: 'nowrap' }}
                  >
                    {profileData.spotifyConnected
                      ? tx('Spotify ✓', 'Spotify ✓')
                      : tx('Connect Spotify', 'Connect Spotify')}
                  </Button>
                </>
              )}

              {!isSelf && authUser?.id && (
                <Button
                  variant={followStatus.isFollowing ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={followBusy}
                  onClick={handleToggleFollow}
                  icon={followStatus.isFollowing ? <UserCheck size={13} color="var(--color-primary)" /> : <UserPlus size={13} />}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  {followStatus.isFollowing
                    ? (followStatus.isMutual ? 'Mutual ✓' : tx('Following ✓', 'Mengikuti ✓'))
                    : (followStatus.isFollowedBy ? tx('Follow Back', 'Follow Back') : tx('Follow', 'Ikuti'))}
                </Button>
              )}

              {!isSelf && onStartDuel && followStatus.isMutual && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onStartDuel(profileData)}
                  icon={<Play size={13} fill="#000" />}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  {tx('Duel', 'Duel')}
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Monochrome Statistics Grid -> Favorite Song Below */}
          <div className="profile-right-col">
            <div className="profile-stats-mini-grid">
              <div className="profile-stat-tile">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Trophy size={11} color="var(--color-primary)" /> Best Score
                </div>
                <div style={{ fontSize: '1.08rem', fontWeight: 900, marginTop: '1px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)' }}>{profileData.bestScore || 0}</div>
              </div>

              <div className="profile-stat-tile">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Flame size={11} color="var(--color-text-muted)" /> Games Played
                </div>
                <div style={{ fontSize: '1.08rem', fontWeight: 900, marginTop: '1px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)' }}>{profileData.gamesPlayed || 0}</div>
              </div>

              <div className="profile-stat-tile">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Zap size={11} color="var(--color-text-muted)" /> Avg Score
                </div>
                <div style={{ fontSize: '1.08rem', fontWeight: 900, marginTop: '1px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)' }}>{profileData.averageScore || 0}</div>
              </div>

              <div className="profile-stat-tile">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Award size={11} color="var(--color-text-muted)" /> Guess Rate
                </div>
                <div style={{ fontSize: '1.08rem', fontWeight: 900, marginTop: '1px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)' }}>{profileData.guessRate ?? profileData.winRate ?? 0}%</div>
              </div>
            </div>

            {/* Pinned Songs (1-5) Below Statistics */}
            {(pinnedSongs.length > 0 || profileData.favoriteSongTitle) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(pinnedSongs.length > 0 ? pinnedSongs : [{
                  id: 'fav-1',
                  title: profileData.favoriteSongTitle,
                  artist: profileData.favoriteSongArtist,
                  coverUrl: profileData.favoriteSongCover,
                  previewUrl: profileData.favoriteSongPreviewUrl,
                  spotifyId: profileData.favoriteSongSpotifyId
                }]).slice(0, 5).map((song, idx) => {
                  const songAudioKey = `pinned:${profileData.id}:${song.id || idx}`;
                  const isSongPlaying = audioState.currentKey === songAudioKey;
                  return (
                    <div
                      key={song.id || idx}
                      className="feed-track-box clickable-track-card"
                      style={{ backgroundColor: 'var(--color-bg-alt)', padding: '7px 10px', gap: '9px' }}
                      onClick={() => openTrackDetail({
                        title: song.title,
                        artist: song.artist,
                        coverUrl: song.coverUrl,
                        previewUrl: song.previewUrl,
                        spotifyId: song.spotifyId
                      })}
                    >
                      <VinylArt src={song.coverUrl} alt={song.title} size={34} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {idx === 0 && (
                          <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                            {pinnedSongs.length > 1 ? tx('Pinned Songs', 'Lagu Tersemat') : tx('Favorite Song', 'Lagu Favorit')}
                          </div>
                        )}
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {song.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {song.artist}
                        </div>
                      </div>

                      {song.previewUrl && (
                        <button
                          type="button"
                          className={`trend-play-btn ${isSongPlaying ? 'active' : ''}`}
                          style={{ width: '26px', height: '26px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            feedAudioManager.toggle({
                              key: songAudioKey,
                              previewUrl: song.previewUrl
                            });
                          }}
                          title="Preview"
                        >
                          {isSongPlaying && audioState.isPlaying ? <Square size={9} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : isSelf ? (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--color-border)',
                  backgroundColor: 'var(--color-bg-alt)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}
              >
                <Music size={14} color="var(--color-primary)" />
                <span>{tx('+ Pick Favorite Song', '+ Pilih Lagu Favorit')}</span>
              </button>
            ) : null}

            {/* Scattered Tilted Favorite Category & Auto-Badges below Favorite Song */}
            <div className="profile-scattered-badges">
              <span
                className="profile-scattered-badge"
                style={{
                  backgroundColor: 'rgba(29, 185, 84, 0.14)',
                  borderColor: 'rgba(29, 185, 84, 0.4)',
                  color: 'var(--color-primary)'
                }}
              >
                <span>🎵</span>
                <span>{tCategory(profileData.favoriteCategory || 'Global Trends')}</span>
              </span>
              {badges.map(b => (
                <span key={b.id} className="profile-scattered-badge">
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. TABS BELOW: POST & HISTORY */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="friend-tabs">
          <button
            type="button"
            className={`btn btn-sm friend-tab-btn ${activeTab === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('posts')}
          >
            <MessageSquare size={14} />
            <span>{tx('Posts', 'Post')} ({userPosts.length})</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm friend-tab-btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} />
            <span>{tx('History', 'Riwayat')} ({histories.length})</span>
          </button>
          {isSelf && (
            <button
              type="button"
              className={`btn btn-sm friend-tab-btn ${activeTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('saved')}
            >
              <Bookmark size={14} />
              <span>{tx('Saved', 'Tersimpan')} ({savedTracks.length})</span>
            </button>
          )}
          {spotifyShowcase && (
            <button
              type="button"
              className={`btn btn-sm friend-tab-btn ${activeTab === 'spotify' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('spotify')}
            >
              <Disc3 size={14} />
              <span>Spotify</span>
            </button>
          )}
        </div>

        {activeTab === 'posts' ? (
          loadingPosts ? (
            <FeedSkeleton count={2} />
          ) : userPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)', borderTop: '1px solid var(--color-border-subtle)' }}>
              {tx('No posts yet.', 'Belum ada postingan.')}
            </div>
          ) : (
            <div className="feed-stream">
              {userPosts.map(post => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  currentUserId={authUser?.id}
                  onOpenPublicProfile={onOpenPublicProfile}
                  onPlayChallenge={onPlayChallenge}
                  onDeleted={(deletedId) => setUserPosts(prev => prev.filter(p => p.id !== deletedId))}
                />
              ))}
            </div>
          )
        ) : activeTab === 'saved' ? (
          savedTracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)', borderTop: '1px solid var(--color-border-subtle)' }}>
              {tx('No saved songs yet.', 'Belum ada lagu tersimpan.')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedTracks.map((t, i) => (
                <div
                  key={t.id || i}
                  className="feed-track-box clickable-track-card"
                  onClick={() => openTrackDetail({
                    title: t.title,
                    artist: t.artist,
                    coverUrl: t.coverUrl,
                    previewUrl: t.previewUrl,
                    spotifyId: t.spotifyId
                  })}
                >
                  <VinylArt src={t.coverUrl} alt={t.title} size={42} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-text-bright)' }}>{t.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'spotify' && spotifyShowcase ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {spotifyShowcase.topTracks?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="section-mini-label">{tx('On Repeat (Top Tracks)', 'Sering Diputar')}</div>
                {spotifyShowcase.topTracks.map((t, idx) => (
                  <div
                    key={t.spotifyId || idx}
                    className="feed-track-box clickable-track-card"
                    onClick={() => openTrackDetail(t)}
                  >
                    <VinylArt src={t.coverUrl} alt={t.title} size={40} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--color-text-bright)' }}>{t.title}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>{t.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {spotifyShowcase.publicPlaylists?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="section-mini-label">{tx('Public Playlists', 'Playlist Publik')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {spotifyShowcase.publicPlaylists.map(pl => (
                    <a
                      key={pl.id}
                      href={pl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card"
                      style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
                    >
                      <VinylArt src={pl.coverUrl} alt={pl.name} size={38} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{pl.tracksCount} tracks</div>
                      </div>
                      <ExternalLink size={12} color="var(--color-text-dim)" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : histories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)', borderTop: '1px solid var(--color-border-subtle)' }}>
            {tx('No game history yet.', 'Belum ada riwayat game.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {histories.map(h => (
              <div
                key={h.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem' }}>
                    {tCategory(h.category)} {h.mode === 'MULTIPLAYER' && `(Rank #${h.rank || 1})`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                    {h.mode} • {h.correctCount ?? 0}/{h.totalRounds} {tx('Correct', 'Benar')} • {h.totalThinkingTime || 0}s thinking
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                    {h.score} PTS
                  </span>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem', display: 'block', marginTop: '2px' }}>
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isSelf && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={profileData}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      <ShareInstagramModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={profileData}
        score={profileData?.bestScore || 0}
        isWinner={true}
        mode="PROFILE"
        category={profileData?.favoriteCategory}
      />
    </div>
  );
}

export default ProfilePage;
