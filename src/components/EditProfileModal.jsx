import React, { useState, useEffect, useRef } from 'react';
import { 
  X, User, Music, Search, Check, Loader2, Link2, Sparkles, 
  Image, RefreshCw, Trash2, Globe, Upload, Camera, FileImage
} from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';
import ApiClient from '../services/api.js';

const AVATAR_PRESETS = [
  { id: 'bot_star', label: 'Star', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=StarVibe' },
  { id: 'bot_neon', label: 'Neon', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonBeats' },
  { id: 'bot_dj', label: 'DJ', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DJMaster' },
  { id: 'bot_retro', label: 'Retro', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=RetroWave' },
  { id: 'bot_chill', label: 'Chill', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ChillLofi' },
  { id: 'bot_rock', label: 'Rock', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rockstar' },
  { id: 'bot_pixel', label: 'Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Spotinizer' },
  { id: 'bot_adventurer', label: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MusicLover' }
];

// Helper to compress client-side uploaded images to fast Base64 Data URL
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File harus berupa gambar (JPG, PNG, WEBP, dll)'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Gagal memproses gambar'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        // Crop / scale to square from center
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function cleanSpotifyInput(input) {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('spotify:user:')) {
    return `https://open.spotify.com/user/${trimmed.replace('spotify:user:', '')}`;
  }
  return `https://open.spotify.com/user/${trimmed}`;
}

export function EditProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  
  // Favorite Song State
  const [favoriteSong, setFavoriteSong] = useState(null); // { title, artist, coverUrl, spotifyId, previewUrl }
  const [songQuery, setSongQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingSong, setIsSearchingSong] = useState(false);
  const [isSongSearchOpen, setIsSongSearchOpen] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Avatar Tab Mode ('upload' | 'presets' | 'url')
  const [avatarMode, setAvatarMode] = useState('upload');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Submit states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
      setCustomAvatarInput(user.avatarUrl && !user.avatarUrl.startsWith('data:') ? user.avatarUrl : '');
      setBio(user.bio || '');
      setSpotifyUrl(user.spotifyUrl || (user.spotifyId ? `https://open.spotify.com/user/${user.spotifyId}` : ''));
      
      if (user.avatarUrl && user.avatarUrl.startsWith('data:')) {
        setAvatarMode('upload');
      } else if (user.avatarUrl && AVATAR_PRESETS.some(p => p.url === user.avatarUrl)) {
        setAvatarMode('presets');
      } else {
        setAvatarMode('upload');
      }

      if (user.favoriteSongTitle) {
        setFavoriteSong({
          title: user.favoriteSongTitle,
          artist: user.favoriteSongArtist || '',
          coverUrl: user.favoriteSongCover || '',
          spotifyId: user.favoriteSongSpotifyId || '',
          previewUrl: user.favoriteSongPreviewUrl || ''
        });
      } else {
        setFavoriteSong(null);
      }

      setError('');
      setSuccess(false);
      setIsSongSearchOpen(false);
      setSongQuery('');
      setSearchResults([]);
    }
  }, [isOpen, user]);

  // Debounced search for Spotify tracks
  useEffect(() => {
    if (!songQuery.trim()) {
      setSearchResults([]);
      setIsSearchingSong(false);
      return;
    }

    setIsSearchingSong(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await ApiClient.get(`/spotify/search/tracks?q=${encodeURIComponent(songQuery.trim())}&limit=5`);
        setSearchResults(res.tracks || []);
      } catch (err) {
        console.error('Failed to search tracks for favorite:', err);
      } finally {
        setIsSearchingSong(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [songQuery]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setError('');
      const dataUrl = await processImageFile(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setError(err.message || 'Gagal memproses file foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Nama tampilan tidak boleh kosong');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        displayName: displayName.trim(),
        avatarUrl: avatarUrl || null,
        bio: bio.trim(),
        spotifyUrl: spotifyUrl.trim() ? cleanSpotifyInput(spotifyUrl) : '',
        favoriteSong: favoriteSong ? {
          title: favoriteSong.title,
          artist: favoriteSong.artist,
          coverUrl: favoriteSong.coverUrl || favoriteSong.cover,
          spotifyId: favoriteSong.spotifyId || favoriteSong.id,
          previewUrl: favoriteSong.previewUrl
        } : null
      };

      const res = await ApiClient.post(`/profile/${user.id}/update`, payload);
      if (res.user) {
        setSuccess(true);
        if (onProfileUpdated) {
          onProfileUpdated(res.user);
        }
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Edit Profil</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Upload foto sendiri, perbarui bio, akun Spotify, dan lagu favorit
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: 'rgba(29, 185, 84, 0.15)',
              border: '1px solid rgba(29, 185, 84, 0.3)',
              color: 'var(--color-primary)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={18} /> Profil berhasil diperbarui!
            </div>
          )}

          {/* 1. Foto Profil (Avatar) Selection & Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-bright)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Foto Profil
            </label>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
              <div style={{ position: 'relative' }}>
                <Avatar
                  src={avatarUrl}
                  alt={displayName}
                  size="lg"
                  seed={user?.id || displayName}
                  style={{ width: '76px', height: '76px', border: '3px solid var(--color-primary)' }}
                />
                {uploadingAvatar && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Loader2 size={24} className="spin" color="var(--color-primary)" />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('upload')}
                    className={`btn btn-sm ${avatarMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.76rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Upload size={13} /> Upload Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('presets')}
                    className={`btn btn-sm ${avatarMode === 'presets' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.76rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Sparkles size={13} /> Karakter
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('url')}
                    className={`btn btn-sm ${avatarMode === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.76rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Link2 size={13} /> URL
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                  {avatarMode === 'upload' && 'Pilih foto dari galeri/kamera perangkatmu'}
                  {avatarMode === 'presets' && 'Gunakan avatar karakter unik Spotinize'}
                  {avatarMode === 'url' && 'Masukkan link direct URL foto gambar'}
                </span>
              </div>
            </div>

            {/* Mode 1: File Upload */}
            {avatarMode === 'upload' && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(29, 185, 84, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                  }}>
                    <Camera size={22} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-text-bright)' }}>
                      Klik untuk Pilih Foto dari Perangkat
                    </span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', margin: '2px 0 0 0' }}>
                      Format JPG, PNG, WEBP (otomatis dipotong pas & dioptimalkan)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Presets */}
            {avatarMode === 'presets' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
                gap: '8px',
                backgroundColor: 'var(--color-bg)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                {AVATAR_PRESETS.map(preset => {
                  const isSelected = avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      style={{
                        padding: '4px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'rgba(29, 185, 84, 0.15)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.label} 
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
                      />
                      <span style={{ fontSize: '0.65rem', color: isSelected ? 'var(--color-primary)' : 'var(--color-text-dim)', fontWeight: 700 }}>
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Mode 3: Custom URL */}
            {avatarMode === 'url' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  className="input"
                  placeholder="https://images.unsplash.com/... atau link foto"
                  value={customAvatarInput}
                  onChange={(e) => {
                    setCustomAvatarInput(e.target.value);
                    setAvatarUrl(e.target.value);
                  }}
                  style={{ fontSize: '0.9rem' }}
                />
              </div>
            )}
          </div>

          {/* 2. Display Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-bright)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Nama Tampilan (Display Name)
            </label>
            <input
              type="text"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              maxLength={30}
              required
              style={{ fontSize: '0.95rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
              <span>Nama yang terlihat di game, leaderboard, dan profil publik</span>
              <span>{displayName.length}/30</span>
            </div>
          </div>

          {/* 3. Bio */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-bright)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Bio / Status
            </label>
            <textarea
              className="input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan selera musikmu, genre favorit, atau kutipan lirik kesukaan..."
              maxLength={160}
              rows={3}
              style={{ fontSize: '0.9rem', resize: 'vertical', lineHeight: 1.45 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
              <span>Maksimal 160 karakter</span>
              <span>{bio.length}/160</span>
            </div>
          </div>

          {/* 4. Spotify Profile Link */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-bright)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Akun Profil Spotify
            </label>
            <div style={{ position: 'relative' }}>
              <Globe size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
              <input
                type="text"
                className="input"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/user/... atau username Spotify kamu"
                style={{ paddingLeft: '38px', fontSize: '0.9rem' }}
              />
            </div>
            <span style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
              Link langsung profil Spotify kamu agar pemain lain bisa follow & dengar playlist kamu
            </span>
          </div>

          {/* 5. Lagu Favorit (Favorite Song) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-bright)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Music size={16} color="var(--color-primary)" /> Lagu Favorit
              </label>
              {favoriteSong && (
                <button
                  type="button"
                  onClick={() => setFavoriteSong(null)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', color: '#f87171', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={13} /> Hapus
                </button>
              )}
            </div>

            {/* Favorite Song Card Preview if Selected */}
            {favoriteSong ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid rgba(29, 185, 84, 0.3)',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={favoriteSong.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120'}
                    alt={favoriteSong.title}
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-bright)' }}>
                      {favoriteSong.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                      {favoriteSong.artist}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSongSearchOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsSongSearchOpen(true)}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.88rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Music size={24} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, color: 'var(--color-text-bright)' }}>+ Pilih Lagu Favorit Kamu</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Cari dari katalog jutaan lagu Spotify</span>
              </div>
            )}

            {/* Song Search Popover / Drawer */}
            {isSongSearchOpen && (
              <div style={{
                marginTop: '10px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    Cari Lagu di Spotify
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSongSearchOpen(false)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                  >
                    Tutup
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                  <input
                    type="text"
                    className="input"
                    value={songQuery}
                    onChange={(e) => setSongQuery(e.target.value)}
                    placeholder="Ketik judul lagu atau nama penyanyi..."
                    style={{ paddingLeft: '34px', fontSize: '0.88rem' }}
                    autoFocus
                  />
                  {isSearchingSong && (
                    <Loader2 size={16} className="spin" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                  )}
                </div>

                {/* Results list */}
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {searchResults.map(track => (
                    <div
                      key={track.spotifyId || track.id || track.title}
                      onClick={() => {
                        setFavoriteSong({
                          title: track.title,
                          artist: track.artist,
                          coverUrl: track.coverUrl || track.cover,
                          spotifyId: track.spotifyId || track.id,
                          previewUrl: track.previewUrl
                        });
                        setIsSongSearchOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-bg)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <img 
                          src={track.coverUrl || track.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80'} 
                          alt={track.title} 
                          style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} 
                        />
                        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{track.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{track.artist}</div>
                        </div>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: '0.65rem', flexShrink: 0 }}>Pilih</span>
                    </div>
                  ))}

                  {songQuery && searchResults.length === 0 && !isSearchingSong && (
                    <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                      Lagu "{songQuery}" tidak ditemukan
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !displayName.trim()}
              icon={saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
