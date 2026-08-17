import React, { useState, useEffect, useRef } from 'react';
import { User, Users, Globe2, Radio, Library, Mic2, Play, Plus, LogIn, Sparkles, Loader2, Search, Check, X, History } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import VinylArt from '../../components/VinylArt.jsx';
import ApiClient from '../../services/api.js';

const CATEGORIES = [
  { id: 'Global Trends', name: 'Global Trends', desc: 'Lagu-lagu terpopuler di chart dunia', icon: <Globe2 size={20} /> },
  { id: 'Indonesia Trends', name: 'Indonesia Trends', desc: 'Hits lokal paling rame di Indonesia', icon: <Radio size={20} /> },
  { id: 'Nostalgia < 2000', name: 'Nostalgia < 2000', desc: 'Hits legendaris era 70s, 80s, 90s Indo & Barat', icon: <History size={20} /> },
  { id: 'Artist', name: 'Artist Mode', desc: 'Tebak lagu dari artis favorit pilihan lo', icon: <Mic2 size={20} /> },
  { id: 'My Songs', name: 'My Songs', desc: 'Lagu dari playlist & favorit Spotify lo', icon: <Library size={20} />, disabled: true }
];

const POPULAR_ARTISTS = [
  'The Weeknd', 'Taylor Swift', 'Bruno Mars', 'Bernadya',
  'Hindia', 'Mahalini', 'Billie Eilish', 'Coldplay', 'Tulus', 'Dua Lipa', 'Juicy Luicy', 'Nadin Amizah'
];

const SONG_COUNTS = [5, 10, 15, 20];

