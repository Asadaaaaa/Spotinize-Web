import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, Play, LogOut, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import FriendInviteModal from '../../components/FriendInviteModal.jsx';
import Avatar from '../../components/Avatar.jsx';
import socketService from '../../services/socket.js';
import ApiClient from '../../services/api.js';
import { useLanguage } from '../../hooks/useLanguage.jsx';

export function RoomLobbyPage({ initialGame, user, onGameStarted, onLeave }) {
  const { tx, tCategory } = useLanguage();
  const [game, setGame] = useState(initialGame);
  const [players, setPlayers] = useState(initialGame?.leaderboard || []);
  const [copied, setCopied] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [togglingReady, setTogglingReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setGame(initialGame);
    setPlayers(initialGame?.leaderboard || []);
  }, [initialGame]);

  const isHost = game?.hostId === user?.id;

  // Sync my ready state from player list
  useEffect(() => {
    const me = players.find(p => p.userId === user?.id);
    if (me && !isHost) {
      setIsReady(!!me.isReady);
    }
  }, [players, user?.id, isHost]);

  useEffect(() => {
    if (!game?.id || !user?.id) return;
    const socket = socketService.getSocket();

    const joinLobbyRoom = () => {
      socket.emit('game:join_room', { gameId: game.id });
    };

    joinLobbyRoom();

    const handleSocketConnect = async () => {
      joinLobbyRoom();
      try {
        const fresh = await ApiClient.get(`/game/${game.id}`);
        if (fresh.status === 'PLAYING') {
          onGameStarted(game.id);
          return;
        }
        setGame(fresh);
        if (Array.isArray(fresh.leaderboard)) {
          setPlayers(fresh.leaderboard);
        }
      } catch (e) {}
    };

    const handleLobbyUpdate = ({ players: updatedPlayers, hostId, status }) => {
      if (Array.isArray(updatedPlayers)) {
        setPlayers(updatedPlayers);
      }
      if (hostId || status) {
        setGame(prev => prev ? {
          ...prev,
          ...(hostId ? { hostId } : {}),
          ...(status ? { status } : {})
        } : prev);
      }
    };

    const handlePlayerLeft = ({ userId: leftUserId }) => {
      if (!leftUserId) return;
      setPlayers(prev => prev.filter(p => p.userId !== leftUserId));
    };

    const handleGameStarted = () => {
      onGameStarted(game.id);
    };

    const handleSocketError = ({ message }) => {
      if (message) setError(message);
      setStarting(false);
    };

    socket.on('connect', handleSocketConnect);
    socket.on('lobby:update', handleLobbyUpdate);
    socket.on('player:left', handlePlayerLeft);
    socket.on('game:started', handleGameStarted);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('lobby:update', handleLobbyUpdate);
      socket.off('player:left', handlePlayerLeft);
      socket.off('game:started', handleGameStarted);
      socket.off('error', handleSocketError);
    };
  }, [game?.id, user?.id, onGameStarted]);

  const copyCode = () => {
    navigator.clipboard.writeText(game.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    if (togglingReady) return;
    try {
      setTogglingReady(true);
      setError(null);
      const res = await ApiClient.post(`/game/${game.id}/ready`);
      if (res?.player) {
        setIsReady(!!res.player.isReady);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingReady(false);
    }
  };

  const nonHostPlayers = players.filter(p => !p.isHost);
  const totalNonHost = nonHostPlayers.length;
  const readyCount = nonHostPlayers.filter(p => p.isReady).length;
  const hasEnoughPlayers = players.length >= 2;
  const allReady = hasEnoughPlayers && nonHostPlayers.every(p => p.isReady);

  const handleStartGame = async () => {
    if (!hasEnoughPlayers) {
      setError(tx('At least 2 players are required to start a Multiplayer game!', 'Minimal 2 pemain diperlukan untuk memulai game Multiplayer!'));
      return;
    }
    if (!allReady) {
      setError(tx(`Waiting for all players to be ready (${readyCount}/${totalNonHost} Ready)`, `Menunggu semua pemain siap (${readyCount}/${totalNonHost} Siap)`));
      return;
    }

    try {
      setStarting(true);
      setError(null);
      await ApiClient.post(`/game/multiplayer/${game.id}/start`);
      onGameStarted(game.id);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    try {
      await ApiClient.post(`/game/${game.id}/leave`);
    } catch (e) {}
    try {
      const socket = socketService.getSocket();
      socket.emit('game:leave_room', { gameId: game.id });
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
            <h2 style={{ fontSize: '1.6rem' }}>{tx('Waiting Room', 'Ruang Tunggu')}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLeave} icon={<LogOut size={16} />}>
            {tx('Leave', 'Keluar')}
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
            {tx('Your Room Code', 'Kode Room Lo')}
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
              {copied ? tx('Copied!', 'Tersalin!') : tx('Copy Code', 'Salin Kode')}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              icon={<Users size={16} />}
            >
              {tx('Invite Friends', 'Ajak Teman')}
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
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{tx('Category', 'Kategori')}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tCategory(game?.category)}</div>
          </Card>
          <Card style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{tx('Song Count', 'Jumlah Lagu')}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{game?.numberOfSongs} {tx('Songs', 'Lagu')}</div>
          </Card>
          <Card style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{tx('Ready Status', 'Status Siap')}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: allReady ? 'var(--color-primary)' : 'var(--color-text-dim)' }}>
              {totalNonHost === 0 ? tx('Min. 2 Players', 'Min. 2 Pemain') : tx(`${readyCount}/${totalNonHost} Ready`, `${readyCount}/${totalNonHost} Siap`)}
            </div>
          </Card>
        </div>

        {/* Player List */}
        <div>
          <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            {tx('Player List', 'Daftar Pemain')} ({players.length})
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
                        {p.connectionStatus === 'DISCONNECTED' && (
                          <span className="badge badge-red" style={{ marginLeft: '6px', fontSize: '0.65rem', padding: '2px 6px' }}>
                            DC
                          </span>
                        )}
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
                        <Check size={12} /> {tx('READY', 'SIAP')}
                      </span>
                    ) : (
                      <span className="badge badge-gray">{tx('NOT READY', 'BELUM SIAP')}</span>
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
              disabled={togglingReady}
              onClick={handleToggleReady}
              icon={togglingReady ? <Loader2 className="spin" size={20} /> : <Check size={20} />}
              style={{ height: '54px', fontSize: '1.15rem' }}
            >
              {togglingReady
                ? tx('Saving...', 'Menyimpan...')
                : isReady
                  ? tx('Cancel Ready', 'Batal Siap (Cancel Ready)')
                  : tx("I'm Ready", 'Saya Siap (Ready)')}
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
                ? tx('Starting Game...', 'Memulai Game...')
                : !hasEnoughPlayers
                  ? tx('Waiting for Other Players...', 'Menunggu Pemain Lain...')
                  : !allReady
                    ? tx(`Waiting for Players Ready (${readyCount}/${totalNonHost})`, `Menunggu Pemain Siap (${readyCount}/${totalNonHost})`)
                    : tx(`Start Game (${players.length} Players Ready)`, `Mulai Game (${players.length} Pemain Siap)`)}
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
