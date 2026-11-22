import React, { useState, useEffect, useRef } from 'react';
import { User, Users, Globe2, Radio, Library, Mic2, Play, Plus, LogIn, Sparkles, Loader2, Search, Check, X, History, Disc3, Calendar, ChevronDown } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import VinylArt from '../../components/VinylArt.jsx';
import ApiClient from '../../services/api.js';

const CATEGORIES = [
  { id: 'Global Trends', name: 'Global Trends', desc: 'Lagu-lagu terpopuler di chart dunia', icon: <Globe2 size={20} /> },
  { id: 'Indonesia Trends', name: 'Indonesia Trends', desc: 'Hits lokal paling rame di Indonesia', icon: <Radio size={20} /> },
  { id: 'Genre', name: 'Genre Hits', desc: 'Hip-Hop, Rock, K-Pop, & Indie Indonesia', icon: <Disc3 size={20} /> },
  { id: 'Era & Tahun', name: 'Era & Tahun', desc: 'Hits 2025, 2024, 2023, 2010s, hingga 2000s', icon: <Calendar size={20} /> },
  { id: 'Nostalgia < 2000', name: 'Nostalgia < 2000', desc: 'Hits legendaris era 70s, 80s, 90s Indo & Barat', icon: <History size={20} /> },
  { id: 'Artist', name: 'Artist Mode', desc: 'Tebak lagu dari artis favorit pilihan lo', icon: <Mic2 size={20} /> }
];

const POPULAR_ARTISTS = [
  'The Weeknd', 'Taylor Swift', 'Bruno Mars', 'Bernadya',
  'Hindia', 'Mahalini', 'Billie Eilish', 'Coldplay', 'Tulus', 'Dua Lipa', 'Juicy Luicy', 'Nadin Amizah'
];

const SONG_COUNTS = [5, 10, 15, 20];

