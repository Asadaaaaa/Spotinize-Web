import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Loader2 } from 'lucide-react';
import ApiClient from '../services/api.js';
import VinylArt from './VinylArt.jsx';

export function SongSearchModal({ isOpen, onClose, onSelectSong, remainingAttempts = 3 }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const searchCacheRef = useRef(new Map());

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Instant 0ms cache hit from browser memory
    if (searchCacheRef.current.has(trimmed)) {
      setResults(searchCacheRef.current.get(trimmed));
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await ApiClient.get(`/spotify/search/tracks?q=${encodeURIComponent(trimmed)}&limit=5`);
        const list = (res.tracks || []).slice(0, 5);
        searchCacheRef.current.set(trimmed, list);
        setResults(list);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasTyped = query.trim().length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Cari Judul Lagu</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Tebak lagu dari katalog Spotify ({remainingAttempts} kesempatan tersisa)
            </p>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search 
            size={18} 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} 
          />
          <input
            ref={inputRef}
            type="text"
            className="input"
            style={{ paddingLeft: '42px', fontSize: '1rem' }}
            placeholder="Ketik judul lagu atau artis..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <Loader2 
              size={18} 
              className="spin" 
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} 
            />
          )}
        </div>

        {/* Content Area */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '340px',
          minHeight: '140px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {/* Initial State before typing (No suggestions) */}
          {!hasTyped && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: '32px 16px',
              color: 'var(--color-text-dim)',
              textAlign: 'center',
              gap: '12px'
            }}>
              <VinylArt size={50} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  Ketik judul lagu atau nama artis
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                  Mencari bebas di seluruh katalog lagu Spotify
                </p>
              </div>
            </div>
          )}

          {/* No results found */}
          {hasTyped && results.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)' }}>
              <VinylArt size={44} style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontWeight: 600 }}>Lagu "{query}" tidak ditemukan</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Coba periksa ejaan atau gunakan nama artis</p>
            </div>
          )}

          {/* Results List (Top 5 items) */}
          {results.map((track) => (
            <div
              key={track.spotifyId || track.id || track.title}
              onClick={() => {
                onSelectSong(track);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-hover)',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-active)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
            >
              <VinylArt
                src={track.albumArt}
                alt={track.title}
                size={42}
                borderRadius="6px"
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.artist}
                </div>
              </div>

              <div style={{ color: 'var(--color-primary)' }}>
                <Check size={18} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SongSearchModal;
