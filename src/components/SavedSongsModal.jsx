import React, { useState, useEffect } from 'react';
import { X, Bookmark, Play, Square, Loader2, Trash2, Send } from 'lucide-react';
import ApiClient from '../services/api.js';
import feedAudioManager from '../services/feedAudioManager.js';
import { useTrackDetail } from '../hooks/useTrackDetail.jsx';
import VinylArt from './VinylArt.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function SavedSongsModal({ isOpen, onClose, onPostTrack }) {
  const { tx } = useLanguage();
  const { openTrackDetail } = useTrackDetail();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioState, setAudioState] = useState(() => feedAudioManager.getState());

  useEffect(() => {
    const unsub = feedAudioManager.subscribe(setAudioState);
    return unsub;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    ApiClient.get('/saved-tracks')
      .then(res => setTracks(res.tracks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemove = async (track) => {
    try {
      await ApiClient.post('/saved-tracks/toggle', { track });
      setTracks(prev => prev.filter(t => t.id !== track.id));
    } catch (e) {}
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '22px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.18rem', fontWeight: 900, margin: 0 }}>
              {tx('Saved Songs', 'Lagu Tersimpan')}
            </h3>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <Loader2 size={24} className="spin" color="var(--color-primary)" />
            </div>
          ) : tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--color-text-dim)' }}>
              <Bookmark size={32} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
              <div style={{ fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                {tx('No saved songs yet', 'Belum ada lagu tersimpan')}
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                {tx('Tap the bookmark icon on any song in the Feed or Global Trends to save it here.', 'Klik ikon bookmark di lagu mana saja pada Feed atau Global Trends untuk menyimpannya di sini.')}
              </div>
            </div>
          ) : (
            tracks.map((track) => {
              const key = `saved:${track.id}`;
              const isPlaying = audioState.currentKey === key;
              return (
                <div
                  key={track.id}
                  className="feed-track-box clickable-track-card"
                  onClick={() => openTrackDetail({ ...track, id: track.trackId || track.id })}
                >
                  <VinylArt src={track.coverUrl} alt={track.title} size={42} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {track.artist}
                    </div>
                  </div>

                  {(track.previewUrl || track.trackId) && (
                    <button
                      type="button"
                      className={`trend-play-btn ${isPlaying ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        feedAudioManager.toggle({
                          key,
                          previewUrl: track.previewUrl,
                          trackId: track.trackId
                        });
                      }}
                      title="Preview"
                    >
                      {isPlaying && audioState.isPlaying ? <Square size={10} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    </button>
                  )}

                  {onPostTrack && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px', color: 'var(--color-primary)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onPostTrack(track);
                      }}
                      title={tx('Post to Feed', 'Posting ke Feed')}
                    >
                      <Send size={14} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '6px', color: 'var(--color-text-dim)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(track);
                    }}
                    title={tx('Remove', 'Hapus')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedSongsModal;
