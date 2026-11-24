import React, { useState, useEffect } from 'react';
import { EyeOff, Play, Square, Loader2, Search, Trophy, Flag, Bookmark, Disc3 } from 'lucide-react';
import ApiClient from '../services/api.js';
import feedAudioManager from '../services/feedAudioManager.js';
import { useTrackDetail } from '../hooks/useTrackDetail.jsx';
import VinylArt from './VinylArt.jsx';
import Button from './Button.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

const REVEAL_STEPS = [0.5, 1.0, 2.0, 4.0];

export function BlindDropCard({ post, currentUserId, onPostUpdated }) {
  const { tx } = useLanguage();
  const { openTrackDetail } = useTrackDetail();
  const blind = post.blindDrop || {};
  const isBlurred = Boolean(blind.isBlurred);

  const [revealIdx, setRevealIdx] = useState(0);
  const [guessQuery, setGuessQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [audioState, setAudioState] = useState(() => feedAudioManager.getState());

  useEffect(() => {
    const unsub = feedAudioManager.subscribe(setAudioState);
    return unsub;
  }, []);

  useEffect(() => {
    const q = guessQuery.trim();
    if (!isBlurred || !q) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await ApiClient.get(`/spotify/search/tracks?q=${encodeURIComponent(q)}&limit=5`);
        setSuggestions(res.tracks || []);
      } catch (e) {
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [guessQuery, isBlurred]);

  const currentReveal = REVEAL_STEPS[revealIdx] || 0.5;
  const audioKey = `blind:${post.id}`;
  const isPlaying = audioState.currentKey === audioKey;

  const handlePlayClue = () => {
    feedAudioManager.toggle({
      key: audioKey,
      previewUrl: isBlurred ? null : post.track?.previewUrl,
      trackId: post.track?.id,
      duration: isBlurred ? 10 : 10 // Clue endpoint slices exact duration when duration param is passed
    });
  };

  // Play exact progressive reveal duration while blurred
  const handlePlayReveal = () => {
    feedAudioManager.toggle({
      key: audioKey,
      previewUrl: null,
      trackId: post.track?.id,
      duration: currentReveal
    });
  };

  const handleSubmitGuess = async (trackOption) => {
    if (!currentUserId || submitting) return;
    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await ApiClient.post(`/feed/posts/${post.id}/blind-guess`, {
        guessedTrack: trackOption,
        revealLevel: currentReveal
      });
      setGuessQuery('');
      setSuggestions([]);
      if (res?.post && onPostUpdated) {
        onPostUpdated(res.post);
      }
      if (res?.isCorrect) {
        setFeedback({ type: 'success', text: tx(`Spot on at ${currentReveal}s!`, `Tepat sekali di ${currentReveal}s!`) });
      } else if (res?.attemptsRemaining > 0) {
        setFeedback({
          type: 'error',
          text: tx(`Wrong guess! ${res.attemptsRemaining} attempts left.`, `Kurang tepat! Sisa ${res.attemptsRemaining} kesempatan.`)
        });
        if (revealIdx < REVEAL_STEPS.length - 1) {
          setRevealIdx(prev => prev + 1);
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGiveUp = async () => {
    if (!currentUserId || submitting) return;
    try {
      setSubmitting(true);
      const res = await ApiClient.post(`/feed/posts/${post.id}/blind-giveup`);
      if (res?.post && onPostUpdated) {
        onPostUpdated(res.post);
      }
    } catch (e) {
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentUserId || !post.track || bookmarkBusy) return;
    try {
      setBookmarkBusy(true);
      const res = await ApiClient.post('/saved-tracks/toggle', {
        track: post.track,
        sourcePostId: post.id
      });
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          track: { ...post.track, isSaved: Boolean(res.isSaved) }
        });
      }
    } catch (e) {
    } finally {
      setBookmarkBusy(false);
    }
  };

  if (!isBlurred && post.track) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          className="feed-track-box clickable-track-card"
          style={{ borderColor: blind.viewerAttempt?.solved ? 'rgba(29, 185, 84, 0.45)' : 'var(--color-border)' }}
          onClick={() => openTrackDetail(post.track)}
        >
          <VinylArt src={post.track.coverUrl} alt={post.track.title} size={46} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.track.title}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.track.artist}
            </div>
          </div>

          {(post.track.previewUrl || post.track.id) && (
            <button
              type="button"
              className={`trend-play-btn ${isPlaying ? 'active' : ''}`}
              style={{ width: '34px', height: '34px' }}
              onClick={(e) => {
                e.stopPropagation();
                handlePlayClue();
              }}
            >
              {isPlaying && audioState.isLoading ? (
                <Loader2 size={13} className="spin" />
              ) : isPlaying && audioState.isPlaying ? (
                <Square size={11} fill="currentColor" />
              ) : (
                <Play size={13} fill="currentColor" />
              )}
            </button>
          )}

          {currentUserId && (
            <button
              type="button"
              className={`bookmark-icon-btn ${post.track.isSaved ? 'saved' : ''}`}
              disabled={bookmarkBusy}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBookmark();
              }}
              title={tx('Save song', 'Simpan lagu')}
            >
              <Bookmark size={15} fill={post.track.isSaved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--color-text-dim)', padding: '0 2px' }}>
          <span>
            <Trophy size={11} color="var(--color-primary)" style={{ verticalAlign: '-1px', marginRight: '4px' }} />
            {tx(`${blind.solvedCount || 0} guessed correctly`, `${blind.solvedCount || 0} berhasil menebak`)}
          </span>
          {blind.fastestUser && (
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              {tx('Fastest:', 'Tercepat:')} @{blind.fastestUser.username} ({blind.fastestReveal}s)
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="blind-drop-box">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="blind-vinyl-mystery">
            <Disc3 size={22} color="var(--color-primary)" className={isPlaying ? 'lp-spin-slow' : ''} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <EyeOff size={14} color="#3d91f4" />
              <span>Blind Song Drop</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>
              {tx(`${blind.solvedCount || 0} players solved`, `${blind.solvedCount || 0} pemain berhasil nebak`)}
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handlePlayReveal}
          icon={isPlaying ? <Square size={12} fill="#000" /> : <Play size={13} fill="#000" />}
        >
          {isPlaying ? tx('Stop', 'Stop') : `Play ${currentReveal}s`}
        </Button>
      </div>

      {/* Reveal Duration Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {REVEAL_STEPS.map((sec, idx) => (
          <button
            key={sec}
            type="button"
            className={`count-pill-btn ${revealIdx === idx ? 'active' : ''}`}
            onClick={() => setRevealIdx(idx)}
          >
            {sec}s
          </button>
        ))}

        {currentUserId && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleGiveUp}
            disabled={submitting}
            style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--color-text-dim)', padding: '4px 8px' }}
          >
            <Flag size={12} /> {tx('Give Up', 'Nyerah')}
          </button>
        )}
      </div>

      {feedback && (
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: feedback.type === 'success' ? 'var(--color-primary)' : '#ff707e'
        }}>
          {feedback.text}
        </div>
      )}

      {/* Inline Song Guess Input */}
      {currentUserId && (
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
          <input
            type="text"
            className="input"
            placeholder={tx('Type song title to guess...', 'Ketik judul lagu untuk menebak...')}
            value={guessQuery}
            onChange={(e) => setGuessQuery(e.target.value)}
            style={{ padding: '8px 34px', fontSize: '0.84rem', borderRadius: 'var(--radius-full)' }}
          />
          {searching && (
            <Loader2 size={14} className="spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
          )}

          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 45,
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {suggestions.map((track, idx) => (
                <button
                  key={track.spotifyId || track.id || idx}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitGuess(track)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '7px 9px',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-bright)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <VinylArt src={track.albumArt || track.coverUrl} alt={track.title} size={30} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BlindDropCard;
