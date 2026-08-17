import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, Play, LogOut, Share2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import FriendInviteModal from '../../components/FriendInviteModal.jsx';
import Avatar from '../../components/Avatar.jsx';
import socketService from '../../services/socket.js';
import ApiClient from '../../services/api.js';

export function RoomLobbyPage({ initialGame, user, onGameStarted, onLeave }) {
  const [game, setGame] = useState(initialGame);
  const [players, setPlayers] = useState(initialGame.leaderboard || []);
  const [copied, setCopied] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const isHost = game?.hostId === user?.id;

  // Sync my ready state from player list
  useEffect(() => {
    const me = players.find(p => p.userId === user?.id);
    if (me && !isHost) {
      setIsReady(!!me.isReady);
    }
  }, [players, user?.id, isHost]);

  useEffect(() => {
    if (!game?.id) return;
    const socket = socketService.getSocket();

    socket.emit('game:join_room', { gameId: game.id, userId: user.id });

    const handleLobbyUpdate = ({ players: updatedPlayers }) => {
      if (updatedPlayers && Array.isArray(updatedPlayers)) {
        setPlayers(updatedPlayers);
      }
    };

    const handleGameStarted = () => {
      onGameStarted(game.id);
    };

    const handleSocketError = ({ message }) => {
      setError(message);
      setStarting(false);
    };

    socket.on('lobby:update', handleLobbyUpdate);
    socket.on('game:player_joined', handleLobbyUpdate);
    socket.on('game:started', handleGameStarted);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('lobby:update', handleLobbyUpdate);
      socket.off('game:player_joined', handleLobbyUpdate);
      socket.off('game:started', handleGameStarted);
      socket.off('error', handleSocketError);
    };
  }, [game?.id, user?.id, onGameStarted]);

  const copyCode = () => {
    navigator.clipboard.writeText(game.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    try {
      const socket = socketService.getSocket();
      socket.emit('player:ready', { gameId: game.id, userId: user.id });
    } catch (e) {}
  };

  const nonHostPlayers = players.filter(p => !p.isHost);
  const totalNonHost = nonHostPlayers.length;
  const readyCount = nonHostPlayers.filter(p => p.isReady).length;
  const allReady = totalNonHost === 0 || nonHostPlayers.every(p => p.isReady);

  const handleStartGame = async () => {
    if (!allReady && totalNonHost > 0) {
      setError(`Menunggu semua pemain siap (${readyCount}/${totalNonHost} Siap)`);
      return;
    }

    try {
      setStarting(true);
      setError(null);
      
      // Emit socket event to start multiplayer game and broadcast to all room members
      const socket = socketService.getSocket();
      socket.emit('game:start', { gameId: game.id, hostId: user.id });
      
      // Fallback: also trigger HTTP start if socket is transitioning
      try {
        await ApiClient.post(`/game/multiplayer/${game.id}/start`, { userId: user.id });
      } catch (err) {
        // If already started via socket, ignore error
      }
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    try {
      await ApiClient.post(`/game/${game.id}/leave`, { userId: user.id });
      const socket = socketService.getSocket();
      socket.emit('game:leave', { gameId: game.id, userId: user.id });
    } catch (e) {}
    onLeave();
  };

  return (
    <div className="container-narrow" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '6px' }}>
              <Sparkles size={12} /> Multiplayer Lobby
            </span>
            <h2 style={{ fontSize: '1.6rem' }}>Ruang Tunggu</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLeave} icon={<LogOut size={16} />}>
            Keluar
          </Button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 68, 68, 0.15)',
            border: '1px solid var(--color-error)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Room Code Card */}
        <Card style={{
          backgroundColor: 'var(--color-bg-alt)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Kode Room Lo
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2.8rem',
            fontWeight: 900,
            letterSpacing: '0.18em',
            color: 'var(--color-primary)'
          }}>
            {game?.roomCode}
          </span>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={copyCode}
              icon={copied ? <Check size={16} color="var(--color-primary)" /> : <Copy size={16} />}
            >
              {copied ? 'Tersalin!' : 'Salin Kode'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              icon={<Users size={16} />}
            >
              Ajak Teman Spotify
            </Button>
          </div>
        </Card>

        {/* Game Config Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          textAlign: 'center'
        }}>
          <Card style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Kategori</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{game?.category}</div>
          </Card>
          <Card style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Jumlah Lagu</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{game?.numberOfSongs} Lagu</div>
          </Card>
          <Card style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Status Siap</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: allReady ? 'var(--color-primary)' : 'var(--color-text-dim)' }}>
              {totalNonHost === 0 ? 'Siap Main' : `${readyCount}/${totalNonHost} Siap`}
            </div>
          </Card>
        </div>

        {/* Player List */}
        <div>
          <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Daftar Pemain ({players.length})
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {players.map((p) => {
              const isMe = p.userId === user.id;
              return (
                <div
                  key={p.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar
                      src={p.avatarUrl}
                      alt={p.displayName}
                      size="sm"
                      seed={p.userId || p.displayName}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {p.displayName} {isMe && '(You)'}
                      </div>
                      {p.isHost && (
                        <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          Host Room
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {p.isHost ? (
                      <span className="badge badge-green">Host</span>
                    ) : p.isReady ? (
                      <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> SIAP
                      </span>
                    ) : (
                      <span className="badge badge-gray">BELUM SIAP</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          {!isHost && (
            <Button
              variant={isReady ? 'secondary' : 'primary'}
              size="lg"
              fullWidth
              onClick={handleToggleReady}
              icon={<Check size={20} />}
              style={{ height: '54px', fontSize: '1.15rem' }}
            >
              {isReady ? 'Batal Siap (Cancel Ready)' : 'Saya Siap (Ready)'}
            </Button>
          )}

          {isHost && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!allReady || starting}
              onClick={handleStartGame}
              icon={starting ? <Loader2 className="spin" size={20} /> : <Play size={20} fill="#000" />}
              style={{
                height: '54px',
                fontSize: '1.15rem',
                opacity: !allReady ? 0.6 : 1,
                cursor: !allReady ? 'not-allowed' : 'pointer'
              }}
            >
              {starting
                ? 'Memulai Game...'
                : totalNonHost === 0
                  ? 'Mulai Game'
                  : !allReady
                    ? `Menunggu Pemain Siap (${readyCount}/${totalNonHost})`
                    : `Mulai Game (${players.length} Pemain Siap)`}
            </Button>
          )}
        </div>
      </div>

      <FriendInviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomCode={game?.roomCode}
        gameId={game?.id}
        category={game?.category}
        user={user}
      />
    </div>
  );
}

export default RoomLobbyPage;
