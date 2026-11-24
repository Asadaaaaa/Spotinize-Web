import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Search, Trophy, Users, Plus, Bell, Globe, User, LogOut,
  ChevronUp, ChevronDown, Flame, Volume2, VolumeX, Bookmark
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import audioPlayer from '../services/audioPlayer.js';
import feedAudioManager from '../services/feedAudioManager.js';
import Avatar from './Avatar.jsx';
import Logo from './Logo.jsx';
import GlobalTrendsCard from './GlobalTrendsCard.jsx';
import FollowingActivityCard from './FollowingActivityCard.jsx';

export function AppShell({
  currentTab,
  onNavigate,
  unreadCount = 0,
  onOpenNotifications,
  onOpenComposer,
  onOpenSavedSongs,
  onOpenPublicProfile,
  children
}) {
  const { user, logout } = useAuth();
  const { lang, toggleLang, t, tx } = useLanguage();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [volume, setVolume] = useState(() => audioPlayer.getVolume());
  const [muted, setMuted] = useState(() => audioPlayer.isMuted());

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleVolumeChange = (nextVol) => {
    const clamped = Math.max(0, Math.min(1, Number(nextVol)));
    setVolume(clamped);
    if (clamped > 0 && muted) setMuted(false);
    audioPlayer.setVolume(clamped);
    feedAudioManager.setVolume(clamped);
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioPlayer.setMuted(nextMuted);
    feedAudioManager.setMuted(nextMuted);
  };

  const navItems = [
    { id: 'dashboard', label: t('navHome'), icon: Home },
    { id: 'search', label: t('navSearch'), icon: Search },
    { id: 'leaderboard', label: t('navRank'), icon: Trophy },
    { id: 'friends', label: t('navFriends'), icon: Users }
  ];

  const versionStr = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v0.6.0';
  const effectivePercent = muted ? 0 : Math.round(volume * 100);

  const renderUserMenuContent = (closeMenu) => (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm sidebar-popover-item"
        onClick={() => {
          closeMenu();
          onNavigate('profile');
        }}
      >
        <User size={15} />
        <span>{t('navProfile')}</span>
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-sm sidebar-popover-item"
        onClick={() => {
          closeMenu();
          onOpenSavedSongs?.();
        }}
      >
        <Bookmark size={15} />
        <span>{t('navSaved')}</span>
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-sm sidebar-popover-item"
        onClick={() => {
          closeMenu();
          onOpenNotifications?.();
        }}
      >
        <Bell size={15} />
        <span>{t('navNotifications')}</span>
        {unreadCount > 0 && (
          <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '1px 6px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Music Volume Control */}
      <div className="volume-slider-row">
        <button
          type="button"
          className="volume-mute-btn"
          onClick={handleToggleMute}
          title={muted ? tx('Unmute', 'Bunyikan') : tx('Mute', 'Bisukan')}
        >
          {muted || volume === 0 ? <VolumeX size={15} color="var(--color-danger)" /> : <Volume2 size={15} color="var(--color-primary)" />}
        </button>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
            <span>{t('gameVolume')}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)' }}>{effectivePercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="volume-range-input"
            aria-label={t('gameVolume')}
          />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-ghost btn-sm sidebar-popover-item"
        onClick={() => toggleLang()}
      >
        <Globe size={15} color="var(--color-primary)" />
        <span>{lang === 'en' ? 'Language' : 'Bahasa'}</span>
        <span className="badge badge-gray" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '1px 6px' }}>
          {lang.toUpperCase()}
        </span>
      </button>

      <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />

      <button
        type="button"
        className="btn btn-ghost btn-sm sidebar-popover-item"
        style={{ color: 'var(--color-danger)' }}
        onClick={() => {
          closeMenu();
          logout();
        }}
      >
        <LogOut size={15} />
        <span>{t('navLogout')}</span>
      </button>
    </>
  );

  return (
    <div className="app-shell-root">
      {/* Mobile Compact Header with User Chip Dropdown */}
      <header className="mobile-top-header">
        <div
          onClick={() => onNavigate('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Logo size="sm" />
          <span className="version-pill">{versionStr}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user?.currentStreak > 0 && (
            <span className="streak-pill" title={`${user.currentStreak} day streak`}>
              <Flame size={13} /> {user.currentStreak}
            </span>
          )}

          {/* Mobile User Chip Dropdown */}
          <div ref={mobileMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`mobile-user-chip ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label={t('navProfile')}
            >
              <Avatar
                src={user?.avatarUrl}
                alt={user?.displayName}
                seed={user?.id || user?.displayName}
                style={{ width: '26px', height: '26px' }}
              />
              <span className="mobile-user-chip-name">
                {user?.displayName?.split(' ')[0]}
              </span>
              <ChevronDown
                size={13}
                color="var(--color-text-dim)"
                style={{
                  transform: isMobileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease'
                }}
              />
              {unreadCount > 0 && (
                <span className="notif-dot-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {isMobileMenuOpen && (
              <div className="mobile-user-popover">
                {renderUserMenuContent(() => setIsMobileMenuOpen(false))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop & Tablet Three-Column Grid */}
      <div className="app-shell-grid">
        {/* LEFT SIDEBAR */}
        <aside className="app-shell-left">
          <div className="app-shell-left-inner">
            {/* Brand */}
            <div
              onClick={() => onNavigate('landing')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '3px',
                cursor: 'pointer',
                padding: '6px 10px 14px'
              }}
            >
              <Logo size="md" />
              <span className="version-pill">{versionStr} Beta</span>
            </div>

            {/* Primary Nav */}
            <nav className="sidebar-nav" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Primary + Post CTA */}
            <button
              type="button"
              className="btn btn-primary sidebar-post-btn"
              onClick={() => onOpenComposer?.()}
            >
              <Plus size={19} strokeWidth={2.8} />
              <span>{t('navPost')}</span>
            </button>

            {/* Bottom User Chip */}
            <div ref={userMenuRef} className="sidebar-user-chip-wrap">
              {isUserMenuOpen && (
                <div className="sidebar-user-popover">
                  {renderUserMenuContent(() => setIsUserMenuOpen(false))}
                </div>
              )}

              <button
                type="button"
                className={`sidebar-user-chip ${isUserMenuOpen ? 'open' : ''}`}
                onClick={() => setIsUserMenuOpen(prev => !prev)}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar
                    src={user?.avatarUrl}
                    alt={user?.displayName}
                    seed={user?.id || user?.displayName}
                    style={{ width: '36px', height: '36px' }}
                  />
                  {unreadCount > 0 && (
                    <span className="notif-dot-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    color: 'var(--color-text-bright)'
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.displayName}
                    </span>
                    {user?.currentStreak > 0 && (
                      <span className="streak-pill-mini">
                        <Flame size={10} /> {user.currentStreak}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.74rem',
                    color: 'var(--color-text-dim)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    @{user?.username}
                  </div>
                </div>

                <ChevronUp
                  size={15}
                  color="var(--color-text-dim)"
                  style={{
                    flexShrink: 0,
                    transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease'
                  }}
                />
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER MAIN COLUMN */}
        <main className="app-shell-center">
          {children}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="app-shell-right">
          <div className="app-shell-right-inner">
            <GlobalTrendsCard />
            <FollowingActivityCard
              user={user}
              onOpenPublicProfile={onOpenPublicProfile}
              onNavigateFriends={() => onNavigate('friends')}
            />
          </div>
        </aside>
      </div>

      {/* Mobile Floating Bottom Nav (Home, Search, Center Raised + Post, Rank, Friends) */}
      <nav className="bottom-nav-floating" aria-label="Mobile Bottom Navigation">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`floating-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Center Raised Green + Post Button */}
        <button
          type="button"
          className="floating-nav-post-btn"
          onClick={() => onOpenComposer?.()}
          aria-label={t('navPost')}
        >
          <Plus size={24} strokeWidth={2.8} />
        </button>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`floating-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default AppShell;
