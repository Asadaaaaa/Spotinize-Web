import React, { useState } from 'react';
import { Bell, X, Check, Play, UserPlus } from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';
import ApiClient from '../services/api.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function NotificationDrawer({ isOpen, onClose, notifications = [], onJoinRoom, onRefresh }) {
  const { lang, tx, tCategory } = useLanguage();
  const [handledMap, setHandledMap] = useState({});
  const [busyId, setBusyId] = useState(null);

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

  const handleFriendResponse = async (notif, action) => {
    try {
      setBusyId(notif.id);
      const endpoint = action === 'accept' ? '/friends/accept' : '/friends/reject';
      await ApiClient.post(endpoint, {
        requestId: notif.data?.requestId,
        requesterId: notif.senderId || notif.data?.requesterId
      });
      await ApiClient.post(`/notifications/${notif.id}/read`).catch(() => {});
      setHandledMap(prev => ({
        ...prev,
        [notif.id]: action === 'accept' ? 'ACCEPTED' : 'REJECTED'
      }));
      if (onRefresh) onRefresh();
    } catch (e) {
      await ApiClient.post(`/notifications/${notif.id}/read`).catch(() => {});
      if (onRefresh) onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleFollowBack = async (notif) => {
    const targetId = notif.senderId || notif.data?.followerId;
    if (!targetId) return;
    try {
      setBusyId(notif.id);
      await ApiClient.post(`/follows/${targetId}`);
      await ApiClient.post(`/notifications/${notif.id}/read`).catch(() => {});
      setHandledMap(prev => ({ ...prev, [notif.id]: 'FOLLOWED_BACK' }));
      if (onRefresh) onRefresh();
    } catch (e) {
      await ApiClient.post(`/notifications/${notif.id}/read`).catch(() => {});
      if (onRefresh) onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diffSeconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSeconds < 60) return tx('Just now', 'Baru saja');
    if (diffSeconds < 3600) return tx(`${Math.floor(diffSeconds / 60)}m ago`, `${Math.floor(diffSeconds / 60)}m lalu`);
    if (diffSeconds < 86400) return tx(`${Math.floor(diffSeconds / 3600)}h ago`, `${Math.floor(diffSeconds / 3600)}j lalu`);
    return new Date(dateStr).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{tx('Notifications', 'Notifikasi')}</h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--color-text-dim)' }}
              >
                {tx('Mark All Read', 'Baca Semua')}
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
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{tx('No notifications yet', 'Belum ada notifikasi')}</p>
              <span style={{ fontSize: '0.8rem' }}>{tx('Game invites and friend requests will appear here.', 'Undangan main dan permintaan teman akan muncul di sini.')}</span>
            </div>
          ) : (
            notifications.map(notif => {
              const isInvite = notif.type === 'INVITE';
              const isFriendRequest = notif.type === 'FRIEND_REQUEST';
              const isNewFollower = notif.type === 'NEW_FOLLOWER';
              const handledStatus = handledMap[notif.id];
              const senderName = notif.sender?.displayName || notif.data?.hostName || notif.data?.followerName || notif.data?.requesterName || notif.data?.accepterName || tx('Player', 'Pemain');
              let displayTitle = notif.title;
              let displayMessage = notif.message;
              if (lang === 'en') {
                if (notif.type === 'INVITE') {
                  displayTitle = 'Game Invite';
                  displayMessage = `${senderName} invited you to play in Room ${notif.data?.roomCode || ''} (${tCategory(notif.data?.category || 'Global Trends')})`;
                } else if (notif.type === 'NEW_FOLLOWER') {
                  displayTitle = notif.data?.isMutual ? 'New Mutual Friend!' : 'New Follower';
                  displayMessage = notif.data?.isMutual
                    ? `${senderName} followed you back — you are now Mutual!`
                    : `${senderName} started following you on Spotinize.`;
                } else if (notif.type === 'FRIEND_REQUEST') {
                  displayTitle = 'Friend Request';
                  displayMessage = `${senderName} wants to add you as a friend`;
                } else if (notif.type === 'FRIEND_ACCEPTED') {
                  displayTitle = 'Friend Request Accepted';
                  displayMessage = `${senderName} accepted your friend request`;
                }
              }

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
                      src={notif.sender?.avatarUrl || notif.data?.hostAvatar || notif.data?.requesterAvatar}
                      alt={notif.sender?.displayName || notif.data?.hostName || notif.data?.requesterName}
                      size="sm"
                      seed={notif.senderId || notif.title}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-bright)' }}>
                          {displayTitle}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', flexShrink: 0 }}>
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                        {displayMessage}
                      </p>
                    </div>
                  </div>

                  {/* Room invite quick action */}
                  {isInvite && notif.data?.roomCode && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcceptInvite(notif)}
                        icon={<Play size={14} fill="#000" />}
                        style={{ height: '32px', fontSize: '0.8rem' }}
                      >
                        {tx('Join Room', 'Gabung Room')} [{notif.data.roomCode}]
                      </Button>
                    </div>
                  )}

                  {/* New Follower quick Follow Back */}
                  {isNewFollower && !notif.data?.isMutual && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      {handledStatus === 'FOLLOWED_BACK' ? (
                        <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>{tx('Mutual ✓', 'Mutual ✓')}</span>
                      ) : !notif.isRead ? (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={busyId === notif.id}
                          onClick={() => handleFollowBack(notif)}
                          icon={<UserPlus size={14} />}
                          style={{ height: '32px', fontSize: '0.8rem' }}
                        >
                          {tx('Follow Back', 'Follow Back')}
                        </Button>
                      ) : null}
                    </div>
                  )}

                  {/* Friend request quick accept / reject */}
                  {isFriendRequest && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      {handledStatus === 'ACCEPTED' ? (
                        <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>{tx('Request accepted ✓', 'Permintaan diterima ✓')}</span>
                      ) : handledStatus === 'REJECTED' ? (
                        <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>{tx('Request declined', 'Permintaan ditolak')}</span>
                      ) : !notif.isRead ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busyId === notif.id}
                            onClick={() => handleFriendResponse(notif, 'accept')}
                            icon={<Check size={14} />}
                            style={{ height: '32px', fontSize: '0.8rem' }}
                          >
                            {tx('Accept', 'Terima')}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busyId === notif.id}
                            onClick={() => handleFriendResponse(notif, 'reject')}
                            icon={<X size={14} />}
                            style={{ height: '32px', fontSize: '0.8rem' }}
                          >
                            {tx('Decline', 'Tolak')}
                          </Button>
                        </>
                      ) : null}
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
