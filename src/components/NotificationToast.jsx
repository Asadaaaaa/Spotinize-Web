import React from 'react';
import { Play, X, Sparkles, Users } from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';

export function NotificationToast({ invite, onAccept, onDecline }) {
  if (!invite) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      maxWidth: '380px',
      width: 'calc(100vw - 40px)',
      backgroundColor: 'var(--color-bg-alt)',
      border: '2px solid var(--color-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(29, 185, 84, 0.25)',
      animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar
            src={invite.hostAvatar}
            alt={invite.hostName}
            size="sm"
            seed={invite.hostId || invite.hostName}
          />
          <div>
            <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '2px 6px', marginBottom: '2px' }}>
              <Users size={10} /> Undangan Mabar
            </span>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-bright)' }}>
              {invite.hostName}
            </div>
          </div>
        </div>

        <button 
          onClick={onDecline}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px', color: 'var(--color-text-dim)' }}
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px', marginBottom: '12px' }}>
        Mengajak kamu bermain di Room <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>[{invite.roomCode}]</strong> ({invite.category || 'Global Trends'})!
      </p>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => onAccept(invite.roomCode)}
          icon={<Play size={14} fill="#000" />}
          style={{ height: '36px', fontWeight: 800 }}
        >
          Terima & Main
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onDecline}
          style={{ height: '36px' }}
        >
          Tolak
        </Button>
      </div>
    </div>
  );
}

export default NotificationToast;
