import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Search, Trophy, Users, Plus, Bell, Globe, User, LogOut,
  ChevronUp, ChevronDown, Flame, Volume2, VolumeX, ShoppingBag, Gift, Target, Music, Ticket, Snowflake, Settings
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
  canClaimDailyLogin = false,
  claimableQuestsCount = 0,
  onOpenDailyLogin,
  onOpenQuests,
  onOpenNotifications,
  onOpenComposer,
  onOpenSavedSongs,
  onOpenPublicProfile,
  onOpenSettings,
  children
}) {
  const { user, logout } = useAuth();
  const displayUser = user || { displayName: 'Guest', username: 'guest' };
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
    { id: 'friends', label: t('navFriends'), icon: Users },
    { id: 'store', label: t('navStore'), icon: ShoppingBag }
  ];

  const mobileNavItems = [
    { id: 'dashboard', label: t('navHome'), icon: Home },
    { id: 'store', label: t('navStore'), icon: ShoppingBag },
    { id: 'search', label: t('navSearch'), icon: Search },
    { id: 'leaderboard', label: t('navRank'), icon: Trophy }
  ];

  const versionStr = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v0.7.0';
  const effectivePercent = muted ? 0 : Math.round(volume * 100);

  const renderUserMenuContent = (closeMenu, isMobile = false) => (
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

      {isMobile && (
        <button
          type="button"
          className="btn btn-ghost btn-sm sidebar-popover-item"
          onClick={() => {
            closeMenu();
            onNavigate('friends');
          }}
        >
          <Users size={15} />
          <span>{t('navFriends')}</span>
        </button>
      )}

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

      <button
        type="button"
        className="btn btn-ghost btn-sm sidebar-popover-item"
        onClick={() => {
          closeMenu();
          onOpenSettings?.();
        }}
      >
        <Settings size={15} color="var(--color-primary)" />
        <span>{tx('Settings', 'Pengaturan')}</span>
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
      {/* Mobile Compact Header with Quick Actions + User Chip Dropdown */}
      <header className="mobile-top-header">
        <div
          onClick={() => onNavigate('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: 0 }}
        >
          <Logo size="sm" />
          <span className="version-pill mobile-hide-xs">{versionStr}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Daily Login */}
          <button
            type="button"
            className="icon-circle-btn"
            onClick={() => onOpenDailyLogin?.()}
            aria-label="Daily Login"
            title="Daily Login"
          >
            <Gift size={16} color="#facc15" />
            {canClaimDailyLogin && (
              <span
                style={{
                  position: 'absolute',
                  top: '1px',
                  right: '1px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  border: '1.5px solid var(--color-surface)'
                }}
              />
            )}
          </button>

          {/* Quests */}
          <button
            type="button"
            className="icon-circle-btn"
            onClick={() => onOpenQuests?.()}
            aria-label="Quests"
            title="Quests"
          >
            <Target size={16} color="#38bdf8" />
            {claimableQuestsCount > 0 && (
              <span className="notif-dot-badge" style={{ backgroundColor: '#38bdf8', boxShadow: 'none' }}>
                {claimableQuestsCount > 9 ? '9+' : claimableQuestsCount}
              </span>
            )}
          </button>

          {/* Mobile User Chip Dropdown (hidden for Guest -> show Register CTA) */}
          {!user?.id ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => window.dispatchEvent(new CustomEvent('spotinize:open-guest-upgrade'))}
              style={{ padding: '6px 12px', fontSize: '0.76rem', fontWeight: 800, borderRadius: 'var(--radius-full)' }}
            >
              {tx('Register', 'Daftar')}
            </button>
          ) : (
          <div ref={mobileMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`mobile-user-chip ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label={t('navProfile')}
            >
              <Avatar
                src={displayUser?.avatarUrl}
                alt={displayUser?.displayName}
                seed={displayUser?.id || displayUser?.displayName}
                frame={displayUser?.equippedFrame}
                style={{ width: '26px', height: '26px' }}
              />
              <span className="mobile-user-chip-name">
                {displayUser?.displayName?.split(' ')[0]}
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
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    backgroundColor: '#121218',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.displayName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '1px 6px', borderRadius: '999px', backgroundColor: 'rgba(192,132,252,0.14)', color: '#d8b4fe' }}>
                        Lv.{user?.level || 1}
                      </span>
                      <span className="streak-pill-mini">
                        <Flame size={10} /> {user?.currentStreak || 0}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('store');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '5px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#0b0b10',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.73rem',
                      fontWeight: 800,
                      color: '#e5e7eb',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Music size={12} color="var(--color-primary)" /> {user?.notesBalance || 0}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Ticket size={12} color="#38bdf8" /> {user?.gachaTickets || 0}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Snowflake size={12} color="#60a5fa" /> {user?.streakFreezes || 0}/2
                    </span>
                  </button>
                </div>

                {renderUserMenuContent(() => setIsMobileMenuOpen(false), true)}
              </div>
            )}
          </div>
          )}
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

            {/* Quick Actions: Daily Login & Quests */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: '0.74rem', justifyContent: 'center', position: 'relative' }}
                onClick={() => onOpenDailyLogin?.()}
              >
                <Gift size={14} color="#facc15" />
                <span>Login</span>
                {canClaimDailyLogin && (
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: '0.74rem', justifyContent: 'center' }}
                onClick={() => onOpenQuests?.()}
              >
                <Target size={14} color="#38bdf8" />
                <span>Quests{claimableQuestsCount > 0 ? ` (${claimableQuestsCount})` : ''}</span>
              </button>
            </div>

            {/* Primary + Post CTA (hidden for Guest) */}
            {user?.id && (
              <button
                type="button"
                className="btn btn-primary sidebar-post-btn"
                onClick={() => onOpenComposer?.()}
              >
                <Plus size={19} strokeWidth={2.8} />
                <span>{t('navPost')}</span>
              </button>
            )}

            {/* Bottom User Chip (hidden for Guest) */}
            {user?.id && (
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
                    frame={user?.equippedFrame}
                    style={{ width: '36px', height: '36px' }}
                  />
                  {unreadCount > 0 && (
                    <span className="notif-dot-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    color: 'var(--color-text-bright)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user?.displayName}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginTop: '3px'
                  }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(192,132,252,0.14)',
                      color: '#d8b4fe'
                    }}>
                      Lv.{user?.level || 1}
                    </span>
                    <span className="streak-pill-mini">
                      <Flame size={10} /> {user?.currentStreak || 0}
                    </span>
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
            )}
          </div>
        </aside>

        {/* CENTER MAIN COLUMN */}
        <main className="app-shell-center">
          {children}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="app-shell-right">
          <div className="app-shell-right-inner">
            <div className="app-shell-right-scroll">
              <GlobalTrendsCard />
              <FollowingActivityCard
                user={user}
                onOpenPublicProfile={onOpenPublicProfile}
                onNavigateFriends={() => onNavigate('friends')}
              />
            </div>

            {user?.id && (
            <button
              type="button"
              className="sidebar-wallet-floating"
              onClick={() => onNavigate('store')}
              title={tx('Open Store & Gacha', 'Buka Store & Gacha')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Music size={14} color="var(--color-primary)" />
                <span>{user?.notesBalance || 0}</span>
              </span>
              <span style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Ticket size={14} color="#38bdf8" />
                <span>{user?.gachaTickets || 0}</span>
              </span>
              <span style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Snowflake size={14} color="#60a5fa" />
                <span>{user?.streakFreezes || 0}/2</span>
              </span>
            </button>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Floating Bottom Nav (Home, Store, Search, Leaderboard) */}
      <nav className="bottom-nav-floating" aria-label="Mobile Bottom Navigation">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`floating-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default AppShell;
