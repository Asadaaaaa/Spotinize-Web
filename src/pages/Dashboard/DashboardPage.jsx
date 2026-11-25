import React from 'react';
import QuickPlayBar from '../../components/QuickPlayBar.jsx';
import FeedList from '../../components/FeedList.jsx';

export function DashboardPage({ user, onGameCreated, onJoinRoom, latestCreatedPost, onOpenPublicProfile, onOpenComposer }) {
  return (
    <div className="home-column-wrap mobile-page-container">
      {/* 1. Game-First Quick Play Bar at Top */}
      <QuickPlayBar
        user={user}
        onGameCreated={onGameCreated}
        onJoinRoom={onJoinRoom}
      />

      {/* 2. Combined Music Feed Stream Below */}
      <section className="feed-section-shell">
        <FeedList
          user={user}
          currentUserId={user?.id}
          latestCreatedPost={latestCreatedPost}
          onOpenPublicProfile={onOpenPublicProfile}
          onPlayChallenge={onGameCreated}
          onOpenComposer={onOpenComposer}
        />
      </section>
    </div>
  );
}

export default DashboardPage;
