import React, { useState } from 'react';
import { Bell, X, Check, Play, UserPlus, CheckCheck } from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';
import ApiClient from '../services/api.js';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onJoinRoom,
  onOpenPublicProfile,
  onNavigate,
  onMarkReadLocal,
  onRefresh
}) {
  const { lang, tx, tCategory } = useLanguage();
  const [handledMap, setHandledMap] = useState({});
  const [busyId, setBusyId] = useState(null);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markSingleRead = async (notifId) => {
    if (!notifId) return;
    onMarkReadLocal?.(notifId);
    try {
      await ApiClient.post(`/notifications/${notifId}/read`);
      onRefresh?.();
    } catch (_) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    onMarkReadLocal?.('ALL');
    try {
      await ApiClient.post('/notifications/read-all');
      onRefresh?.();
    } catch (_) {
      // ignore
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      markSingleRead(notif.id);
    }

    const senderUsername =
      notif.sender?.username ||
      notif.data?.followerUsername ||
      notif.data?.requesterUsername ||
      notif.data?.challengerUsername ||
      null;

    if (notif.type === 'INVITE' && notif.data?.roomCode) {
      onClose();
      onJoinRoom?.(notif.data.roomCode);
      return;
    }

    if (['NEW_FOLLOWER', 'FRIEND_REQUEST', 'FRIEND_ACCEPTED'].includes(notif.type)) {
      onClose();
      if (senderUsername && onOpenPublicProfile) {
        onOpenPublicProfile(senderUsername);
      } else {
        onNavigate?.('friends');
      }
      return;
    }

    if (['REVENGE_CHALLENGE', 'RANKED_DUEL_INVITE'].includes(notif.type)) {
      onClose();
      if (senderUsername && onOpenPublicProfile) {
        onOpenPublicProfile(senderUsername);
      } else {
        onNavigate?.('leaderboard');
      }
      return;
    }

    if (['POST_COMMENT', 'POST_REACTION'].includes(notif.type)) {
      onClose();
      if (senderUsername && onOpenPublicProfile) {
        onOpenPublicProfile(senderUsername);
      } else {
        onNavigate?.('dashboard');
      }
    }
  };

  const handleAcceptInvite = async (e, notif) => {
    e.stopPropagation();
    if (!notif.isRead) {
      await markSingleRead(notif.id);
    }
    if (notif.data?.roomCode) {
      onClose();
      onJoinRoom?.(notif.data.roomCode);
    }
  };

  const handleFriendResponse = async (e, notif, action) => {
    e.stopPropagation();
    try {
      setBusyId(notif.id);
      const endpoint = action === 'accept' ? '/friends/accept' : '/friends/reject';
      await ApiClient.post(endpoint, {
        requestId: notif.data?.requestId,
        requesterId: notif.senderId || notif.data?.requesterId
      });
      await markSingleRead(notif.id);
      setHandledMap(prev => ({
        ...prev,
        [notif.id]: action === 'accept' ? 'ACCEPTED' : 'REJECTED'
      }));
    } catch (_) {
      await markSingleRead(notif.id);
    } finally {
      setBusyId(null);
    }
  };

  const handleFollowBack = async (e, notif) => {
    e.stopPropagation();
    const targetId = notif.senderId || notif.data?.followerId;
    if (!targetId) return;
    try {
      setBusyId(notif.id);
      await ApiClient.post(`/follows/${targetId}`);
      await markSingleRead(notif.id);
      setHandledMap(prev => ({ ...prev, [notif.id]: 'FOLLOWED_BACK' }));
    } catch (_) {
      await markSingleRead(notif.id);
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
        style={{
          maxWidth: '440px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#111116',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px',
          padding: '18px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: 'rgba(29, 185, 84, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <Bell size={17} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>{tx('Notifications', 'Notifikasi')}</h3>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(29,185,84,0.16)',
                  color: 'var(--color-primary)'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.74rem', padding: '5px 9px', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckCheck size={14} />
                <span>{tx('Mark all read', 'Baca semua')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: '#16161e',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px 16px', color: 'var(--color-text-dim)' }}>
              <Bell size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0 }}>{tx('No notifications yet', 'Belum ada notifikasi')}</p>
              <span style={{ fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                {tx('Game invites and activity will appear here.', 'Undangan main dan aktivitas akan muncul di sini.')}
              </span>
            </div>
          ) : (
            notifications.map(notif => {
              const isInvite = notif.type === 'INVITE';
              const isFriendRequest = notif.type === 'FRIEND_REQUEST';
              const isNewFollower = notif.type === 'NEW_FOLLOWER';
              const handledStatus = handledMap[notif.id];
              const senderName =
                notif.sender?.displayName ||
                notif.data?.hostName ||
                notif.data?.followerName ||
                notif.data?.requesterName ||
                notif.data?.accepterName ||
                tx('Player', 'Pemain');

              let displayTitle = notif.title;
              let displayMessage = notif.message;
              if (lang === 'en') {
                if (notif.type === 'INVITE') {
                  displayTitle = 'Game Invite';
                  displayMessage = `${senderName} invited you to play in Room ${notif.data?.roomCode || ''} (${tCategory(notif.data?.category || 'Global Trends')})`;
                } else if (notif.type === 'NEW_FOLLOWER') {
                  displayTitle = notif.data?.isMutual ? 'New Mutual Friend' : 'New Follower';
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
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notif)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notif);
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px 13px',
                    borderRadius: '14px',
                    backgroundColor: notif.isRead ? '#14141a' : 'rgba(29, 185, 84, 0.08)',
                    border: notif.isRead ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(29, 185, 84, 0.32)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar
                        src={notif.sender?.avatarUrl || notif.data?.hostAvatar || notif.data?.requesterAvatar}
                        alt={senderName}
                        size="sm"
                        seed={notif.senderId || notif.title}
                      />
                      {!notif.isRead && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-1px',
                            right: '-1px',
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            border: '2px solid #111116'
                          }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontWeight: notif.isRead ? 700 : 800,
                          fontSize: '0.86rem',
                          color: notif.isRead ? 'var(--color-text-muted)' : 'var(--color-text-bright)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {displayTitle}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>
                            {formatTime(notif.createdAt)}
                          </span>
                          {!notif.isRead && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markSingleRead(notif.id);
                              }}
                              title={tx('Mark as read', 'Tandai dibaca')}
                              aria-label={tx('Mark as read', 'Tandai dibaca')}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: '#181820',
                                color: 'var(--color-primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Check size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      <p style={{
                        fontSize: '0.78rem',
                        color: notif.isRead ? 'var(--color-text-dim)' : 'var(--color-text-muted)',
                        marginTop: '3px',
                        lineHeight: 1.4,
                        marginBottom: 0
                      }}>
                        {displayMessage}
                      </p>
                    </div>
                  </div>

                  {/* Room invite quick action */}
                  {isInvite && notif.data?.roomCode && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => handleAcceptInvite(e, notif)}
                        icon={<Play size={13} fill="#000" />}
                        style={{ height: '30px', fontSize: '0.76rem' }}
                      >
                        {tx('Join Room', 'Gabung Room')} [{notif.data.roomCode}]
                      </Button>
                    </div>
                  )}

                  {/* New Follower quick Follow Back */}
                  {isNewFollower && !notif.data?.isMutual && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
                      {handledStatus === 'FOLLOWED_BACK' ? (
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={13} /> Mutual
                        </span>
                      ) : !notif.isRead ? (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={busyId === notif.id}
                          onClick={(e) => handleFollowBack(e, notif)}
                          icon={<UserPlus size={13} />}
                          style={{ height: '30px', fontSize: '0.76rem' }}
                        >
                          {tx('Follow Back', 'Follow Back')}
                        </Button>
                      ) : null}
                    </div>
                  )}

                  {/* Friend request quick accept / reject */}
                  {isFriendRequest && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
                      {handledStatus === 'ACCEPTED' ? (
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={13} /> {tx('Request accepted', 'Permintaan diterima')}
                        </span>
                      ) : handledStatus === 'REJECTED' ? (
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>
                          {tx('Request declined', 'Permintaan ditolak')}
                        </span>
                      ) : !notif.isRead ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busyId === notif.id}
                            onClick={(e) => handleFriendResponse(e, notif, 'accept')}
                            icon={<Check size={13} />}
                            style={{ height: '30px', fontSize: '0.76rem' }}
                          >
                            {tx('Accept', 'Terima')}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busyId === notif.id}
                            onClick={(e) => handleFriendResponse(e, notif, 'reject')}
                            icon={<X size={13} />}
                            style={{ height: '30px', fontSize: '0.76rem' }}
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
