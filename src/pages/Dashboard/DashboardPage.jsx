import React from 'react';
import QuickPlayBar from '../../components/QuickPlayBar.jsx';
import GlobalTrendsCard from '../../components/GlobalTrendsCard.jsx';
import FeedList from '../../components/FeedList.jsx';

export function DashboardPage({ user, onGameCreated, onJoinRoom, latestCreatedPost, onOpenPublicProfile }) {
  return (
    <div className="home-column-wrap mobile-page-container">
      {/* 1. Game-First Quick Play Bar at Top */}
      <QuickPlayBar
        user={user}
        onGameCreated={onGameCreated}
        onJoinRoom={onJoinRoom}
      />

      {/* Mobile-only compact Global Trends Top 5 strip */}
      <div className="mobile-only-block">
        <GlobalTrendsCard compact />
      </div>

      {/* 2. Combined Music Feed Stream Below */}
      <section className="feed-section-shell">
        <FeedList
          currentUserId={user?.id}
          latestCreatedPost={latestCreatedPost}
          onOpenPublicProfile={onOpenPublicProfile}
          onPlayChallenge={onGameCreated}
        />
      </section>
    </div>
  );
}

export default DashboardPage;
