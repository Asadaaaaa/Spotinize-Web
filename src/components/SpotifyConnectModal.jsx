import React, { useState } from 'react';
import { Music2, ArrowRight, Sparkles, LogOut, CheckCircle2, ShieldCheck } from 'lucide-react';
import Button from './Button.jsx';
import Avatar from './Avatar.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';

export function SpotifyConnectModal({ isOpen, user, onConnected }) {
  const { connectSpotify, logout } = useAuth();
  const { tx } = useLanguage();
  const [connecting, setConnecting] = useState(false);

  if (!isOpen || !user) return null;

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connectSpotify(user.id);
    } catch (err) {
      console.error('Failed to connect Spotify:', err);
      setConnecting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        style={{
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '20px',
          padding: '32px 24px'
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(29, 185, 84, 0.4)'
        }}>
          <Music2 size={36} color="#000" />
        </div>

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="badge badge-green">
              <Sparkles size={12} /> {tx('Final Step', 'Langkah Terakhir')}
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '6px' }}>
            {tx('Connect Spotify Account', 'Hubungkan Akun Spotify')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            {tx('Hi', 'Halo')} <strong>@{user.username}</strong>! {tx('To start guessing songs and record your global ranking, please connect your Spotify account.', 'Untuk memulai permainan tebak lagu dan mencatat ranking global, silakan hubungkan akun Spotify Anda.')}
          </p>
        </div>

        <div style={{
          width: '100%',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          textAlign: 'left',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text)' }}>
            <CheckCircle2 size={18} color="var(--color-primary)" />
            <span>{tx('Sync official Spotify song catalog', 'Sinkronisasi katalog lagu resmi Spotify')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text)' }}>
            <CheckCircle2 size={18} color="var(--color-primary)" />
            <span>{tx('Access multiplayer mode & song guessing duels', 'Akses mode multiplayer & duel tebak lagu')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text)' }}>
            <ShieldCheck size={18} color="var(--color-primary)" />
            <span>{tx('Permanent score stats on Global Leaderboard', 'Statistik skor permanen di Global Leaderboard')}</span>
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={connecting}
            onClick={handleConnect}
            icon={<Music2 size={20} color="#000" />}
            style={{ height: '52px', fontSize: '1.05rem', fontWeight: 800 }}
          >
            {connecting ? tx('Opening Spotify...', 'Membuka Spotify...') : tx('Connect Spotify Now', 'Hubungkan Spotify Sekarang')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            icon={<LogOut size={16} />}
            style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}
          >
            {tx('Log Out / Switch Account', 'Keluar / Ganti Akun')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SpotifyConnectModal;
