import React from 'react';

export function SkeletonBlock({ width = '100%', height = '12px', radius = 'var(--radius-sm)', className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="feed-stream" aria-busy="true" aria-label="Loading feed">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="feed-post-card" style={{ pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SkeletonBlock width="38px" height="38px" radius="50%" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonBlock width="140px" height="13px" radius="999px" />
              <SkeletonBlock width="90px" height="10px" radius="999px" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '10px' }}>
            <SkeletonBlock width="92%" height="12px" radius="999px" />
            <SkeletonBlock width="68%" height="12px" radius="999px" />
          </div>

          <div className="feed-track-box" style={{ marginTop: '12px' }}>
            <SkeletonBlock width="48px" height="48px" radius="8px" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonBlock width="58%" height="13px" radius="999px" />
              <SkeletonBlock width="38%" height="10px" radius="999px" />
            </div>
            <SkeletonBlock width="32px" height="32px" radius="50%" style={{ flexShrink: 0 }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <SkeletonBlock width="54px" height="26px" radius="999px" />
            <SkeletonBlock width="54px" height="26px" radius="999px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendsSkeleton({ compact = false }) {
  if (compact) {
    return (
      <div className="mobile-trends-strip" aria-busy="true" aria-label="Loading trends">
        <div className="right-widget-header" style={{ marginBottom: '8px' }}>
          <SkeletonBlock width="140px" height="14px" radius="999px" />
        </div>
        <div className="mobile-trends-scroll">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="mobile-trend-chip" style={{ minWidth: '190px', pointerEvents: 'none' }}>
              <SkeletonBlock width="20px" height="14px" radius="6px" style={{ flexShrink: 0 }} />
              <SkeletonBlock width="34px" height="34px" radius="50%" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <SkeletonBlock width="80%" height="11px" radius="999px" />
                <SkeletonBlock width="55%" height="9px" radius="999px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-busy="true" aria-label="Loading trends">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="trend-row" style={{ pointerEvents: 'none' }}>
          <SkeletonBlock width="16px" height="12px" radius="4px" style={{ flexShrink: 0 }} />
          <SkeletonBlock width="36px" height="36px" radius="50%" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <SkeletonBlock width="76%" height="12px" radius="999px" />
            <SkeletonBlock width="52%" height="10px" radius="999px" />
          </div>
          <SkeletonBlock width="26px" height="26px" radius="50%" style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

export function FriendActivitySkeleton({ count = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-busy="true" aria-label="Loading friends activity">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="activity-user-row" style={{ pointerEvents: 'none' }}>
          <SkeletonBlock width="34px" height="34px" radius="50%" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <SkeletonBlock width="65%" height="12px" radius="999px" />
            <SkeletonBlock width="45%" height="10px" radius="999px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchSkeleton({ mode = 'discovery' }) {
  if (mode === 'results') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-busy="true" aria-label="Searching">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBlock width="90px" height="12px" radius="999px" />
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="search-row-card" style={{ pointerEvents: 'none' }}>
              <SkeletonBlock width="40px" height="40px" radius="50%" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <SkeletonBlock width="45%" height="13px" radius="999px" />
                <SkeletonBlock width="30%" height="10px" radius="999px" />
              </div>
              <SkeletonBlock width="72px" height="28px" radius="999px" />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBlock width="90px" height="12px" radius="999px" />
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="search-row-card" style={{ pointerEvents: 'none' }}>
              <SkeletonBlock width="40px" height="40px" radius="8px" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <SkeletonBlock width="60%" height="13px" radius="999px" />
                <SkeletonBlock width="38%" height="10px" radius="999px" />
              </div>
              <SkeletonBlock width="30px" height="30px" radius="50%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} aria-busy="true" aria-label="Loading discovery">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonBlock width="150px" height="12px" radius="999px" />
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="search-row-card" style={{ pointerEvents: 'none' }}>
            <SkeletonBlock width="40px" height="40px" radius="50%" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonBlock width="42%" height="13px" radius="999px" />
              <SkeletonBlock width="28%" height="10px" radius="999px" />
            </div>
            <SkeletonBlock width="74px" height="28px" radius="999px" />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SkeletonBlock width="80px" height="12px" radius="999px" />
        <div className="search-trends-grid">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SkeletonBlock width="110px" height="13px" radius="999px" />
              {Array.from({ length: 4 }).map((__, row) => (
                <div key={row} className="search-row-card" style={{ pointerEvents: 'none' }}>
                  <SkeletonBlock width="38px" height="38px" radius="8px" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <SkeletonBlock width="70%" height="12px" radius="999px" />
                    <SkeletonBlock width="48%" height="10px" radius="999px" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="home-column-wrap mobile-page-container" aria-busy="true" aria-label="Loading profile">
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <SkeletonBlock width="84px" height="84px" radius="50%" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SkeletonBlock width="55%" height="20px" radius="999px" />
            <SkeletonBlock width="32%" height="12px" radius="999px" />
            <SkeletonBlock width="78%" height="12px" radius="999px" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '18px' }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonBlock key={idx} width="100%" height="52px" radius="var(--radius-md)" />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <SkeletonBlock width="96px" height="34px" radius="999px" />
        <SkeletonBlock width="96px" height="34px" radius="999px" />
      </div>

      <div style={{ marginTop: '14px' }}>
        <FeedSkeleton count={2} />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton({ count = 6 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-busy="true" aria-label="Loading leaderboard">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
            <SkeletonBlock width="28px" height="18px" radius="6px" style={{ flexShrink: 0 }} />
            <SkeletonBlock width="44px" height="44px" radius="50%" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonBlock width="45%" height="14px" radius="999px" />
              <SkeletonBlock width="65%" height="11px" radius="999px" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
            <SkeletonBlock width="48px" height="18px" radius="6px" />
            <SkeletonBlock width="40px" height="9px" radius="999px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrackDetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }} aria-busy="true" aria-label="Loading track detail">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '5px' }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="track-meta-box" style={{ padding: '5px 8px' }}>
            <SkeletonBlock width="45%" height="8px" radius="999px" />
            <SkeletonBlock width="80%" height="11px" radius="999px" style={{ marginTop: '4px' }} />
          </div>
        ))}
      </div>

      <div className="track-meta-box" style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <SkeletonBlock width="35%" height="8px" radius="999px" />
        <SkeletonBlock width="96%" height="10px" radius="999px" />
        <SkeletonBlock width="78%" height="10px" radius="999px" />
      </div>

      <SkeletonBlock width="100%" height="110px" radius="var(--radius-md)" />
    </div>
  );
}
