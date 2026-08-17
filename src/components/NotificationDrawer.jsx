import React from 'react';
import { Bell, X, Check, Play, Sparkles, Clock, Trash2 } from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';
import ApiClient from '../services/api.js';

export function NotificationDrawer({ isOpen, onClose, notifications = [], onJoinRoom, onRefresh }) {
  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.post('/notifications/read-all');
      if (onRefresh) onRefresh();
    } catch (e) {}
  };

  const handleAcceptInvite = async (notif) => {
    try {
      await ApiClient.post(`/notifications/${notif.id}/read`);
      if (notif.data?.roomCode) {
        onClose();
        if (onJoinRoom) {
          onJoinRoom(notif.data.roomCode);
        }
      }
    } catch (e) {}
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diffSeconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSeconds < 60) return 'Baru saja';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m lalu`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}j lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '440px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Notifikasi</h3>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {notifications.length > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                className="btn btn-ghost btn-sm" 
                style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--color-text-dim)' }}
              >
                Baca Semua
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--color-text-dim)' }}>
              <Bell size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Belum ada notifikasi</p>
              <span style={{ fontSize: '0.8rem' }}>Undangan main dari teman akan muncul di sini.</span>
            </div>
          ) : (
            notifications.map(notif => {
              const isInvite = notif.type === 'INVITE';
              return (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: notif.isRead ? 'var(--color-surface)' : 'rgba(29, 185, 84, 0.08)',
                    border: notif.isRead ? '1px solid var(--color-border)' : '1px solid rgba(29, 185, 84, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Avatar 
                      src={notif.sender?.avatarUrl || notif.data?.hostAvatar} 
                      alt={notif.sender?.displayName || notif.data?.hostName}
                      size="sm"
                      seed={notif.senderId || notif.title}
                    />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-bright)' }}>
                          {notif.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', flexShrink: 0 }}>
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* If room invite, show Quick Action Button */}
                  {isInvite && notif.data?.roomCode && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcceptInvite(notif)}
                        icon={<Play size={14} fill="#000" />}
                        style={{ height: '32px', fontSize: '0.8rem' }}
                      >
                        Gabung Room [{notif.data.roomCode}]
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationDrawer;
