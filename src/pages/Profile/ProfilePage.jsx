import React, { useState, useEffect } from 'react';
import { 
  Trophy, Flame, Zap, Award, Share2, Clock, History, Calendar, 
  LogOut, Edit3, Music, ExternalLink, Sparkles, CheckCircle2, User, Globe,
  ArrowLeft, Play, Copy, Check, Loader2
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ShareInstagramModal from '../../components/ShareInstagramModal.jsx';
import EditProfileModal from '../../components/EditProfileModal.jsx';
import ApiClient from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import Avatar from '../../components/Avatar.jsx';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Baru saja';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
  if (diffSec < 172800) return 'Kemarin';
  return `${Math.floor(diffSec / 86400)} hari lalu`;
}

function SpotifyIcon({ size = 16, color = '#1DB954' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export function ProfilePage({ user: authUser, targetUsername, onStartDuel, onBack }) {
  const { logout, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(authUser || null);
  const [histories, setHistories] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Determine if viewing own profile
  const isSelf = Boolean(
    !targetUsername ||
    (authUser?.username && targetUsername && authUser.username.toLowerCase() === targetUsername.toLowerCase()) ||
    (authUser?.id && profileData?.id && authUser.id === profileData.id)
  );

  // Load profile data
  const loadProfileData = () => {
    setLoading(true);
    setError(null);

    if (targetUsername) {
      // Lookup by username
      ApiClient.get(`/profile/by-username/${encodeURIComponent(targetUsername.toLowerCase().trim())}`)
        .then((res) => {
          if (res.user) {
            setProfileData(res.user);
            if (res.histories) setHistories(res.histories);
          } else {
            setError('Pemain tidak ditemukan');
          }
        })
        .catch(err => {
          setError(err.message || 'Gagal memuat profil pemain');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (authUser?.id) {
      // Lookup by authUser ID
      Promise.all([
        ApiClient.get(`/profile/${authUser.id}`),
        ApiClient.get(`/profile/${authUser.id}/histories`)
      ]).then(([pRes, hRes]) => {
        if (pRes.user) setProfileData(pRes.user);
        if (hRes.histories) setHistories(hRes.histories);
      }).catch(err => {
        setError(err.message || 'Gagal memuat profil');
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [targetUsername, authUser?.id]);

  const handleProfileUpdated = (updatedUser) => {
    setProfileData(updatedUser);
    if (updateUser) updateUser(updatedUser);
  };

  const handleCopyProfileLink = () => {
    const uname = profileData?.username || targetUsername || authUser?.username;
    if (!uname) return;
    const link = `${window.location.origin}/user/${encodeURIComponent(uname)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const spotifyProfileLink = profileData?.spotifyUrl || (profileData?.spotifyId ? `https://open.spotify.com/user/${profileData.spotifyId}` : null);

  if (loading) {
    return (
      <div className="container-narrow mobile-page-container" style={{ paddingTop: '60px', paddingBottom: '60px', textAlign: 'center' }}>
        <Loader2 size={36} className="spin" style={{ margin: '0 auto 16px', color: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem' }}>
          Memuat data profil {targetUsername ? `@${targetUsername}` : ''}...
        </p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="container-narrow mobile-page-container" style={{ paddingTop: '60px', paddingBottom: '60px', textAlign: 'center' }}>
        <User size={48} style={{ margin: '0 auto 16px', opacity: 0.5, color: 'var(--color-text-dim)' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Pemain Tidak Ditemukan</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Akun dengan username "@{targetUsername}" belum terdaftar atau telah diubah.
        </p>
        {onBack && (
          <Button variant="primary" onClick={onBack}>
            Kembali ke Spotinize
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="container-narrow mobile-page-container" style={{ paddingTop: '20px', paddingBottom: '64px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Top Header Navigation Bar (when navigating from other pages) */}
        {onBack && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={onBack}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}
            >
              <ArrowLeft size={16} /> Kembali
            </button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyProfileLink}
              icon={copied ? <Check size={15} color="var(--color-primary)" /> : <Copy size={15} />}
            >
              {copied ? 'Link Tersalin!' : 'Salin Link'}
            </Button>
          </div>
        )}

        {/* 1. Header Profile Card */}
        <Card style={{
          backgroundColor: 'var(--color-bg-alt)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          padding: '32px 20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Glow Accent */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29, 185, 84, 0.22) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }} />

          {/* Avatar with status */}
          <div 
            style={{ position: 'relative', cursor: isSelf ? 'pointer' : 'default' }}
            onClick={() => isSelf && setShowEditModal(true)}
            title={isSelf ? 'Klik untuk ganti foto profil' : ''}
          >
            <Avatar
              src={profileData?.avatarUrl}
              alt={profileData?.displayName}
              size="lg"
              seed={profileData?.id || profileData?.displayName}
              style={{
                width: '92px',
                height: '92px',
                border: '3px solid var(--color-primary)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}
            />
            {profileData?.spotifyConnected && (
              <div 
                title="Akun Spotify Terhubung"
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  backgroundColor: '#000',
                  borderRadius: '50%',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
                }}
              >
                <SpotifyIcon size={16} />
              </div>
            )}
          </div>

          {/* User Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
              {profileData?.displayName}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <span>@{profileData?.username}</span>
              <span>•</span>
              <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                {profileData?.favoriteCategory || 'Global Trends'} Enjoyer
              </span>
            </div>

            {/* Bio */}
            {profileData?.bio && (
              <p style={{
                fontSize: '0.92rem',
                color: 'var(--color-text)',
                lineHeight: 1.45,
                maxWidth: '440px',
                margin: '8px 0 0 0',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--color-border-subtle)',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                fontStyle: 'italic'
              }}>
                "{profileData.bio}"
              </p>
            )}
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: '4px' }}>
            {/* Edit Profil Button (Always visible when viewing own profile) */}
            {isSelf && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowEditModal(true)}
                icon={<Edit3 size={15} />}
                style={{ fontWeight: 800 }}
              >
                Edit Profil
              </Button>
            )}

            {spotifyProfileLink && (
              <a
                href={spotifyProfileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <SpotifyIcon size={15} />
                <span>View Profile</span>
                <ExternalLink size={12} color="var(--color-text-dim)" />
              </a>
            )}

            {!isSelf && onStartDuel && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStartDuel(profileData)}
                icon={<Play size={15} fill="#000" />}
              >
                Tantang Duel
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowShareModal(true)}
              icon={<Share2 size={15} />}
            >
              Share Story
            </Button>
          </div>
        </Card>

        {/* 2. Favorite Song Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Music size={16} color="var(--color-primary)" /> Lagu Favorit
            </span>
            {isSelf && profileData?.favoriteSongTitle && (
              <button
                onClick={() => setShowEditModal(true)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', padding: '2px 8px', color: 'var(--color-text-dim)' }}
              >
                Ganti Lagu
              </button>
            )}
          </div>

          {profileData?.favoriteSongTitle ? (
            <Card style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid rgba(29, 185, 84, 0.35)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                <img
                  src={profileData.favoriteSongCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=160'}
                  alt={profileData.favoriteSongTitle}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    flexShrink: 0
                  }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--color-text-bright)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {profileData.favoriteSongTitle}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
                    {profileData.favoriteSongArtist}
                  </div>
                </div>
              </div>

              {profileData?.favoriteSongSpotifyId && (
                <a
                  href={`https://open.spotify.com/track/${profileData.favoriteSongSpotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  title="Dengarkan di Spotify"
                  style={{ padding: '8px', color: 'var(--color-primary)', flexShrink: 0 }}
                >
                  <SpotifyIcon size={20} />
                </a>
              )}
            </Card>
          ) : isSelf ? (
            <Card 
              interactive
              onClick={() => setShowEditModal(true)}
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                border: '1px dashed var(--color-border)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Music size={26} color="var(--color-primary)" />
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-bright)' }}>
                + Pilih Lagu Favorit Kamu
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
                Tampilkan lagu andalanmu di profil agar pemain lain tahu musik favoritmu
              </div>
            </Card>
          ) : null}
        </div>

        {/* 3. Statistics Grid */}
        <div>
          <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Statistik Game
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <Card style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '4px' }}>
                <Trophy size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Best Score</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{profileData?.bestScore || 0}</div>
            </Card>

            <Card style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', marginBottom: '4px' }}>
                <Flame size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Games Played</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{profileData?.gamesPlayed || 0}</div>
            </Card>

            <Card style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3d91f4', marginBottom: '4px' }}>
                <Zap size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Average Score</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{profileData?.averageScore || 0}</div>
            </Card>

            <Card style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: '4px' }}>
                <Award size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Win Rate</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{profileData?.winRate || 0}%</div>
            </Card>
          </div>
        </div>

        {/* 4. Game History List */}
        <div>
          <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Riwayat Game Terakhir
          </span>

          {histories.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)' }}>
              <History size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>Belum ada riwayat game.</p>
            </Card>
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
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {h.category} {h.mode === 'MULTIPLAYER' && `(Rank #${h.rank || 1})`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                      {h.mode} • {h.totalRounds} Lagu • {h.totalThinkingTime || 0}s thinking
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
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

        {/* 5. Account Management / Logout Button (Only on own profile) */}
        {isSelf && (
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={logout}
              icon={<LogOut size={18} />}
              style={{ height: '48px', fontWeight: 800 }}
            >
              Keluar dari Akun (Log Out)
            </Button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isSelf && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={profileData}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* Share Instagram Modal */}
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
