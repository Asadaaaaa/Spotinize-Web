import React from 'react';
import { Trophy, Users, User, LogOut, Flame, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import Avatar from './Avatar.jsx';
import Logo from './Logo.jsx';

export function Navbar({ currentTab, onNavigate, unreadCount = 0, onOpenNotifications }) {
  const { user, isAuthenticated, logout } = useAuth();

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>
          {/* Brand Logo on Left (Pure Text Typography) */}
          <div 
            onClick={() => onNavigate('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '6px 0'
            }}
          >
            <Logo size="md" />
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 7px',
              borderRadius: 'var(--radius-full, 9999px)',
              backgroundColor: 'rgba(29, 185, 84, 0.12)',
              color: 'var(--color-primary, #1DB954)',
              border: '1px solid rgba(29, 185, 84, 0.3)',
              lineHeight: 1.2,
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}>
              Beta Test
            </span>
          </div>

          {/* Desktop Navigation Links (Centered) */}
          {isAuthenticated && (
            <nav className="desktop-only-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className={`btn btn-sm ${currentTab === 'dashboard' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => onNavigate('dashboard')}
              >
                <Flame size={16} />
                <span>Main</span>
              </button>

              <button
                className={`btn btn-sm ${currentTab === 'leaderboard' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => onNavigate('leaderboard')}
              >
                <Trophy size={16} />
                <span>Rank</span>
              </button>

              <button
                className={`btn btn-sm ${currentTab === 'friends' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => onNavigate('friends')}
              >
                <Users size={16} />
                <span>Teman</span>
              </button>

              <button
                className={`btn btn-sm ${currentTab === 'profile' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => onNavigate('profile')}
              >
                <User size={16} />
                <span>Profil</span>
              </button>
            </nav>
          )}

          {/* Right Controls: Notifications & User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                {/* Notification Bell Button (Visible on both Mobile & Desktop) */}
                <button
                  onClick={onOpenNotifications}
                  className="btn btn-ghost btn-sm"
                  title="Notifikasi"
                  style={{
                    position: 'relative',
                    padding: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-bright)'
                  }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
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
                </button>

                {/* Profile Pill */}
                <div 
                  onClick={() => onNavigate('profile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '3px 8px 3px 4px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
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
                  <span className="desktop-only-nav" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-bright)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName?.split(' ')[0]}
                  </span>
                  <span className="badge badge-green desktop-only-nav" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                    {user.bestScore || 0} pts
                  </span>
                </div>

                {/* Logout Button (Desktop) */}
                <button
                  onClick={logout}
                  className="btn btn-ghost btn-sm desktop-only-nav"
                  title="Keluar"
                  style={{ padding: '6px', minWidth: 'auto' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('login')}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Bottom Navigation Pill (Mobile Only) */}
      {isAuthenticated && (
        <nav className="bottom-nav-floating" aria-label="Mobile Bottom Navigation">
          <button
            className={`floating-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <Flame size={20} />
            <span>Main</span>
          </button>

          <button
            className={`floating-nav-item ${currentTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => onNavigate('leaderboard')}
          >
            <Trophy size={20} />
            <span>Rank</span>
          </button>

          <button
            className={`floating-nav-item ${currentTab === 'friends' ? 'active' : ''}`}
            onClick={() => onNavigate('friends')}
          >
            <Users size={20} />
            <span>Teman</span>
          </button>

          <button
            className={`floating-nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => onNavigate('profile')}
          >
            <User size={20} />
            <span>Profil</span>
          </button>
        </nav>
      )}
    </>
  );
}

export default Navbar;
