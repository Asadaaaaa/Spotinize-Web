import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Music2, Plus } from 'lucide-react';
import ApiClient from '../services/api.js';
import FeedPostCard from './FeedPostCard.jsx';
import Avatar from './Avatar.jsx';
import { FeedSkeleton } from './Skeletons.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

const FEED_PAGE_SIZE = 7;

export function FeedList({ user = null, currentUserId, latestCreatedPost = null, onOpenPublicProfile, onPlayChallenge, onOpenComposer }) {
  const { tx } = useLanguage();
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' (default) | 'following'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const loadFeed = useCallback(async (tabToLoad = activeTab) => {
    try {
      setLoading(true);
      const res = await ApiClient.get(`/feed?tab=${tabToLoad}&offset=0&limit=${FEED_PAGE_SIZE}`);
      setPosts(res.posts || []);
      setHasMore(Boolean(res.hasMore));
      setNextOffset(res.nextOffset || 0);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadFeed(activeTab);
  }, [activeTab, loadFeed]);

  // Prepend newly published post immediately
  useEffect(() => {
    if (!latestCreatedPost?.id) return;
    setPosts(prev => {
      if (prev.some(p => p.id === latestCreatedPost.id)) return prev;
      return [latestCreatedPost, ...prev];
    });
  }, [latestCreatedPost]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    try {
      setLoadingMore(true);
      const res = await ApiClient.get(`/feed?tab=${activeTab}&offset=${nextOffset}&limit=${FEED_PAGE_SIZE}`);
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const fresh = (res.posts || []).filter(p => !existingIds.has(p.id));
        return [...prev, ...fresh];
      });
      setHasMore(Boolean(res.hasMore));
      setNextOffset(res.nextOffset || nextOffset);
    } catch (e) {
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [activeTab, hasMore, nextOffset]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: '280px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, handleLoadMore]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Sub-Tabs: Explore (Default) & Following */}
      <div className="feed-subtabs">
        <button
          type="button"
          className={`feed-subtab-btn ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          {tx('Explore', 'Explore')}
        </button>
        <button
          type="button"
          className={`feed-subtab-btn ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          {tx('Following', 'Following')}
        </button>
      </div>

      {/* Post Composer Card Below Explore / Following Tabs (hidden for Guest) */}
      {onOpenComposer && currentUserId && (
        <div
          role="button"
          tabIndex={0}
          className="feed-mobile-composer-card"
          onClick={() => onOpenComposer()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenComposer();
            }
          }}
          style={{
            margin: '12px 0 4px',
            padding: '10px 12px',
            borderRadius: '14px',
            backgroundColor: '#131319',
            border: '1px solid rgba(255,255,255,0.08)',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
        >
          <Avatar
            src={user?.avatarUrl}
            alt={user?.displayName}
            seed={user?.id || user?.displayName}
            frame={user?.equippedFrame}
            style={{ width: '34px', height: '34px', flexShrink: 0 }}
          />
          <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>
            {tx('Share a song or music note...', 'Bagikan lagu atau catatan musikmu...')}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '999px',
              backgroundColor: 'var(--color-primary)',
              color: '#000',
              fontSize: '0.76rem',
              fontWeight: 800,
              flexShrink: 0
            }}
          >
            <Plus size={14} strokeWidth={2.6} />
            <span>{tx('Post', 'Post')}</span>
          </span>
        </div>
      )}

      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <div style={{
          padding: '36px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Music2 size={20} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--color-text-bright)' }}>
            {activeTab === 'following'
              ? tx('No posts from people you follow yet', 'Belum ada postingan dari yang kamu follow')
              : tx('No posts in the feed yet', 'Belum ada postingan di feed')}
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', maxWidth: '360px', margin: 0 }}>
            {activeTab === 'following'
              ? tx('Follow players in Search or Friends to see their music posts here!', 'Follow pemain di Search atau Friends untuk melihat postingan mereka di sini!')
              : tx('Click + Post to share your Song of the Day, or finish a game to trigger an activity!', 'Klik + Post untuk bagikan Song of the Day pertamamu, atau mainkan 1 ronde game!')}
          </p>
        </div>
      ) : (
        <div className="feed-stream">
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onOpenPublicProfile={onOpenPublicProfile}
              onPlayChallenge={onPlayChallenge}
              onDeleted={(deletedId) => setPosts(prev => prev.filter(p => p.id !== deletedId))}
            />
          ))}

          {hasMore && (
            <div
              ref={sentinelRef}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '18px 0 8px',
                minHeight: '44px',
                color: 'var(--color-text-dim)',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              {loadingMore && (
                <>
                  <Loader2 size={18} className="spin" style={{ color: 'var(--color-primary)' }} />
                  <span>{tx('Loading more posts...', 'Memuat postingan...')}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FeedList;
