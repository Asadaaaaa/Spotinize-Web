import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, Play, Square, Bookmark, MessageCircle, Trash2, CheckCircle2,
  Loader2, Send, Trophy, Award, ExternalLink, Heart, Shield, SmilePlus
} from 'lucide-react';
import Avatar from './Avatar.jsx';
import VinylArt from './VinylArt.jsx';
import BlindDropCard from './BlindDropCard.jsx';
import AsyncChallengeCard from './AsyncChallengeCard.jsx';
import ApiClient from '../services/api.js';
import feedAudioManager from '../services/feedAudioManager.js';
import soundFx from '../services/soundFx.js';
import haptics from '../services/haptics.js';
import { useTrackDetail } from '../hooks/useTrackDetail.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

const REACTION_EMOJIS = ['❤️', '👍', '👏', '🔥', '👎'];

function formatRelativeTime(dateString, lang = 'en') {
  if (!dateString) return '';
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return lang === 'id' ? 'Baru saja' : 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  return new Date(dateString).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
}

export function FeedPostCard({ post: initialPost, currentUserId, onOpenPublicProfile, onPlayChallenge, onDeleted }) {
  const { lang, tx } = useLanguage();
  const { openTrackDetail } = useTrackDetail();
  const [post, setPost] = useState(initialPost);
  const [audioState, setAudioState] = useState(() => feedAudioManager.getState());
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(initialPost.commentsPreview || []);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reactBusy, setReactBusy] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const reactPickerRef = useRef(null);

  useEffect(() => {
    setPost(initialPost);
    setComments(initialPost.commentsPreview || []);
  }, [initialPost]);

  useEffect(() => {
    if (!showReactPicker) return;
    const handleOutside = (e) => {
      if (reactPickerRef.current && !reactPickerRef.current.contains(e.target)) {
        setShowReactPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showReactPicker]);

  useEffect(() => {
    const unsub = feedAudioManager.subscribe(setAudioState);
    return unsub;
  }, []);

  const author = post.author || {};
  const isOwner = Boolean(currentUserId && post.userId === currentUserId);
  const isSpotinizePost = Boolean(
    author.username === 'spotinize' ||
    author.isOfficial ||
    post.type === 'official_ai' ||
    post.subtype === 'official_blind_drop'
  );
  const displayContent = lang === 'en' && post.contentEn ? post.contentEn : post.content;

  const getSpotinizeSectionLabel = () => {
    if (post.subtype === 'news' || post.subtype === 'new_release') return tx('Music News', 'Berita Musik');
    if (post.subtype === 'hardest_song' || post.subtype === 'stats') return tx('Game Stats', 'Statistik Game');
    if (post.subtype === 'official_blind_drop') return tx('Blind Drop', 'Tebak Lagu');
    if (post.subtype === 'fun_fact') return tx('Music Trivia', 'Fakta Musik');
    return 'Spotinize';
  };

  const promptGuestRegister = () => {
    window.dispatchEvent(new CustomEvent('spotinize:open-guest-upgrade'));
  };

  const handleToggleReact = async (emoji) => {
    if (!currentUserId) {
      promptGuestRegister();
      return;
    }
    if (reactBusy) return;
    soundFx.playTap();
    haptics.tap();
    try {
      setReactBusy(true);
      const res = await ApiClient.post(`/feed/posts/${post.id}/react`, { emoji });
      setPost(prev => ({
        ...prev,
        reactionCounts: res.reactionCounts,
        viewerReactions: res.viewerReactions,
        totalReactions: res.totalReactions
      }));
    } catch (e) {
    } finally {
      setReactBusy(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentUserId) {
      promptGuestRegister();
      return;
    }
    if (!post.track || bookmarkBusy) return;
    try {
      setBookmarkBusy(true);
      const res = await ApiClient.post('/saved-tracks/toggle', {
        track: post.track,
        sourcePostId: post.id
      });
      setPost(prev => ({
        ...prev,
        track: prev.track ? { ...prev.track, isSaved: Boolean(res.isSaved) } : null
      }));
    } catch (e) {
    } finally {
      setBookmarkBusy(false);
    }
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && post.commentsCount > comments.length) {
      try {
        setLoadingComments(true);
        const res = await ApiClient.get(`/feed/posts/${post.id}/comments`);
        setComments(res.comments || []);
      } catch (e) {
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const clean = commentText.trim();
    if (!clean || submittingComment) return;
    try {
      setSubmittingComment(true);
      const res = await ApiClient.post(`/feed/posts/${post.id}/comments`, { content: clean });
      if (res?.comment) {
        setComments(prev => [...prev, res.comment]);
        setPost(prev => ({ ...prev, commentsCount: res.commentsCount || (prev.commentsCount + 1) }));
        setCommentText('');
      }
    } catch (e) {
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner || deleting) return;
    try {
      setDeleting(true);
      await ApiClient.delete(`/feed/posts/${post.id}`);
      if (onDeleted) onDeleted(post.id);
    } catch (e) {
      setDeleting(false);
    }
  };

  const renderTypePill = () => {
    if (post.type === 'auto_activity') {
      const label =
        post.subtype === 'personal_best' ? tx('Personal Best', 'Rekor Baru') :
        post.subtype === 'multiplayer_win' ? tx('Multiplayer Win', 'Menang Duel') :
        post.subtype === 'streak_milestone' ? tx('Streak Milestone', 'Milestone Streak') :
        tx('Favorite Song', 'Lagu Favorit');
      return (
        <span className="feed-type-pill">
          {post.subtype === 'streak_milestone' ? <Flame size={11} color="var(--color-warning)" /> :
           post.subtype === 'personal_best' ? <Trophy size={11} color="var(--color-primary)" /> :
           <Award size={11} color="var(--color-primary)" />}
          <span>{label}</span>
        </span>
      );
    }
    if (post.type === 'official_ai') {
      return (
        <span className="feed-type-pill" style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)', backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
          @spotinize AI
        </span>
      );
    }
    return null;
  };

  const trackKey = post.track ? `post:${post.id}:${post.track.spotifyId || post.track.title}` : null;
  const isTrackPlaying = Boolean(trackKey && audioState.currentKey === trackKey);

  const content = (
    <>
      {/* Header: Author + Time (or elevated official @spotinize header) */}
      {isSpotinizePost ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
            <img
              src="/spotinize-logo.png"
              alt="Spotinize"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'block'
              }}
            />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-text-bright)' }}>
              <span>Spotinize</span>
              <CheckCircle2 size={13} color="var(--color-primary)" />
            </span>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(29, 185, 84, 0.12)',
                border: '1px solid rgba(29, 185, 84, 0.28)',
                color: 'var(--color-primary)',
                letterSpacing: '0.01em'
              }}
            >
              {getSpotinizeSectionLabel()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--color-text-dim)' }}>
              {formatRelativeTime(post.createdAt, lang)}
            </span>
            {isOwner && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '4px', color: 'var(--color-text-dim)' }}
                title={tx('Delete post', 'Hapus post')}
              >
                {deleting ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="feed-post-header">
          <div
            onClick={() => onOpenPublicProfile && author.username && onOpenPublicProfile(author.username)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, cursor: author.username ? 'pointer' : 'default' }}
          >
            <Avatar
              src={author.avatarUrl}
              alt={author.displayName}
              seed={author.id || author.displayName}
              frame={author.equippedFrame}
              style={{ width: '38px', height: '38px', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-text-bright)' }}>
                  {author.displayName || 'Player'}
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: '999px', backgroundColor: '#1f2937', color: '#e5e7eb' }}>
                  Lv.{author.level || 1}
                </span>
                {author.equippedTitle && (
                  <span style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    color: author.equippedTitle.visualConfig?.color || '#facc15',
                    backgroundColor: author.equippedTitle.visualConfig?.bgColor || 'rgba(250,204,21,0.14)'
                  }}>
                    {author.equippedTitle.name}
                  </span>
                )}
                {author.isOfficial && <CheckCircle2 size={14} color="var(--color-primary)" />}
                {author.currentStreak > 0 && (
                  <span className="streak-pill-mini"><Flame size={10} /> {author.currentStreak}</span>
                )}
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
                  @{author.username} · {formatRelativeTime(post.createdAt, lang)}
                </span>
              </div>
            </div>
          </div>

          {isOwner && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleDelete}
              disabled={deleting}
              style={{ padding: '5px', color: 'var(--color-text-dim)' }}
              title={tx('Delete post', 'Hapus post')}
            >
              {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
            </button>
          )}
        </div>
      )}

      {/* Post Caption */}
      {displayContent && (
        <p style={{ fontSize: '0.93rem', color: 'var(--color-text)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
          {displayContent}
        </p>
      )}

      {/* Optional Source Link (e.g. for Official AI News) */}
      {post.sourceUrl && (
        <a
          href={post.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 700 }}
        >
          <ExternalLink size={12} /> {post.sourceName || tx('Read source', 'Baca sumber')}
        </a>
      )}

      {/* Blind Song Drop OR Async Challenge OR Regular Attached Track */}
      {(post.type === 'blind_drop' || post.subtype === 'official_blind_drop') && post.blindDrop ? (
        <BlindDropCard
          post={post}
          currentUserId={currentUserId}
          onPostUpdated={(updated) => setPost(updated)}
        />
      ) : post.type === 'challenge' && post.challenge ? (
        <AsyncChallengeCard
          post={post}
          currentUserId={currentUserId}
          onPlayChallenge={onPlayChallenge}
          onOpenPublicProfile={onOpenPublicProfile}
        />
      ) : post.track && (
        <div
          className="feed-track-box clickable-track-card"
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
              className={`trend-play-btn ${isTrackPlaying ? 'active' : ''}`}
              style={{ width: '34px', height: '34px' }}
              onClick={(e) => {
                e.stopPropagation();
                feedAudioManager.toggle({
                  key: trackKey,
                  previewUrl: post.track.previewUrl,
                  trackId: post.track.id
                });
              }}
              title={isTrackPlaying ? 'Stop' : 'Preview'}
            >
              {isTrackPlaying && audioState.isLoading ? (
                <Loader2 size={13} className="spin" />
              ) : isTrackPlaying && audioState.isPlaying ? (
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
              title={post.track.isSaved ? tx('Remove bookmark', 'Hapus simpanan') : tx('Save song', 'Simpan lagu')}
            >
              <Bookmark size={15} fill={post.track.isSaved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      )}

      {/* Quick React (Discord-style) & Comment Action Bar */}
      {isSpotinizePost ? (
        <div className="feed-actions-row">
          {(() => {
            const loveCount = post.reactionCounts?.['❤️'] || 0;
            const loveActive = post.viewerReactions?.includes('❤️');
            return (
              <button
                type="button"
                className={`react-pill-btn ${loveActive ? 'love-active' : ''}`}
                onClick={() => handleToggleReact('❤️')}
              >
                <Heart size={13} fill={loveActive ? '#ef4444' : 'none'} color={loveActive ? '#ef4444' : 'currentColor'} />
                {loveCount > 0 && <span className="react-count">{loveCount}</span>}
              </button>
            );
          })()}
        </div>
      ) : (
        <div className="feed-actions-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Single Reaction Trigger Button + Floating Picker Chip */}
            <div ref={reactPickerRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`react-pill-btn ${showReactPicker ? 'active' : ''}`}
                onClick={() => setShowReactPicker(prev => !prev)}
                title={tx('Add reaction', 'Tambah reaksi')}
                aria-label={tx('Add reaction', 'Tambah reaksi')}
              >
                <SmilePlus size={14} />
              </button>

              {showReactPicker && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 60,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#15151d',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.65)'
                  }}
                >
                  {REACTION_EMOJIS.map((emoji) => {
                    const active = post.viewerReactions?.includes(emoji);
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setShowReactPicker(false);
                          handleToggleReact(emoji);
                        }}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: active ? '1px solid rgba(29,185,84,0.5)' : '1px solid transparent',
                          backgroundColor: active ? 'rgba(29,185,84,0.16)' : 'transparent',
                          fontSize: '0.98rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Discord-style active reaction pills (only show count >= 1) */}
            {REACTION_EMOJIS.filter(emoji => (post.reactionCounts?.[emoji] || 0) >= 1).map((emoji) => {
              const count = post.reactionCounts?.[emoji] || 0;
              const active = post.viewerReactions?.includes(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  className={`react-pill-btn ${active ? 'active' : ''}`}
                  onClick={() => handleToggleReact(emoji)}
                >
                  <span>{emoji}</span>
                  <span className="react-count">{count}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`react-pill-btn ${showComments ? 'active' : ''}`}
            onClick={handleToggleComments}
          >
            <MessageCircle size={13} />
            <span>{post.commentsCount || 0}</span>
          </button>
        </div>
      )}

      {/* Inline 1-Level Comments */}
      {!isSpotinizePost && showComments && (
        <div className="feed-comments-box">
          {loadingComments ? (
            <div style={{ padding: '8px 0', textAlign: 'center', color: 'var(--color-text-dim)' }}>
              <Loader2 size={16} className="spin" />
            </div>
          ) : comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {comments.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem' }}>
                  <Avatar
                    src={c.author?.avatarUrl}
                    alt={c.author?.displayName}
                    seed={c.author?.id || c.author?.displayName}
                    style={{ width: '24px', height: '24px', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span
                      onClick={() => onOpenPublicProfile && c.author?.username && onOpenPublicProfile(c.author.username)}
                      style={{ fontWeight: 800, color: 'var(--color-text-bright)', cursor: 'pointer', marginRight: '6px' }}
                    >
                      {c.author?.displayName || 'Player'}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{c.content}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
              {tx('No comments yet. Be the first!', 'Belum ada komentar. Jadilah yang pertama!')}
            </div>
          )}

          {currentUserId && (
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                className="input"
                maxLength={280}
                placeholder={tx('Write a short comment...', 'Tulis komentar singkat...')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{ padding: '7px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-full)' }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!commentText.trim() || submittingComment}
                style={{ borderRadius: 'var(--radius-full)', padding: '0 12px' }}
              >
                {submittingComment ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );

  if (isSpotinizePost) {
    return (
      <div className="feed-post-item spotinize-official-wrap">
        <article className="spotinize-official-card">
          {content}
        </article>
      </div>
    );
  }

  return (
    <article className="feed-post-item">
      {content}
    </article>
  );
}

export default FeedPostCard;
