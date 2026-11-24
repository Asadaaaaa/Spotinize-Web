import React, { useState, useEffect } from 'react';
import { X, Search, Music2, Play, Square, Loader2, Send, EyeOff } from 'lucide-react';
import Button from './Button.jsx';
import VinylArt from './VinylArt.jsx';
import ApiClient from '../services/api.js';
import feedAudioManager from '../services/feedAudioManager.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function PostComposerModal({ isOpen, onClose, onPostCreated, initialTrack = null }) {
  const { tx } = useLanguage();
  const [content, setContent] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(initialTrack);
  const [isBlindDrop, setIsBlindDrop] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [audioState, setAudioState] = useState(() => feedAudioManager.getState());

  useEffect(() => {
    const unsub = feedAudioManager.subscribe(setAudioState);
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedTrack(initialTrack || null);
      setIsBlindDrop(false);
      setContent('');
      setTrackQuery('');
      setTrackResults([]);
      setError(null);
    }
  }, [isOpen, initialTrack]);

  useEffect(() => {
    const q = trackQuery.trim();
    if (!isOpen || !q || selectedTrack) {
      setTrackResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await ApiClient.get(`/spotify/search/tracks?q=${encodeURIComponent(q)}&limit=6`);
        setTrackResults(res.tracks || []);
      } catch (e) {
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [trackQuery, isOpen, selectedTrack]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedTrack) {
      setError(tx('Write a note or attach a song first.', 'Tulis catatan atau pilih lagu terlebih dahulu.'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await ApiClient.post('/feed/posts', {
        type: selectedTrack && isBlindDrop ? 'blind_drop' : 'note',
        content: content.trim(),
        track: selectedTrack
      });
      if (res?.post && onPostCreated) {
        onPostCreated(res.post);
      }
      onClose();
    } catch (err) {
      setError(err.message || tx('Failed to publish post', 'Gagal mempublikasikan post'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayPreview = (track, keyPrefix = 'composer') => {
    const key = `${keyPrefix}:${track.spotifyId || track.id || track.title}`;
    feedAudioManager.toggle({
      key,
      previewUrl: track.previewUrl,
      trackId: track.id
    });
  };

  const remainingChars = 280 - content.length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', padding: '22px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.18rem', fontWeight: 900, margin: 0 }}>
            {tx('New Music Post', 'Buat Post Musik')}
          </h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            color: '#ff707e',
            fontSize: '0.84rem',
            marginBottom: '12px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <textarea
              className="input"
              rows={3}
              maxLength={280}
              placeholder={tx("What's on repeat today? Share a song or music thought...", 'Lagi sering muter lagu apa hari ini? Bagikan ke feed...')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ resize: 'vertical', minHeight: '84px', lineHeight: 1.5 }}
            />
            <div style={{
              textAlign: 'right',
              fontSize: '0.72rem',
              marginTop: '4px',
              color: remainingChars < 30 ? 'var(--color-warning)' : 'var(--color-text-dim)',
              fontFamily: 'var(--font-mono)'
            }}>
              {remainingChars}
            </div>
          </div>

          {/* Attached Song OR Song Search */}
          {selectedTrack ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="feed-track-box">
                <VinylArt src={selectedTrack.albumArt || selectedTrack.coverUrl} alt={selectedTrack.title} size={46} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedTrack.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedTrack.artist}
                  </div>
                </div>

                {(selectedTrack.previewUrl || selectedTrack.id) && (() => {
                  const key = `composer-sel:${selectedTrack.spotifyId || selectedTrack.id || selectedTrack.title}`;
                  const active = audioState.currentKey === key;
                  return (
                    <button
                      type="button"
                      className={`trend-play-btn ${active ? 'active' : ''}`}
                      onClick={() => handlePlayPreview(selectedTrack, 'composer-sel')}
                    >
                      {active && audioState.isPlaying ? <Square size={11} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    </button>
                  );
                })()}

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px' }}
                  onClick={() => {
                    setSelectedTrack(null);
                    setIsBlindDrop(false);
                  }}
                  title={tx('Remove song', 'Hapus lagu')}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Blind Song Drop Toggle */}
              <button
                type="button"
                onClick={() => setIsBlindDrop(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: isBlindDrop ? '1px solid rgba(61, 145, 244, 0.5)' : '1px solid var(--color-border)',
                  backgroundColor: isBlindDrop ? 'rgba(61, 145, 244, 0.12)' : 'var(--color-bg-alt)',
                  color: 'var(--color-text-bright)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
                  <EyeOff size={15} color={isBlindDrop ? '#3d91f4' : 'var(--color-text-dim)'} />
                  <span>{tx('Blind Song Drop Mode (Hide title & let friends guess!)', 'Mode Blind Song Drop (Sembunyikan judul biar teman tebak!)')}</span>
                </span>
                <span className={`badge ${isBlindDrop ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                  {isBlindDrop ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Music2 size={14} color="var(--color-primary)" /> {tx('Attach a Song (Optional)', 'Sematkan Lagu (Opsional)')}
              </label>

              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                <input
                  type="text"
                  className="input"
                  placeholder={tx('Search song title or artist...', 'Cari judul lagu atau artis...')}
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  style={{ paddingLeft: '36px', paddingRight: '36px', fontSize: '0.88rem' }}
                />
                {searching && (
                  <Loader2 size={15} className="spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                )}
              </div>

              {trackResults.length > 0 && (
                <div style={{
                  maxHeight: '190px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '6px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)'
                }}>
                  {trackResults.map((t, i) => (
                    <button
                      key={t.spotifyId || t.id || i}
                      type="button"
                      onClick={() => {
                        setSelectedTrack(t);
                        setTrackQuery('');
                        setTrackResults([]);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '7px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-bright)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      <VinylArt src={t.albumArt || t.coverUrl} alt={t.title} size={34} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.artist}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {tx('Cancel', 'Batal')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || (!content.trim() && !selectedTrack)}
              icon={submitting ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
              style={{ padding: '9px 18px', fontWeight: 800 }}
            >
              {submitting ? tx('Posting...', 'Mengirim...') : tx('Publish Post', 'Kirim Post')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostComposerModal;
