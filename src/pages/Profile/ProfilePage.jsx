import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Flame, Zap, Award, Share2, History,
  Edit3, Music, User, ArrowLeft, Play, Square,
  Loader2, UserPlus, UserCheck, MessageSquare, Bookmark, Disc3, ExternalLink, Swords,
  Package, Check, Target, Crown
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ShareInstagramModal from '../../components/ShareInstagramModal.jsx';
import EditProfileModal from '../../components/EditProfileModal.jsx';
import FeedPostCard from '../../components/FeedPostCard.jsx';
import { RankedTierBadge } from '../../components/ItemRarityBadge.jsx';
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
  const { updateUser, refreshUser } = useAuth();
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
  const [rankedSummary, setRankedSummary] = useState(null);
  const [lockerItems, setLockerItems] = useState([]);
  const [lockerFilter, setLockerFilter] = useState('ALL');
  const [equipBusyId, setEquipBusyId] = useState(null);
  const [savingSongKey, setSavingSongKey] = useState(null);
  const [headToHead, setHeadToHead] = useState(null);
  const [creatingDuel, setCreatingDuel] = useState(false);
  const [savedTracks, setSavedTracks] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'achievements' | 'locker' | 'saved' | 'history' | 'spotify'
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
            setRankedSummary(res.rankedSummary || null);
            setLockerItems(res.locker || []);
            setHeadToHead(res.headToHead || null);
            loadUserPosts(res.user.id);
            if (authUser?.id) {
              ApiClient.get('/saved-tracks').then(sRes => {
                if (sRes?.tracks) setSavedTracks(sRes.tracks);
              }).catch(() => {});
            }
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
          setRankedSummary(pRes.rankedSummary || null);
          setLockerItems(pRes.locker || []);
          setHeadToHead(null);
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

  const isSongSaved = (song) => {
    const sid = song?.spotifyId ? String(song.spotifyId).trim() : null;
    const tLower = (song?.title || '').trim().toLowerCase();
    const aLower = (song?.artist || '').trim().toLowerCase();
    return savedTracks.some(t =>
      (sid && t.spotifyId && String(t.spotifyId).trim() === sid) ||
      ((t.title || '').trim().toLowerCase() === tLower && (t.artist || '').trim().toLowerCase() === aLower)
    );
  };

  const handleToggleSaveSong = async (e, song) => {
    e.stopPropagation();
    if (!authUser?.id || savingSongKey) return;
    const key = song.spotifyId || `${song.title}:${song.artist}`;
    try {
      setSavingSongKey(key);
      await ApiClient.post('/saved-tracks/toggle', { track: song });
      const sRes = await ApiClient.get('/saved-tracks').catch(() => null);
      if (sRes?.tracks) setSavedTracks(sRes.tracks);
    } catch (_) {
    } finally {
      setSavingSongKey(null);
    }
  };

  const handleToggleEquip = async (item) => {
    if (!isSelf || equipBusyId) return;
    try {
      setEquipBusyId(item.id);
      if (item.isEquipped) {
        await ApiClient.post('/store/unequip', { type: item.type });
      } else {
        await ApiClient.post('/store/equip', { itemId: item.id });
      }
      const [invRes] = await Promise.all([
        ApiClient.get('/store/inventory'),
        refreshUser?.()
      ]);
      const nextItems = invRes?.items || [];
      setLockerItems(nextItems);
      setProfileData(prev => {
        if (!prev) return prev;
        const nextFrame = nextItems.find(i => i.type === 'FRAME' && i.isEquipped) || null;
        const nextVinyl = nextItems.find(i => i.type === 'VINYL' && i.isEquipped) || null;
        const nextTitle = nextItems.find(i => i.type === 'TITLE' && i.isEquipped) || null;
        return {
          ...prev,
          equippedFrame: nextFrame,
          equippedVinyl: nextVinyl,
          equippedTitle: nextTitle
        };
      });
    } catch (err) {
      showAlert(err.message || tx('Failed to update item', 'Gagal mengubah item'), tx('Failed', 'Gagal'));
    } finally {
      setEquipBusyId(null);
    }
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
          icon={<Share2 size={13} />}
          style={{ padding: '4px 10px', fontSize: '0.72rem', height: '28px' }}
        >
          <span className="profile-share-label">Share Story</span>
        </Button>

        <div className="profile-unified-grid">
          {/* LEFT COLUMN: Larger Photo + Tilted Tag -> Name + @username side-by-side -> Clean Bio -> Action */}
          <div className="profile-left-col">
            <div
              style={{ position: 'relative', display: 'inline-block', cursor: isSelf ? 'pointer' : 'default', marginTop: '10px', marginBottom: '8px' }}
              onClick={() => isSelf && setShowEditModal(true)}
              title={isSelf ? tx('Click to edit profile', 'Klik untuk edit profil') : ''}
            >
              <Avatar
                src={profileData.avatarUrl}
                alt={profileData.displayName}
                size="lg"
                seed={profileData.id || profileData.displayName}
                frame={profileData.equippedFrame}
                style={{
                  width: '108px',
                  height: '108px',
                  border: '2px solid var(--color-border)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.45)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '-14px',
                  transform: 'rotate(-10deg)',
                  zIndex: 4,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  backgroundColor: '#18181f',
                  border: '1.5px solid rgba(192, 132, 252, 0.55)',
                  color: '#f3f4f6',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.55)'
                }}
              >
                Lv.{profileData.level || 1}
              </span>
              {profileData.currentStreak > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-38px',
                    transform: 'rotate(8deg)',
                    zIndex: 4,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#1b1610',
                    border: '1.5px solid rgba(255, 164, 43, 0.6)',
                    color: 'var(--color-warning)',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.55)'
                  }}
                >
                  <Flame size={11} /> {profileData.currentStreak} Streak
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                {profileData.displayName}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>
                @{profileData.username}
              </span>
            </div>

            {/* Active Title & Ranked Tier */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {profileData.equippedTitle && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 9px',
                  borderRadius: '999px',
                  color: profileData.equippedTitle.visualConfig?.color || '#facc15',
                  backgroundColor: profileData.equippedTitle.visualConfig?.bgColor || 'rgba(250,204,21,0.14)'
                }}>
                  {profileData.equippedTitle.name}
                </span>
              )}
              {rankedSummary && rankedSummary.tier !== 'UNRANKED' && (
                <RankedTierBadge tier={rankedSummary.tier} rp={rankedSummary.rp} compact />
              )}
            </div>

            {/* Level XP Bar */}
            {profileData.levelState && (
              <div style={{ width: '100%', maxWidth: '210px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--color-text-dim)', marginBottom: '3px' }}>
                  <span>XP Level {profileData.level || 1}</span>
                  <span>{profileData.levelState.currentLevelXp}/{profileData.levelState.nextLevelXp}</span>
                </div>
                <div style={{ height: '5px', borderRadius: '999px', backgroundColor: '#0e0e13', overflow: 'hidden' }}>
                  <div style={{ width: `${profileData.levelState.progressPercent || 0}%`, height: '100%', backgroundColor: '#c084fc' }} />
                </div>
              </div>
            )}

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
                  <span style={{ color: 'var(--color-primary)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Disc3 size={12} /> {tasteCompatibility.score}% {tx('Taste Match', 'Kecocokan')}
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', justifyContent: 'center', marginTop: '4px', width: '100%' }}>
              {isSelf && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  icon={<Edit3 size={12} />}
                  style={{ fontWeight: 800, padding: '6px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  {tx('Edit Profile', 'Edit Profil')}
                </Button>
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
              {!isSelf && authUser?.id && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={creatingDuel}
                  onClick={async () => {
                    try {
                      setCreatingDuel(true);
                      const res = await ApiClient.post('/ranked/duel/create', { opponentId: profileData.id });
                      if (res?.gameState && onPlayChallenge) onPlayChallenge(res.gameState);
                    } catch (err) {
                      showAlert?.(err.message);
                    } finally {
                      setCreatingDuel(false);
                    }
                  }}
                  icon={<Swords size={13} color="#38bdf8" />}
                  style={{ padding: '6px 11px', fontSize: '0.75rem' }}
                >
                  {creatingDuel ? '...' : tx('Ranked Duel', 'Tantang Ranked')}
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
                      <VinylArt src={song.coverUrl} alt={song.title} size={34} skin={profileData.equippedVinyl} />
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        {(song.previewUrl || song.title || song.spotifyId) && (
                          <button
                            type="button"
                            className={`trend-play-btn ${isSongPlaying ? 'active' : ''}`}
                            style={{ width: '28px', height: '28px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              feedAudioManager.toggle({
                                key: songAudioKey,
                                previewUrl: song.previewUrl,
                                title: song.title,
                                artist: song.artist,
                                spotifyId: song.spotifyId
                              });
                            }}
                            title={isSongPlaying ? 'Stop' : 'Preview'}
                          >
                            {isSongPlaying && audioState.isLoading ? (
                              <Loader2 size={11} className="spin" />
                            ) : isSongPlaying && audioState.isPlaying ? (
                              <Square size={9} fill="currentColor" />
                            ) : (
                              <Play size={11} fill="currentColor" />
                            )}
                          </button>
                        )}
                        {authUser?.id && (() => {
                          const saved = isSongSaved(song);
                          const songKey = song.spotifyId || `${song.title}:${song.artist}`;
                          return (
                            <button
                              type="button"
                              className={`bookmark-icon-btn ${saved ? 'saved' : ''}`}
                              style={{ width: '28px', height: '28px' }}
                              disabled={savingSongKey === songKey}
                              onClick={(e) => handleToggleSaveSong(e, song)}
                              title={saved ? tx('Remove bookmark', 'Hapus simpanan') : tx('Save song', 'Simpan lagu')}
                            >
                              <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />
                            </button>
                          );
                        })()}
                      </div>
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

            {/* Favorite Category below Favorite Song */}
            <div className="profile-scattered-badges">
              <span
                className="profile-scattered-badge"
                style={{
                  backgroundColor: 'rgba(29, 185, 84, 0.14)',
                  borderColor: 'rgba(29, 185, 84, 0.4)',
                  color: 'var(--color-primary)'
                }}
              >
                <Music size={11} />
                <span>{tCategory(profileData.favoriteCategory || 'Global Trends')}</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 1B. HEAD-TO-HEAD RIVALRY */}
      {!isSelf && headToHead && (
        <Card style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: '#14141a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Swords size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>Head-to-Head Record</div>
              <div style={{ fontSize: '1.02rem', fontWeight: 900 }}>
                {tx('You', 'Kamu')} <span style={{ color: 'var(--color-primary)' }}>{headToHead.viewerWins}</span> — <span style={{ color: '#fb7185' }}>{headToHead.targetWins}</span> {profileData.displayName}
                {headToHead.ties > 0 && <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}> ({headToHead.ties} seri)</span>}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {headToHead.totalMeetings} {tx('total clashes', 'pertemuan')}
          </span>
        </Card>
      )}

      {/* 2. TABS BELOW: POST, ACHIEVEMENTS, LOCKER, SAVES, HISTORY */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="profile-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'posts'}
            className={`profile-tab-item ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <MessageSquare size={14} />
            <span>{tx('Post', 'Post')}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'achievements'}
            className={`profile-tab-item ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <Award size={14} />
            <span>{tx('Achievements', 'Achievements')}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'locker'}
            className={`profile-tab-item ${activeTab === 'locker' ? 'active' : ''}`}
            onClick={() => setActiveTab('locker')}
          >
            <Package size={14} />
            <span>Locker</span>
          </button>
          {isSelf && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'saved'}
              className={`profile-tab-item ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <Bookmark size={14} />
              <span>{tx('Saves', 'Saves')}</span>
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            className={`profile-tab-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} />
            <span>{tx('History', 'Riwayat')}</span>
          </button>
          {spotifyShowcase && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'spotify'}
              className={`profile-tab-item ${activeTab === 'spotify' ? 'active' : ''}`}
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
        ) : activeTab === 'achievements' ? (
          badges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)', borderTop: '1px solid var(--color-border-subtle)' }}>
              {tx('No achievements unlocked yet.', 'Belum ada achievement yang terbuka.')}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '10px' }}>
              {badges.map(b => {
                const renderBadgeIcon = () => {
                  if (b.id === 'speed_demon') return <Zap size={16} color="#facc15" />;
                  if (b.id === 'streak_master') return <Flame size={16} color="var(--color-warning)" />;
                  if (b.id === 'sharp_ear') return <Target size={16} color="#38bdf8" />;
                  if (b.id === '90s_nostalgia') return <Disc3 size={16} color="#c084fc" />;
                  if (b.id === 'veteran') return <Crown size={16} color="#facc15" />;
                  return <Award size={16} color="var(--color-primary)" />;
                };
                return (
                  <div
                    key={b.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: '#131319',
                      border: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: '#1b1b24',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {renderBadgeIcon()}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#f3f4f6' }}>
                      {b.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : activeTab === 'locker' ? (
          (() => {
            const filteredLocker = lockerFilter === 'ALL'
              ? lockerItems
              : lockerItems.filter(i => i.type === lockerFilter);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>
                    {tx('Locker Collection', 'Koleksi Locker')} ({filteredLocker.length})
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'ALL', label: tx('All', 'Semua') },
                      { id: 'FRAME', label: 'Frames' },
                      { id: 'VINYL', label: 'Vinyls' },
                      { id: 'TITLE', label: 'Titles' }
                    ].map(f => {
                      const isActive = lockerFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setLockerFilter(f.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: isActive ? '1px solid rgba(29,185,84,0.45)' : '1px solid rgba(255,255,255,0.08)',
                            backgroundColor: isActive ? 'rgba(29,185,84,0.14)' : '#121218',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'
                          }}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredLocker.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)', borderTop: '1px solid var(--color-border-subtle)' }}>
                    {lockerItems.length === 0
                      ? tx('No cosmetic items in locker yet.', 'Belum ada item kosmetik di locker.')
                      : tx('No items in this category yet.', 'Belum ada item di kategori ini.')}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                    {filteredLocker.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          backgroundColor: '#131319',
                          border: item.isEquipped ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.07)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            height: '64px',
                            borderRadius: '8px',
                            backgroundColor: '#0c0c10',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 8px'
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: '5px',
                              left: '6px',
                              fontSize: '0.56rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'var(--color-text-dim)',
                              padding: '1px 5px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(255,255,255,0.05)'
                            }}
                          >
                            {item.type === 'FRAME' ? 'Frame' : item.type === 'VINYL' ? 'Vinyl' : 'Title'}
                          </span>
                          {item.isEquipped && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '5px',
                                right: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.56rem',
                                fontWeight: 800,
                                color: 'var(--color-primary)',
                                padding: '1px 5px',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(29,185,84,0.14)',
                                border: '1px solid rgba(29,185,84,0.4)'
                              }}
                            >
                              <Check size={9} /> Equipped
                            </span>
                          )}
                          {item.type === 'FRAME' ? (
                            <Avatar
                              src={profileData.avatarUrl}
                              alt={profileData.displayName}
                              seed={profileData.id || profileData.username}
                              frame={item}
                              style={{ width: '40px', height: '40px' }}
                            />
                          ) : item.type === 'VINYL' ? (
                            <VinylArt size={40} borderRadius="50%" skin={item} forceDisc />
                          ) : (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '4px 9px',
                                borderRadius: '999px',
                                color: item.visualConfig?.color || '#facc15',
                                backgroundColor: item.visualConfig?.bgColor || 'rgba(255,255,255,0.08)',
                                border: `1px solid ${item.visualConfig?.color || '#facc15'}44`,
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.name}
                            </span>
                          )}
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>

                        {isSelf && (
                          <div style={{ marginTop: 'auto', paddingTop: '2px' }}>
                            <Button
                              size="sm"
                              variant={item.isEquipped ? 'secondary' : 'primary'}
                              disabled={equipBusyId === item.id}
                              onClick={() => handleToggleEquip(item)}
                              style={{ width: '100%', padding: '5px 8px', fontSize: '0.74rem' }}
                            >
                              {item.isEquipped ? tx('Unequip', 'Lepas') : tx('Equip', 'Pasang')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()
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
