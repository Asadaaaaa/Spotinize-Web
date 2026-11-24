import React, { useState, useEffect } from 'react';
import { Flame, Play, Square, Loader2, Bookmark } from 'lucide-react';
import ApiClient from '../services/api.js';
import feedAudioManager from '../services/feedAudioManager.js';
import { useTrackDetail } from '../hooks/useTrackDetail.jsx';
import VinylArt from './VinylArt.jsx';
import { TrendsSkeleton } from './Skeletons.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function GlobalTrendsCard({ compact = false }) {
  const { tx } = useLanguage();
  const { openTrackDetail } = useTrackDetail();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedKeys, setSavedKeys] = useState({});
  const [audioState, setAudioState] = useState(() => feedAudioManager.getState());

  useEffect(() => {
    const unsub = feedAudioManager.subscribe(setAudioState);
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    ApiClient.get('/search/trending')
      .then(res => {
        if (!cancelled) {
          setTracks((res.globalTrends || []).slice(0, 5));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handlePlay = (track) => {
    const key = `trend:${track.spotifyId || track.title}`;
    feedAudioManager.toggle({
      key,
      previewUrl: track.previewUrl,
      trackId: track.id
    });
  };

  const handleToggleSave = async (track) => {
    const k = track.spotifyId || `${track.title}::${track.artist}`;
    try {
      const res = await ApiClient.post('/saved-tracks/toggle', { track });
      setSavedKeys(prev => ({ ...prev, [k]: Boolean(res.isSaved) }));
    } catch (e) {}
  };

  if (compact) {
    if (loading) return <TrendsSkeleton compact />;
    if (tracks.length === 0) return null;
    return (
      <div className="mobile-trends-strip">
        <div className="right-widget-header" style={{ marginBottom: '8px' }}>
          <Flame size={15} color="var(--color-primary)" />
          <span>{tx('Global Trends Top 5', 'Global Trends Top 5')}</span>
        </div>
        <div className="mobile-trends-scroll">
          {tracks.map((track) => {
            const key = `trend:${track.spotifyId || track.title}`;
            const isActive = audioState.currentKey === key;
            const hasAudio = Boolean(track.previewUrl || track.id);
            return (
              <div
                key={key}
                className="mobile-trend-chip clickable-track-card"
                onClick={() => openTrackDetail(track)}
              >
                <span className="trend-rank-badge">#{track.rank}</span>
                <VinylArt src={track.albumArt} alt={track.title} size={34} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="trend-track-title">{track.title}</div>
                  <div className="trend-track-artist">{track.artist}</div>
                </div>
                {hasAudio && (
                  <button
                    type="button"
                    className={`trend-play-btn ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(track);
                    }}
                    title={isActive ? 'Stop' : 'Preview'}
                  >
                    {isActive && audioState.isLoading ? (
                      <Loader2 size={12} className="spin" />
                    ) : isActive && audioState.isPlaying ? (
                      <Square size={10} fill="currentColor" />
                    ) : (
                      <Play size={12} fill="currentColor" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="right-widget-card">
      <div className="right-widget-header">
        <Flame size={16} color="var(--color-primary)" />
        <span>Global Trends</span>
        <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.62rem', padding: '2px 7px' }}>
          TOP 5
        </span>
      </div>

      {loading ? (
        <TrendsSkeleton />
      ) : tracks.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', padding: '12px 0' }}>
          {tx('Trends unavailable right now.', 'Chart belum tersedia saat ini.')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tracks.map((track) => {
            const key = `trend:${track.spotifyId || track.title}`;
            const saveKey = track.spotifyId || `${track.title}::${track.artist}`;
            const isActive = audioState.currentKey === key;
            const hasAudio = Boolean(track.previewUrl || track.id);
            return (
              <div
                key={key}
                className="trend-row clickable-track-card"
                onClick={() => openTrackDetail(track)}
              >
                <span className="trend-rank-num">{track.rank}</span>
                <VinylArt src={track.albumArt} alt={track.title} size={36} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="trend-track-title">{track.title}</div>
                  <div className="trend-track-artist">{track.artist}</div>
                </div>
                {hasAudio && (
                  <button
                    type="button"
                    className={`trend-play-btn ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(track);
                    }}
                    title={isActive ? tx('Stop', 'Berhenti') : tx('Play preview', 'Putar preview')}
                  >
                    {isActive && audioState.isLoading ? (
                      <Loader2 size={12} className="spin" />
                    ) : isActive && audioState.isPlaying ? (
                      <Square size={10} fill="currentColor" />
                    ) : (
                      <Play size={12} fill="currentColor" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  className={`bookmark-icon-btn ${savedKeys[saveKey] ? 'saved' : ''}`}
                  style={{ width: '26px', height: '26px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSave(track);
                  }}
                  title={tx('Save song', 'Simpan lagu')}
                >
                  <Bookmark size={13} fill={savedKeys[saveKey] ? 'currentColor' : 'none'} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GlobalTrendsCard;
