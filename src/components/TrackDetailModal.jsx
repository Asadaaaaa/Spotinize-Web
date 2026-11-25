import React, { useState, useEffect } from 'react';
import { X, Play, Square, Loader2, Disc3, Calendar, User, Music2, FileText, ExternalLink } from 'lucide-react';
import ApiClient from '../services/api.js';
import feedAudioManager from '../services/feedAudioManager.js';
import { getSpotifyTrackUrl, SpotifyIcon } from '../utils/spotifyLink.jsx';
import { VinylDiscStage } from './VinylArt.jsx';
import { TrackDetailSkeleton } from './Skeletons.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function TrackDetailModal({ track, onClose }) {
  const { user } = useAuth();
  const { lang, tx } = useLanguage();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioState, setAudioState] = useState(() => feedAudioManager.getState());

  useEffect(() => {
    const unsub = feedAudioManager.subscribe(setAudioState);
    return unsub;
  }, []);

  useEffect(() => {
    if (!track) return;
    let cancelled = false;
    setLoading(true);
    setDetail(null);

    const params = new URLSearchParams();
    if (track.id) params.set('id', track.id);
    if (track.spotifyId) params.set('spotifyId', track.spotifyId);
    if (track.title) params.set('title', track.title);
    if (track.artist) params.set('artist', track.artist);
    if (track.coverUrl || track.albumArt) params.set('coverUrl', track.coverUrl || track.albumArt);
    if (track.previewUrl) params.set('previewUrl', track.previewUrl);

    ApiClient.get(`/spotify/track-detail?${params.toString()}`)
      .then((res) => {
        if (!cancelled && res?.track) {
          setDetail(res.track);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [track]);

  const displayTitle = detail?.title || track?.title;
  const displayArtist = detail?.artist || track?.artist;
  const displayCover = detail?.coverUrl || track?.coverUrl || track?.albumArt;
  const displayPreview = detail?.previewUrl || track?.previewUrl;
  const displayId = detail?.id || track?.id;
  const audioKey = track ? `detail:${displayId || track.spotifyId || displayTitle}` : null;

  useEffect(() => {
    return () => {
      if (audioKey && feedAudioManager.getState().currentKey === audioKey) {
        feedAudioManager.stop();
      }
    };
  }, [audioKey]);

  if (!track) return null;

  const spotifyUrl = detail?.spotifyUrl || getSpotifyTrackUrl(track);
  const description = lang === 'en' ? (detail?.descriptionEn || detail?.description) : (detail?.description || detail?.descriptionEn);
  const isPlaying = Boolean(audioKey && audioState.currentKey === audioKey);

  const stopModalAudio = () => {
    if (audioKey && feedAudioManager.getState().currentKey === audioKey) {
      feedAudioManager.stop();
    }
  };

  const handleClose = () => {
    stopModalAudio();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-content track-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="track-detail-layout">
          {/* Left: Vinyl Disc + Visualization Bars + Icon-only Play & Spotify */}
          <div className="track-detail-left">
            <VinylDiscStage
              skin={user?.equippedVinyl}
              spinning={isPlaying && audioState.isPlaying}
              showArtwork={Boolean(displayCover)}
              coverSrc={displayCover}
              coverAlt={displayTitle}
            />

            {/* Visualization Bars */}
            <div className={`track-viz-bars ${isPlaying && audioState.isPlaying ? 'active' : ''}`} aria-hidden="true">
              {Array.from({ length: 11 }).map((_, idx) => (
                <span key={idx} className="track-viz-bar" />
              ))}
            </div>

            {/* Icon-only Action Buttons */}
            <div className="track-left-actions">
              {(displayPreview || displayId) && (
                <button
                  type="button"
                  className="track-icon-circle-btn"
                  title={isPlaying && audioState.isPlaying ? tx('Stop Preview', 'Berhenti') : tx('Play Preview', 'Putar Preview')}
                  aria-label={isPlaying && audioState.isPlaying ? tx('Stop Preview', 'Berhenti') : tx('Play Preview', 'Putar Preview')}
                  onClick={() => feedAudioManager.toggle({
                    key: audioKey,
                    previewUrl: displayPreview,
                    trackId: displayId
                  })}
                >
                  {isPlaying && audioState.isLoading ? (
                    <Loader2 size={15} className="spin" />
                  ) : isPlaying && audioState.isPlaying ? (
                    <Square size={13} fill="currentColor" />
                  ) : (
                    <Play size={15} fill="currentColor" style={{ marginLeft: '2px' }} />
                  )}
                </button>
              )}

              {spotifyUrl && (
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="track-icon-circle-btn spotify"
                  title="Play Full in Spotify"
                  aria-label="Play Full in Spotify"
                  onClick={stopModalAudio}
                >
                  <SpotifyIcon size={16} color="#000" />
                </a>
              )}
            </div>
          </div>

          {/* Right: Compact Header & Details */}
          <div className="track-detail-right">
            {/* Title, Artist & Close */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, margin: '0 0 1px 0', color: 'var(--color-text-bright)', lineHeight: 1.2 }}>
                  {displayTitle}
                </h3>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {displayArtist}
                </div>
              </div>

              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose} style={{ padding: '3px', flexShrink: 0 }}>
                <X size={15} />
              </button>
            </div>

            {/* Details Section */}
            {loading ? (
              <TrackDetailSkeleton />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '5px' }}>
                  <div className="track-meta-box" style={{ padding: '5px 8px' }}>
                    <div className="track-meta-label" style={{ fontSize: '0.58rem' }}><Disc3 size={9} /> Album</div>
                    <div className="track-meta-value" style={{ fontSize: '0.72rem' }}>{detail?.album || '-'}</div>
                  </div>
                  <div className="track-meta-box" style={{ padding: '5px 8px' }}>
                    <div className="track-meta-label" style={{ fontSize: '0.58rem' }}><Calendar size={9} /> {tx('Release', 'Rilis')}</div>
                    <div className="track-meta-value" style={{ fontSize: '0.72rem' }}>{detail?.releaseDate || '-'}</div>
                  </div>
                  <div className="track-meta-box" style={{ padding: '5px 8px' }}>
                    <div className="track-meta-label" style={{ fontSize: '0.58rem' }}><Music2 size={9} /> Genre</div>
                    <div className="track-meta-value" style={{ fontSize: '0.72rem' }}>{detail?.genre || '-'}</div>
                  </div>
                  <div className="track-meta-box" style={{ padding: '5px 8px' }}>
                    <div className="track-meta-label" style={{ fontSize: '0.58rem' }}><User size={9} /> {tx('Writers', 'Penulis')}</div>
                    <div className="track-meta-value" style={{ fontSize: '0.72rem' }}>{detail?.writers || displayArtist}</div>
                  </div>
                </div>

                {description && (
                  <div className="track-meta-box" style={{ padding: '6px 8px' }}>
                    <div className="track-meta-label" style={{ fontSize: '0.58rem', marginBottom: '2px' }}>
                      <FileText size={9} /> {tx('About This Song', 'Tentang Lagu Ini')}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text)', lineHeight: 1.35, margin: 0 }}>
                      {description}
                    </p>
                  </div>
                )}

                {detail?.youtubeVideoId && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div className="track-meta-label" style={{ fontSize: '0.58rem' }}>
                      {tx('YouTube Music Video', 'Video Clip YouTube')}
                    </div>
                    <div className="track-yt-embed-wrap">
                      <iframe
                        src={`https://www.youtube.com/embed/${detail.youtubeVideoId}`}
                        title={`${displayTitle} - ${displayArtist} Music Video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrackDetailModal;
