import React, { useState, useEffect, useRef } from 'react';
import {
  User, Users, Globe2, Radio, Library, Mic2, Play, Plus, LogIn,
  Loader2, Search, Check, X, History, Disc3, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import Button from './Button.jsx';
import ApiClient from '../services/api.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

const POPULAR_ARTISTS = [
  'The Weeknd', 'Taylor Swift', 'Bruno Mars', 'Bernadya',
  'Hindia', 'Mahalini', 'Billie Eilish', 'Coldplay', 'Tulus', 'Dua Lipa', 'Juicy Luicy', 'Nadin Amizah'
];

const SONG_COUNTS = [5, 10, 15];

export function QuickPlayBar({ user, onGameCreated, onJoinRoom }) {
  const { t, tx } = useLanguage();

  const localizedCategories = [
    { id: 'Global Trends', name: 'Global Trends', desc: tx('Most popular songs on global charts', 'Lagu-lagu terpopuler di chart dunia'), icon: <Globe2 size={18} /> },
    { id: 'Indonesia Trends', name: 'Indonesia Trends', desc: tx('Top local hits trending in Indonesia', 'Hits lokal paling rame di Indonesia'), icon: <Radio size={18} /> },
    { id: 'Genre', name: 'Genre Hits', desc: tx('Pop, Hip-Hop, Rock, K-Pop, Indie & more', 'Hip-Hop, Rock, K-Pop, & Indie Indonesia'), icon: <Disc3 size={18} /> },
    { id: 'Era & Tahun', name: tx('Era & Year', 'Era & Tahun'), desc: tx('Hits from 2026 down to 1970 classics', 'Hits 2025, 2024, 2023, 2010s, hingga 1970'), icon: <Calendar size={18} /> },
    { id: 'Nostalgia < 2000', name: 'Nostalgia < 2000', desc: tx('Classic 70s, 80s, and 90s hits', 'Hits legendaris era 70s, 80s, 90s Indo & Barat'), icon: <History size={18} /> },
    { id: 'Artist', name: 'Artist Mode', desc: tx('Guess songs from your favorite artist', 'Tebak lagu dari artis favorit pilihan lo'), icon: <Mic2 size={18} /> }
  ];

  const GENRE_OPTIONS = [
    { id: 'POP', label: 'Pop', desc: tx('Global & Indonesian Pop Hits', 'Pop Hits Global & Indonesia') },
    { id: 'HIPHOP', label: 'Hip-Hop / Rap', desc: tx('Global Rap & Trap Charts', 'Chart Rap & Trap dunia') },
    { id: 'RNB', label: 'R&B / Soul', desc: tx('Modern & Classic R&B', 'R&B modern & klasik') },
    { id: 'ROCK', label: 'Rock', desc: tx('Rock & Pop Punk Hits', 'Hits Rock & Pop Punk') },
    { id: 'ALTERNATIVE', label: 'Alternative / Indie', desc: tx('Global Indie & Alternative', 'Indie & Alternative Global') },
    { id: 'DANCE', label: 'EDM / Dance', desc: tx('Electronic & Dance Hits', 'Electronic & Dance Hits') },
    { id: 'KPOP', label: 'K-Pop', desc: tx('Korean Charts & Idol Hits', 'Chart Korea & Idol Hits') },
    { id: 'JPOP', label: 'J-Pop / Anime', desc: tx('Japanese Charts & Anime', 'Chart Jepang & Anime') },
    { id: 'JAZZ', label: 'Jazz', desc: tx('Classic & Contemporary Jazz', 'Jazz klasik & kontemporer') },
    { id: 'INDIE_ID', label: 'Indie Indonesia', desc: 'Hindia, Bernadya, Nadin, Tulus' }
  ];

  const currentYear = new Date().getFullYear();
  const YEAR_OPTIONS = Array.from({ length: currentYear - 1970 + 1 }, (_, i) => {
    const yr = String(currentYear - i);
    return {
      id: yr,
      label: tx(`Year ${yr}`, `Tahun ${yr}`),
      desc: tx(`Top hits of ${yr}`, `Hits populer tahun ${yr}`)
    };
  });

  const [mode, setMode] = useState('SOLO'); // 'SOLO' | 'MULTIPLAYER'
  const [multiplayerAction, setMultiplayerAction] = useState('CREATE'); // 'CREATE' | 'JOIN'
  const [category, setCategory] = useState(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [isEraDropdownOpen, setIsEraDropdownOpen] = useState(false);
  const [nostalgiaRegion, setNostalgiaRegion] = useState(null); // null | 'ALL' | 'INDO' | 'GLOBAL'
  const [genreChoice, setGenreChoice] = useState(null);
  const [eraChoice, setEraChoice] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistInput, setArtistInput] = useState('');
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [numberOfSongs, setNumberOfSongs] = useState(5);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const dropdownRef = useRef(null);

  const selectedCategoryObj = localizedCategories.find(c => c.id === category) || null;
  const selectedGenreObj = GENRE_OPTIONS.find(g => g.id === genreChoice) || null;
  const selectedYearObj = YEAR_OPTIONS.find(y => y.id === eraChoice) || null;

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
    setIsGenreDropdownOpen(false);
    setIsEraDropdownOpen(false);
    if (catId === 'Genre') {
      setGenreChoice(null);
      setIsGenreDropdownOpen(true);
    }
    if (catId === 'Era & Tahun') {
      setEraChoice(null);
      setIsEraDropdownOpen(true);
    }
    if (catId === 'Nostalgia < 2000') setNostalgiaRegion(null);
    if (catId === 'Artist') setSelectedArtist(null);
  };

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
      } finally {
        setLoadingArtists(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [artistInput, category]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSubQuery = () => {
    if (category === 'Artist') return selectedArtist?.name || '';
    if (category === 'Nostalgia < 2000') return nostalgiaRegion;
    if (category === 'Genre') return genreChoice;
    if (category === 'Era & Tahun') return eraChoice;
    return null;
  };

  const handleStartSolo = async () => {
    if (!isCategoryReady) return;
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
    if (!isCategoryReady) return;
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
    <section className="quick-play-card">
      {/* Header Row: Play + Disc Icon */}
      <div className="quick-play-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div className="quick-play-badge-icon">
            <Disc3 size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--color-text-bright)' }}>
              Play
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
              {tx('Test how fast you recognize songs', 'Uji seberapa cepat telingamu menebak lagu')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Mode Segmented Toggle */}
          <div className="segmented-pill">
            <button
              type="button"
              className={`segmented-pill-btn ${mode === 'SOLO' ? 'active' : ''}`}
              onClick={() => setMode('SOLO')}
            >
              <User size={13} />
              <span>Solo</span>
            </button>
            <button
              type="button"
              className={`segmented-pill-btn ${mode === 'MULTIPLAYER' ? 'active' : ''}`}
              onClick={() => setMode('MULTIPLAYER')}
            >
              <Users size={13} />
              <span>Multi</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCollapsed(prev => !prev)}
            style={{ padding: '6px', color: 'var(--color-text-dim)' }}
            title={collapsed ? tx('Expand', 'Buka') : tx('Minimize', 'Ringkas')}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(233, 20, 41, 0.14)',
          border: '1px solid var(--color-danger)',
          color: '#ff707e',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem'
        }}>
          {error}
        </div>
      )}

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Multiplayer Sub-Switch */}
          {mode === 'MULTIPLAYER' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${multiplayerAction === 'CREATE' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{
                  flex: 1,
                  borderColor: multiplayerAction === 'CREATE' ? 'var(--color-primary)' : 'var(--color-border)'
                }}
                onClick={() => setMultiplayerAction('CREATE')}
              >
                <Plus size={14} /> {t('dashCreateRoom')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${multiplayerAction === 'JOIN' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{
                  flex: 1,
                  borderColor: multiplayerAction === 'JOIN' ? 'var(--color-primary)' : 'var(--color-border)'
                }}
                onClick={() => setMultiplayerAction('JOIN')}
              >
                <LogIn size={14} /> {t('dashJoinRoom')}
              </button>
            </div>
          )}

          {/* Join Room Form */}
          {mode === 'MULTIPLAYER' && multiplayerAction === 'JOIN' ? (
            <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder={t('dashCodePlaceholder')}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                style={{
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase'
                }}
              />
              <Button type="submit" variant="primary" disabled={!joinCode.trim() || loading} icon={<LogIn size={16} />}>
                {loading ? '...' : 'Join'}
              </Button>
            </form>
          ) : (
            <>
              {/* 1. Category Accordion Dropdown */}
              <div style={{
                backgroundColor: 'var(--color-bg-alt)',
                border: `1px solid ${isCategoryDropdownOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
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
                    padding: '12px 14px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-bright)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: selectedCategoryObj ? 'var(--color-primary-subtle)' : 'var(--color-surface-hover)',
                      color: selectedCategoryObj ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {selectedCategoryObj ? selectedCategoryObj.icon : <Library size={18} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: selectedCategoryObj ? 'var(--color-text-bright)' : 'var(--color-text-muted)' }}>
                        {selectedCategoryObj ? selectedCategoryObj.name : t('dashPickCategory')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedCategoryObj ? selectedCategoryObj.desc : t('dashPickCategoryDesc')}
                      </div>
                    </div>
                  </div>

                  <ChevronDown
                    size={18}
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
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '176px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--color-surface)'
                  }}>
                    {localizedCategories.map(cat => {
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategory(cat.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            padding: '9px 11px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '1px solid rgba(29, 185, 84, 0.4)' : '1px solid transparent',
                            backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                            color: 'var(--color-text-bright)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }}>
                              {cat.icon}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{cat.name}</div>
                              <div style={{ fontSize: '0.73rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cat.desc}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2a. Genre Sub-Dropdown */}
              {category === 'Genre' && (
                <div style={{
                  backgroundColor: 'var(--color-bg-alt)',
                  border: `1px solid ${isGenreDropdownOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
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
                      padding: '11px 14px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-bright)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: selectedGenreObj ? 'var(--color-primary-subtle)' : 'var(--color-surface-hover)',
                        color: selectedGenreObj ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Disc3 size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: selectedGenreObj ? 'var(--color-text-bright)' : 'var(--color-text-muted)' }}>
                          {selectedGenreObj ? selectedGenreObj.label : tx('Choose Music Genre', 'Pilih Genre Musik')}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedGenreObj ? selectedGenreObj.desc : tx('Click to browse all genres...', 'Klik untuk melihat seluruh daftar genre...')}
                        </div>
                      </div>
                    </div>

                    <ChevronDown
                      size={17}
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
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      maxHeight: '176px',
                      overflowY: 'auto',
                      backgroundColor: 'var(--color-surface)'
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
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: isSelected ? '1px solid rgba(29, 185, 84, 0.4)' : '1px solid transparent',
                              backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                              color: 'var(--color-text-bright)',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{sub.label}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>{sub.desc}</div>
                            </div>
                            {isSelected && <Check size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2b. Era & Tahun Sub-Dropdown */}
              {category === 'Era & Tahun' && (
                <div style={{
                  backgroundColor: 'var(--color-bg-alt)',
                  border: `1px solid ${isEraDropdownOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
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
                      padding: '11px 14px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-bright)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: selectedYearObj ? 'var(--color-primary-subtle)' : 'var(--color-surface-hover)',
                        color: selectedYearObj ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Calendar size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: selectedYearObj ? 'var(--color-text-bright)' : 'var(--color-text-muted)' }}>
                          {selectedYearObj ? selectedYearObj.label : tx('Choose Release Year', 'Pilih Tahun Rilis')}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedYearObj ? selectedYearObj.desc : tx(`Choose a year from ${currentYear} back to 1970...`, `Pilih tahun dari ${currentYear} hingga 1970...`)}
                        </div>
                      </div>
                    </div>

                    <ChevronDown
                      size={17}
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
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      maxHeight: '176px',
                      overflowY: 'auto',
                      backgroundColor: 'var(--color-surface)'
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
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: isSelected ? '1px solid rgba(29, 185, 84, 0.4)' : '1px solid transparent',
                              backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                              color: 'var(--color-text-bright)',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{sub.label}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>{sub.desc}</div>
                            </div>
                            {isSelected && <Check size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2c. Nostalgia Region Sub-Selector */}
              {category === 'Nostalgia < 2000' && (
                <div style={{
                  backgroundColor: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <History size={14} /> {tx('Nostalgia Era Region', 'Sub-Pilihan Era Nostalgia')}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                    {[
                      { id: 'ALL', label: tx('All', 'Semua'), flag: '✨' },
                      { id: 'INDO', label: 'Indonesia', flag: '🇮🇩' },
                      { id: 'GLOBAL', label: 'Global', flag: '🌍' }
                    ].map(sub => {
                      const isSelected = nostalgiaRegion === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setNostalgiaRegion(sub.id)}
                          className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ borderRadius: 'var(--radius-sm)', padding: '8px 6px' }}
                        >
                          <span>{sub.flag}</span>
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2d. Artist Sub-Selector */}
              {category === 'Artist' && (
                <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedArtist ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-primary-subtle)',
                      border: '1px solid rgba(29, 185, 84, 0.4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mic2 size={15} color="var(--color-primary)" />
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-text-bright)' }}>
                          {selectedArtist.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px' }}
                        onClick={() => setSelectedArtist(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                        <input
                          type="text"
                          className="input"
                          placeholder={tx('Search artist (e.g. Hindia, Taylor Swift)...', 'Cari artis (misal: Hindia, Taylor Swift)...')}
                          value={artistInput}
                          onChange={(e) => setArtistInput(e.target.value)}
                          onFocus={() => artistSuggestions.length > 0 && setShowSuggestions(true)}
                          style={{ padding: '9px 36px 9px 34px', fontSize: '0.86rem' }}
                        />
                        {loadingArtists && (
                          <Loader2 size={15} className="spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                        )}
                      </div>

                      {showSuggestions && artistSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '42px',
                          left: 0,
                          right: 0,
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-lg)',
                          zIndex: 40,
                          maxHeight: '220px',
                          overflowY: 'auto',
                          padding: '4px'
                        }}>
                          {artistSuggestions.map((a, idx) => (
                            <button
                              key={a.id || `${a.name}-${idx}`}
                              type="button"
                              onClick={() => {
                                setSelectedArtist({ id: a.id, name: a.name, image: a.image });
                                setArtistInput('');
                                setShowSuggestions(false);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 10px',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-bright)',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              {a.image ? (
                                <img src={a.image} alt={a.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Mic2 size={13} />
                                </div>
                              )}
                              <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{a.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {POPULAR_ARTISTS.slice(0, 6).map(name => (
                          <button
                            key={name}
                            type="button"
                            className="mini-chip-btn"
                            onClick={() => setSelectedArtist({ id: null, name })}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 3. Song Count Selector & Compact Play CTA Button side-by-side */}
              {isCategoryReady && (
                <div className="quick-play-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {tx('Songs:', 'Lagu:')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {SONG_COUNTS.map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          className={`count-pill-btn ${numberOfSongs === cnt ? 'active' : ''}`}
                          onClick={() => setNumberOfSongs(cnt)}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={loading}
                    onClick={mode === 'SOLO' ? handleStartSolo : handleCreateRoom}
                    icon={loading ? <Loader2 size={15} className="spin" /> : <Play size={15} fill="#000" />}
                    style={{ padding: '9px 18px', fontWeight: 800 }}
                  >
                    {loading
                      ? (mode === 'SOLO' ? t('dashPreparing') : t('dashCreatingRoom'))
                      : (mode === 'SOLO' ? t('dashPlaySolo') : t('dashCreateRoomBtn'))}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {collapsed && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '4px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {mode === 'SOLO' ? 'Solo' : 'Multiplayer'} · {selectedCategoryObj ? selectedCategoryObj.name : t('dashPickCategory')} · {numberOfSongs} {tx('songs', 'lagu')}
          </span>
          <Button
            variant="primary"
            size="sm"
            disabled={!isCategoryReady || loading}
            onClick={mode === 'SOLO' ? handleStartSolo : handleCreateRoom}
            icon={<Play size={13} fill="#000" />}
          >
            Play
          </Button>
        </div>
      )}
    </section>
  );
}

export default QuickPlayBar;
