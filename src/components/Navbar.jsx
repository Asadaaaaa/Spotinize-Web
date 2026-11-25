import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, User, LogOut, Disc3, Bell, Globe, ChevronDown, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import Avatar from './Avatar.jsx';
import Logo from './Logo.jsx';

export function Navbar({ currentTab, onNavigate, unreadCount = 0, onOpenNotifications, hideNavLinks = false, isLanding = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const showOnlyVersion = isLanding || currentTab === 'landing';

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

  return (
    <>
      {/* Top Sticky Header */}
      <header style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'rgba(11, 11, 13, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>
          {/* Brand Logo on Left (or Version Badge Only on Landing Page) */}
          <div 
            onClick={() => onNavigate('landing')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '2px',
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            {!showOnlyVersion && <Logo size="md" />}
            <span style={{
              fontSize: showOnlyVersion ? '0.72rem' : '0.58rem',
              fontWeight: showOnlyVersion ? 800 : 700,
              letterSpacing: '0.03em',
              padding: showOnlyVersion ? '4px 10px' : '1px 6px',
              borderRadius: 'var(--radius-full, 9999px)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: showOnlyVersion ? 'var(--color-text-muted, #a1a1aa)' : 'var(--color-text-dim, #8e8e93)',
              border: '1px solid var(--color-border)',
              lineHeight: 1.2,
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}>
              {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v0.7.0'} Beta
            </span>
          </div>

          {/* Desktop Navigation Links (Centered) */}
          {isAuthenticated && !hideNavLinks && (
            <nav className="desktop-only-nav" style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <button
                className={`btn btn-sm ${currentTab === 'dashboard' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => onNavigate('dashboard')}
              >
                <Disc3 size={16} />
                <span>{t('navPlay')}</span>
              </button>

              <button
                className={`btn btn-sm ${currentTab === 'leaderboard' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => onNavigate('leaderboard')}
              >
                <Trophy size={16} />
                <span>{t('navRank')}</span>
              </button>

              <button
                className={`btn btn-sm ${currentTab === 'friends' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => onNavigate('friends')}
              >
                <Users size={16} />
                <span>{t('navFriends')}</span>
              </button>
            </nav>
          )}

          {/* Right Controls: User Chip Dropdown (Authenticated) or Language + Login (Guest) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={toggleLang}
                className="btn btn-secondary btn-sm"
                title={lang === 'en' ? 'Switch to Indonesian' : 'Ganti ke Bahasa Inggris'}
                style={{
                  padding: '6px 10px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                <Globe size={14} color="var(--color-primary)" />
                <span>{lang.toUpperCase()}</span>
              </button>
            )}

            {isAuthenticated ? (
              currentTab === 'landing' ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate('dashboard')}
                  title={t('navHome')}
                  aria-label={t('navHome')}
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: 0,
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Home size={18} color="var(--color-primary)" />
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* User Chip + Dropdown */}
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <div
                    onClick={() => setIsUserMenuOpen(prev => !prev)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      padding: '3px 8px 3px 4px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-surface)',
                      border: isUserMenuOpen ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      height: '38px'
                    }}
                  >
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.displayName}
                      size="sm"
                      seed={user.id || user.displayName}
                      style={{ width: '28px', height: '28px' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-bright)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.displayName?.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} color="var(--color-text-dim)" />

                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 4px',
                        borderRadius: '9px',
                        backgroundColor: 'var(--color-primary)',
                        color: '#000',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 8px rgba(29, 185, 84, 0.8)'
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  {isUserMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: '200px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      zIndex: 200
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('profile');
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'flex-start', width: '100%', padding: '8px 10px', gap: '8px' }}
                      >
                        <User size={15} />
                        <span>{t('navProfile')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenNotifications?.();
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'space-between', width: '100%', padding: '8px 10px' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <Bell size={15} />
                          <span>{t('navNotifications')}</span>
                        </span>
                        {unreadCount > 0 && (
                          <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toggleLang();
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'space-between', width: '100%', padding: '8px 10px' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <Globe size={15} color="var(--color-primary)" />
                          <span>{lang === 'en' ? 'Language' : 'Bahasa'}</span>
                        </span>
                        <span className="badge badge-gray" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {lang.toUpperCase()}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )
            ) : (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('register')}
              >
                Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Bottom Navigation Pill (Mobile Only) */}
      {isAuthenticated && !hideNavLinks && (
        <nav className="bottom-nav-floating" aria-label="Mobile Bottom Navigation">
          <button
            className={`floating-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <Disc3 size={20} />
            <span>{t('navPlay')}</span>
          </button>

          <button
            className={`floating-nav-item ${currentTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => onNavigate('leaderboard')}
          >
            <Trophy size={20} />
            <span>{t('navRank')}</span>
          </button>

          <button
            className={`floating-nav-item ${currentTab === 'friends' ? 'active' : ''}`}
            onClick={() => onNavigate('friends')}
          >
            <Users size={20} />
            <span>{t('navFriends')}</span>
          </button>
        </nav>
      )}
    </>
  );
}

export default Navbar;