export function DashboardPage({ user, onGameCreated, onJoinRoom }) {
  const [mode, setMode] = useState('SOLO'); // 'SOLO' or 'MULTIPLAYER'
  const [multiplayerAction, setMultiplayerAction] = useState(null); // null | 'CREATE' | 'JOIN'
  const [category, setCategory] = useState(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [isEraDropdownOpen, setIsEraDropdownOpen] = useState(false);
  const [nostalgiaRegion, setNostalgiaRegion] = useState(null); // null | 'ALL' | 'INDO' | 'GLOBAL'
  const [genreChoice, setGenreChoice] = useState(null);
  const [eraChoice, setEraChoice] = useState(null); // null | '2025' | '2024' | '2023' | '2010S' | '2000S'
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistInput, setArtistInput] = useState('');
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [numberOfSongs, setNumberOfSongs] = useState(5);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);
  const artistCacheRef = useRef({});
  const artistLookupSeqRef = useRef(0);

  const activeArtist = selectedArtist?.name || '';
  const selectedCategoryObj = CATEGORIES.find(c => c.id === category) || null;
  const isCategoryReady =
    category === 'Global Trends' ||
    category === 'Indonesia Trends' ||
    (category === 'Genre' && Boolean(genreChoice)) ||
    (category === 'Era & Tahun' && Boolean(eraChoice)) ||
    (category === 'Nostalgia < 2000' && Boolean(nostalgiaRegion)) ||
    (category === 'Artist' && Boolean(selectedArtist?.name));

  const handleSelectCategory = (catId) => {
    setCategory(catId);
    setIsCategoryDropdownOpen(false);
    if (catId === 'Genre') setGenreChoice(null);
    if (catId === 'Era & Tahun') setEraChoice(null);
    if (catId === 'Nostalgia < 2000') setNostalgiaRegion(null);
    if (catId === 'Artist') setSelectedArtist(null);
  };

  // Hydrate artist photo & metadata when Artist Mode is active or a chip/default artist lacks an image
  useEffect(() => {
    const artistName = selectedArtist?.name?.trim();
    if (category !== 'Artist' || !artistName) return;

    const key = artistName.toLowerCase();
    const cached = artistCacheRef.current[key];
    if (cached) {
      if (selectedArtist?.image !== cached.image || selectedArtist?.id !== cached.id) {
        setSelectedArtist(cached);
      }
      return;
    }

    let cancelled = false;
    const seq = ++artistLookupSeqRef.current;

    (async () => {
      try {
        const res = await ApiClient.get(`/spotify/search/artists?q=${encodeURIComponent(artistName)}&limit=5`);
        if (cancelled || artistLookupSeqRef.current !== seq) return;
        const list = res.artists || [];
        const best = list.find(a => a.name?.toLowerCase() === key) || list[0];
        const hydrated = {
          id: best?.id || null,
          name: artistName,
          image: best?.image || null,
          genres: best?.genres || []
        };
        artistCacheRef.current[key] = hydrated;
        setSelectedArtist(prev => (
          prev?.name?.toLowerCase() === key ? hydrated : prev
        ));
      } catch (err) {
        if (cancelled || artistLookupSeqRef.current !== seq) return;
        artistCacheRef.current[key] = {
          id: null,
          name: artistName,
          image: null,
          genres: []
        };
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category, selectedArtist?.name]);

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

  const handleSelectArtist = (artist) => {
    artistLookupSeqRef.current += 1;

    if (artist && typeof artist === 'object' && artist.name) {
      const cleanName = artist.name.trim();
      const key = cleanName.toLowerCase();
      const normalized = {
        id: artist.id || null,
        name: cleanName,
        image: artist.image || null,
        genres: artist.genres || []
      };
      artistCacheRef.current[key] = normalized;
      setSelectedArtist(normalized);
    } else if (typeof artist === 'string' && artist.trim()) {
      const cleanName = artist.trim();
      const key = cleanName.toLowerCase();
      const cached = artistCacheRef.current[key];
      setSelectedArtist(cached || {
        id: null,
        name: cleanName,
        image: null,
        genres: []
      });
    }

    setArtistInput('');
    setArtistSuggestions([]);
    setShowSuggestions(false);
  };

  const getSubQuery = () => {
    if (category === 'Artist') return activeArtist;
    if (category === 'Nostalgia < 2000') return nostalgiaRegion;
    if (category === 'Genre') return genreChoice;
    if (category === 'Era & Tahun') return eraChoice;
    return null;
  };

  const handleStartSolo = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.post('/game/solo/create', {
        userId: user.id,
        category,
        artistQuery: getSubQuery(),
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
        artistQuery: getSubQuery(),
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
              onClick={() => {
                setMode('SOLO');
                setMultiplayerAction(null);
              }}
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
              onClick={() => {
                setMode('MULTIPLAYER');
                setMultiplayerAction(null);
              }}
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

        {/* Multiplayer Action Choice: Buat Room vs Join Room */}
        {mode === 'MULTIPLAYER' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Pilih Aksi Multiplayer
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Card
                interactive
                selected={multiplayerAction === 'CREATE'}
                onClick={() => setMultiplayerAction('CREATE')}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: multiplayerAction === 'CREATE' ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                  color: multiplayerAction === 'CREATE' ? '#000' : 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Plus size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Buat Room</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)' }}>Jadi host & undang teman</div>
                </div>
              </Card>

              <Card
                interactive
                selected={multiplayerAction === 'JOIN'}
                onClick={() => setMultiplayerAction('JOIN')}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: multiplayerAction === 'JOIN' ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                  color: multiplayerAction === 'JOIN' ? '#000' : 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <LogIn size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Join Room</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)' }}>Gabung pakai kode room</div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Join Room Box (If Multiplayer + JOIN) */}
        {mode === 'MULTIPLAYER' && multiplayerAction === 'JOIN' && (
          <Card style={{ padding: '16px', backgroundColor: 'var(--color-surface-hover)' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-bright)', marginBottom: '8px' }}>
              Masukkan Kode Room:
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
              <Button type="submit" variant="primary" disabled={!joinCode.trim() || loading} icon={<LogIn size={18} />}>
                Join
              </Button>
            </form>
          </Card>
        )}

        {/* 2. Category Selector (Solo OR Multiplayer CREATE) */}
        {(mode === 'SOLO' || (mode === 'MULTIPLAYER' && multiplayerAction === 'CREATE')) && (
          <>

        {/* 2. Category Selector (Accordion Dropdown) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            2. Pilih Kategori Musik
          </label>

          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: `1px solid ${isCategoryDropdownOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            transition: 'border-color 0.2s ease'
          }}>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--color-text-bright)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: selectedCategoryObj ? 'var(--color-primary-subtle)' : 'var(--color-surface-hover)',
                  color: selectedCategoryObj ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {selectedCategoryObj ? selectedCategoryObj.icon : <Library size={20} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: selectedCategoryObj ? 'var(--color-text-bright)' : 'var(--color-text-muted)' }}>
                    {selectedCategoryObj ? selectedCategoryObj.name : 'Pilih Kategori Musik'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedCategoryObj ? selectedCategoryObj.desc : 'Klik untuk memilih kategori lagu...'}
                  </div>
                </div>
              </div>

              <ChevronDown
                size={20}
                color="var(--color-text-muted)"
                style={{
                  flexShrink: 0,
                  transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>

            {isCategoryDropdownOpen && (
              <div style={{
                borderTop: '1px solid var(--color-border)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                backgroundColor: 'var(--color-bg-alt)'
              }}>
                {CATEGORIES.map(cat => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={cat.disabled}
                      onClick={() => !cat.disabled && handleSelectCategory(cat.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '1px solid rgba(29, 185, 84, 0.4)' : '1px solid transparent',
                        backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                        color: 'var(--color-text-bright)',
                        cursor: cat.disabled ? 'not-allowed' : 'pointer',
                        opacity: cat.disabled ? 0.45 : 1,
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }}>
                          {cat.icon}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cat.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cat.desc}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2.0a Genre Sub-Category Selector (Dropdown) */}
        {category === 'Genre' && (() => {
          const GENRE_OPTIONS = [
            { id: 'POP', label: 'Pop', desc: 'Pop Hits Global & Indonesia' },
            { id: 'HIPHOP', label: 'Hip-Hop / Rap', desc: 'Chart Rap & Trap dunia' },
            { id: 'RNB', label: 'R&B / Soul', desc: 'R&B modern & klasik' },
            { id: 'ROCK', label: 'Rock', desc: 'Hits Rock & Pop Punk' },
            { id: 'ALTERNATIVE', label: 'Alternative / Indie', desc: 'Indie & Alternative Global' },
            { id: 'DANCE', label: 'EDM / Dance', desc: 'Electronic & Dance Hits' },
            { id: 'KPOP', label: 'K-Pop', desc: 'Chart Korea & Idol Hits' },
            { id: 'JPOP', label: 'J-Pop / Anime', desc: 'Chart Jepang & Anime' },
            { id: 'JAZZ', label: 'Jazz', desc: 'Jazz klasik & kontemporer' },
            { id: 'INDIE_ID', label: 'Indie Indonesia', desc: 'Hindia, Bernadya, Nadin, Tulus' }
          ];
          const selectedGenreObj = GENRE_OPTIONS.find(g => g.id === genreChoice) || null;

          return (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${isGenreDropdownOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              transition: 'border-color 0.2s ease'
            }}>
              <button
                type="button"
                onClick={() => setIsGenreDropdownOpen(prev => !prev)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-bright)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedGenreObj ? 'var(--color-primary-subtle)' : 'var(--color-surface-hover)',
                    color: selectedGenreObj ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Disc3 size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: selectedGenreObj ? 'var(--color-text-bright)' : 'var(--color-text-muted)' }}>
                      {selectedGenreObj ? selectedGenreObj.label : 'Pilih Genre Musik'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedGenreObj ? selectedGenreObj.desc : 'Klik untuk melihat seluruh daftar genre...'}
                    </div>
                  </div>
                </div>

                <ChevronDown
                  size={18}
                  color="var(--color-text-muted)"
                  style={{
                    flexShrink: 0,
                    transform: isGenreDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {isGenreDropdownOpen && (
                <div style={{
                  borderTop: '1px solid var(--color-border)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--color-bg-alt)'
                }}>
                  {GENRE_OPTIONS.map(sub => {
                    const isSelected = genreChoice === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setGenreChoice(sub.id);
                          setIsGenreDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '1px solid rgba(29, 185, 84, 0.4)' : '1px solid transparent',
                          backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                          color: 'var(--color-text-bright)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{sub.label}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>{sub.desc}</div>
                        </div>
                        {isSelected && <Check size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* 2.0b Era & Tahun Sub-Category Selector (Dropdown currentYear - 1970) */}
        {category === 'Era & Tahun' && (() => {
          const currentYear = new Date().getFullYear();
          const YEAR_OPTIONS = Array.from({ length: currentYear - 1970 + 1 }, (_, i) => {
            const yr = String(currentYear - i);
            return { id: yr, label: `Tahun ${yr}`, desc: `Hits populer tahun ${yr}` };
          });
          const selectedYearObj = YEAR_OPTIONS.find(y => y.id === eraChoice) || null;

          return (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${isEraDropdownOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              transition: 'border-color 0.2s ease'
            }}>
              <button
                type="button"
                onClick={() => setIsEraDropdownOpen(prev => !prev)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-bright)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedYearObj ? 'var(--color-primary-subtle)' : 'var(--color-surface-hover)',
                    color: selectedYearObj ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Calendar size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: selectedYearObj ? 'var(--color-text-bright)' : 'var(--color-text-muted)' }}>
                      {selectedYearObj ? selectedYearObj.label : 'Pilih Tahun Rilis'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedYearObj ? selectedYearObj.desc : `Pilih tahun dari ${currentYear} hingga 1970...`}
                    </div>
                  </div>
                </div>

                <ChevronDown
                  size={18}
                  color="var(--color-text-muted)"
                  style={{
                    flexShrink: 0,
                    transform: isEraDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {isEraDropdownOpen && (
                <div style={{
                  borderTop: '1px solid var(--color-border)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--color-bg-alt)'
                }}>
                  {YEAR_OPTIONS.map(sub => {
                    const isSelected = eraChoice === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setEraChoice(sub.id);
                          setIsEraDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '1px solid rgba(29, 185, 84, 0.4)' : '1px solid transparent',
                          backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                          color: 'var(--color-text-bright)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{sub.label}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>{sub.desc}</div>
                        </div>
                        {isSelected && <Check size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

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
                    className={`btn btn-sm ${activeArtist.toLowerCase() === art.toLowerCase() ? 'btn-primary' : 'btn-secondary'}`}
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
                      onClick={() => handleSelectArtist(art)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'background-color var(--transition-fast)',
                        backgroundColor: activeArtist.toLowerCase() === art.name.toLowerCase() ? 'var(--color-surface-active)' : 'transparent'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = activeArtist.toLowerCase() === art.name.toLowerCase() ? 'var(--color-surface-active)' : 'transparent'}
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
                      {activeArtist.toLowerCase() === art.name.toLowerCase() && (
                        <Check size={16} color="var(--color-primary)" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Artist Card below search bar */}
            {selectedArtist?.name && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(29, 185, 84, 0.08)',
                border: '1px solid rgba(29, 185, 84, 0.45)'
              }}>
                <VinylArt
                  src={selectedArtist.image}
                  alt={selectedArtist.name}
                  size={52}
                  borderRadius="50%"
                  style={{ border: '2px solid var(--color-primary)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    Artis Terpilih
                  </div>
                  <div style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--color-text-bright)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {selectedArtist.name}
                  </div>
                  <div style={{
                    fontSize: '0.76rem',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {selectedArtist.genres?.length > 0
                      ? selectedArtist.genres.join(' • ')
                      : `Siap tebak ${numberOfSongs} lagu dari ${selectedArtist.name}`}
                  </div>
                </div>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Check size={15} strokeWidth={3} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Number of Songs & Start Game (Visible only when category & sub-option are ready) */}
        {isCategoryReady && (
          <>
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
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
