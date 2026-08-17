import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Users, Send, Loader2 } from 'lucide-react';
import ApiClient from '../services/api.js';
import socketService from '../services/socket.js';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';

export function FriendInviteModal({ isOpen, onClose, roomCode, gameId, user, category = 'Global Trends' }) {
  const [friends, setFriends] = useState([]);
  const [copied, setCopied] = useState(false);
  const [invitedMap, setInvitedMap] = useState({});
  const [sendingMap, setSendingMap] = useState({});

  useEffect(() => {
    if (isOpen && user?.id) {
      ApiClient.get(`/friends/${user.id}`)
        .then(res => setFriends(res.friends || []))
        .catch(() => {});
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteFriend = async (friend) => {
    try {
      setSendingMap(prev => ({ ...prev, [friend.id]: true }));

      // 1. Send HTTP notification to backend DB
      await ApiClient.post('/notifications/invite', {
        targetUserId: friend.id,
        roomCode,
        gameId
      });

      // 2. Emit instant WebSocket invitation to friend's personal channel
      const socket = socketService.getSocket();
      socket.emit('invite:send', {
        targetUserId: friend.id,
        roomCode,
        gameId,
        hostId: user.id,
        hostName: user.displayName,
        hostAvatar: user.avatarUrl,
        category
      });

      setInvitedMap(prev => ({ ...prev, [friend.id]: true }));
    } catch (err) {
      console.error('Invite failed:', err);
    } finally {
      setSendingMap(prev => ({ ...prev, [friend.id]: false }));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--color-primary)" />
            Ajak Teman Main
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Room Code Share Banner */}
        <div style={{
          backgroundColor: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kode Room Multiplayer
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2.2rem',
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: 'var(--color-primary)'
          }}>
            {roomCode}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={copyRoomCode}
            icon={copied ? <Check size={16} color="var(--color-primary)" /> : <Copy size={16} />}
          >
            {copied ? 'Kode Tersalin!' : 'Salin Kode Room'}
          </Button>
        </div>

        {/* Mutual Friends list */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Pemain & Teman Terdaftar
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
            Kirim undangan instan
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', maxHeight: '240px', overflowY: 'auto' }}>
          {friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-dim)' }}>
              Belum ada pemain lain yang online. Bagikan kode di atas!
            </div>
          ) : (
            friends.map(friend => (
              <div
                key={friend.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <Avatar src={friend.avatarUrl} alt={friend.displayName} size="sm" seed={friend.id || friend.displayName} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {friend.displayName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: friend.isOnline ? 'var(--color-primary)' : 'var(--color-text-dim)'
                      }} />
                      <span style={{ color: friend.isOnline ? 'var(--color-primary)' : 'var(--color-text-dim)' }}>
                        {friend.isOnline ? 'Aktif' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant={invitedMap[friend.id] ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={invitedMap[friend.id] || sendingMap[friend.id]}
                  onClick={() => inviteFriend(friend)}
                  icon={
                    sendingMap[friend.id] ? <Loader2 className="spin" size={14} /> :
                    invitedMap[friend.id] ? <Check size={14} color="var(--color-primary)" /> : 
                    <Send size={14} />
                  }
                >
                  {sendingMap[friend.id] ? 'Mengirim...' : invitedMap[friend.id] ? 'Terkirim ✓' : 'Undang'}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FriendInviteModal;