export function DashboardPage({ user, onGameCreated, onJoinRoom }) {
  const [mode, setMode] = useState('SOLO'); // 'SOLO' or 'MULTIPLAYER'
  const [category, setCategory] = useState('Global Trends');
  const [nostalgiaRegion, setNostalgiaRegion] = useState('ALL'); // 'ALL' | 'INDO' | 'GLOBAL'
  const [selectedArtist, setSelectedArtist] = useState('The Weeknd');
  const [artistInput, setArtistInput] = useState('');
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [numberOfSongs, setNumberOfSongs] = useState(5);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);

  const activeArtist = selectedArtist || 'The Weeknd';

  // Real-time Artist Search Suggestion Debounce
  useEffect(() => {
    const trimmed = artistInput.trim();
    if (!trimmed || category !== 'Artist') {
      setArtistSuggestions([]);
      setLoadingArtists(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingArtists(true);
        const res = await ApiClient.get(`/spotify/search/artists?q=${encodeURIComponent(trimmed)}&limit=6`);
        setArtistSuggestions(res.artists || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Artist search error:', err);
      } finally {
        setLoadingArtists(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [artistInput, category]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectArtist = (artistName) => {
    setSelectedArtist(artistName);
    setArtistInput(artistName);
    setShowSuggestions(false);
  };

  const handleStartSolo = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.post('/game/solo/create', {
        userId: user.id,
        category,
        artistQuery: category === 'Artist' 
          ? activeArtist 
          : (category === 'Nostalgia < 2000' ? nostalgiaRegion : null),
        numberOfSongs
      });
      onGameCreated(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.post('/game/multiplayer/create', {
        userId: user.id,
        category,
        artistQuery: category === 'Artist' 
          ? activeArtist 
          : (category === 'Nostalgia < 2000' ? nostalgiaRegion : null),
        numberOfSongs
      });
      onJoinRoom(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.post('/game/multiplayer/join', {
        userId: user.id,
        roomCode: joinCode.trim().toUpperCase()
      });
      onJoinRoom(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow mobile-page-container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome Banner */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '6px' }}>
            Halo, {user?.displayName?.split(' ')[0]}!
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
            Pilih mode dan kategori buat uji seberapa peka telinga lo!
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 68, 68, 0.15)',
            border: '1px solid var(--color-error)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* 1. Game Mode Switcher */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            1. Pilih Mode Game
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Card
              interactive
              selected={mode === 'SOLO'}
              onClick={() => setMode('SOLO')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: mode === 'SOLO' ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                color: mode === 'SOLO' ? '#000' : 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Solo Mode</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Main sendiri, cetak skor tinggi</div>
              </div>
            </Card>

            <Card
              interactive
              selected={mode === 'MULTIPLAYER'}
              onClick={() => setMode('MULTIPLAYER')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: mode === 'MULTIPLAYER' ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                color: mode === 'MULTIPLAYER' ? '#000' : 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Multiplayer</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Mabar bareng teman via room</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Join Room Box (If Multiplayer) */}
        {mode === 'MULTIPLAYER' && (
          <Card style={{ padding: '16px', backgroundColor: 'var(--color-surface-hover)' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-bright)', marginBottom: '8px' }}>
              Punya Kode Room? Gabung Langsung:
            </span>
            <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder="Masukkan 6 digit kode (e.g. SPOT42)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em' }}
              />
              <Button type="submit" variant="secondary" disabled={!joinCode.trim() || loading} icon={<LogIn size={18} />}>
                Join
              </Button>
            </form>
          </Card>
        )}

        {/* 2. Category Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            2. Pilih Kategori Musik
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {CATEGORIES.map(cat => (
              <Card
                key={cat.id}
                interactive={!cat.disabled}
                selected={category === cat.id}
                onClick={() => !cat.disabled && setCategory(cat.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '16px',
                  opacity: cat.disabled ? 0.45 : 1,
                  cursor: cat.disabled ? 'not-allowed' : 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: category === cat.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                      {cat.icon}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{cat.name}</span>
                  </div>
                  {cat.disabled && (
                    <span className="badge badge-gray" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                      Nonaktif
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>{cat.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* 2.1 Nostalgia Sub-Category Selector (If Nostalgia < 2000 Selected) */}
        {category === 'Nostalgia < 2000' && (
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={16} /> Sub-Pilihan Era Nostalgia
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>
                {nostalgiaRegion === 'INDO' ? '36 Lagu Klasik Indonesia' : nostalgiaRegion === 'GLOBAL' ? '24 Lagu Klasik Barat' : '60 Lagu Campuran'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {[
                { id: 'ALL', label: 'Semua (Campuran)', desc: 'Indo & Barat', flag: '✨' },
                { id: 'INDO', label: 'Indonesia Saja', desc: 'Chrisye, Dewa 19, Slank, dll', flag: '🇮🇩' },
                { id: 'GLOBAL', label: 'Global / Barat', desc: 'Queen, MJ, Nirvana, dll', flag: '🌍' }
              ].map(sub => {
                const isSelected = nostalgiaRegion === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setNostalgiaRegion(sub.id)}
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '12px 10px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{sub.flag}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{sub.label}</span>
                    <span style={{ fontSize: '0.72rem', opacity: isSelected ? 0.9 : 0.65, fontWeight: 500 }}>
                      {sub.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2.2 Artist Selector (If Artist Mode Selected) */}
        {category === 'Artist' && (
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mic2 size={16} /> Pilih Artis Target
              </span>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--color-primary-subtle)',
                border: '1px solid var(--color-primary)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--color-primary)'
              }}>
                <Check size={14} /> {activeArtist}
              </div>
            </div>

            {/* Popular Artist Quick Chips */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginBottom: '8px', fontWeight: 600 }}>
                Artis Populer:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {POPULAR_ARTISTS.map(art => (
                  <button
                    key={art}
                    type="button"
                    onClick={() => handleSelectArtist(art)}
                    className={`btn btn-sm ${selectedArtist.toLowerCase() === art.toLowerCase() ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: 'var(--radius-full)', fontSize: '0.85rem', padding: '6px 14px' }}
                  >
                    {art}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Artist Input & Live Suggestions Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={18} 
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} 
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Ketik nama artis lain untuk mencari..."
                  value={artistInput}
                  onChange={e => {
                    setArtistInput(e.target.value);
                    if (e.target.value.trim()) setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (artistInput.trim() && artistSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  style={{ paddingLeft: '42px', paddingRight: '40px' }}
                />
                {loadingArtists && (
                  <Loader2 
                    size={18} 
                    className="spin" 
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} 
                  />
                )}
                {artistInput && !loadingArtists && (
                  <button
                    type="button"
                    onClick={() => {
                      setArtistInput('');
                      setArtistSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-dim)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && artistSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px'
                }}>
                  {artistSuggestions.map((art) => (
                    <div
                      key={art.id || art.name}
                      onClick={() => handleSelectArtist(art.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'background-color var(--transition-fast)',
                        backgroundColor: selectedArtist.toLowerCase() === art.name.toLowerCase() ? 'var(--color-surface-active)' : 'transparent'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedArtist.toLowerCase() === art.name.toLowerCase() ? 'var(--color-surface-active)' : 'transparent'}
                    >
                      <VinylArt
                        src={art.image}
                        alt={art.name}
                        size={36}
                        borderRadius="50%"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-bright)' }}>
                          {art.name}
                        </div>
                        {art.genres && art.genres.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {art.genres.join(' • ')}
                          </div>
                        )}
                      </div>
                      {selectedArtist.toLowerCase() === art.name.toLowerCase() && (
                        <Check size={16} color="var(--color-primary)" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Number of Songs Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            3. Jumlah Lagu (Rounds)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {SONG_COUNTS.map(count => (
              <button
                key={count}
                type="button"
                onClick={() => setNumberOfSongs(count)}
                className={`btn ${numberOfSongs === count ? 'btn-primary' : 'btn-secondary'}`}
                style={{ height: '48px', fontSize: '1.1rem', fontWeight: 800 }}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Action */}
        <div style={{ marginTop: '12px' }}>
          {mode === 'SOLO' ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              onClick={handleStartSolo}
              icon={loading ? <Loader2 className="spin" size={20} /> : <Play size={20} fill="#000" />}
              style={{ height: '54px', fontSize: '1.15rem' }}
            >
              {loading ? 'Menyiapkan Game...' : 'Ayo Main'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              onClick={handleCreateRoom}
              icon={loading ? <Loader2 className="spin" size={20} /> : <Plus size={20} />}
              style={{ height: '54px', fontSize: '1.15rem' }}
            >
              {loading ? 'Membuat Room...' : 'Buat Room Multiplayer'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
