import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Play, Sparkles, Search, UserCheck, Trophy,
  Loader2, Check, X, Clock, UserMinus, Inbox, Send, AlertCircle
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Avatar from '../../components/Avatar.jsx';
import ApiClient from '../../services/api.js';
import socketService from '../../services/socket.js';
import { useDialog } from '../../hooks/useDialog.jsx';

export function FriendsPage({ user, onStartMultiplayerWithFriend, onOpenPublicProfile }) {
  const { showConfirm } = useDialog();
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'incoming' | 'outgoing'

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyIds, setBusyIds] = useState({});
  const [feedback, setFeedback] = useState(null);

  const loadFriends = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    try {
      const res = await ApiClient.get('/friends');
      setFriends(res.friends || []);
      setIncomingRequests(res.incomingRequests || []);
      setOutgoingRequests(res.outgoingRequests || []);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await ApiClient.get(`/friends/search?q=${encodeURIComponent(trimmed)}`);
      setSearchResults(res.players || []);
    } catch (err) {
      console.error('Friend search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Real-time friend request / accept updates via Socket.IO
  useEffect(() => {
    if (!user?.id) return;
    const socket = socketService.getSocket();

    const handleRealtimeRefresh = () => {
      loadFriends(true);
      if (searchQuery.trim()) {
        runSearch(searchQuery);
      }
    };

    socket.on('friend:update', handleRealtimeRefresh);
    socket.on('notification:new', handleRealtimeRefresh);

    return () => {
      socket.off('friend:update', handleRealtimeRefresh);
      socket.off('notification:new', handleRealtimeRefresh);
    };
  }, [user?.id, loadFriends, runSearch, searchQuery]);

  // Live search registered players
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      runSearch(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const setBusy = (key, value) => {
    setBusyIds(prev => ({ ...prev, [key]: value }));
  };

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const refreshAll = async () => {
    await loadFriends(true);
    if (searchQuery.trim()) {
      await runSearch(searchQuery);
    }
  };

  const handleSendRequest = async (player) => {
    try {
      setBusy(player.id, true);
      const res = await ApiClient.post('/friends/request', { friendId: player.id });
      await refreshAll();
      if (res.action === 'AUTO_ACCEPTED') {
        showFeedback('success', `${player.displayName} sudah mengirim permintaan juga — kalian sekarang berteman!`);
      } else if (res.action === 'ALREADY_SENT') {
        showFeedback('success', `Permintaan pertemanan ke ${player.displayName} sedang menunggu persetujuan.`);
      } else {
        showFeedback('success', `Permintaan pertemanan terkirim ke ${player.displayName}.`);
      }
    } catch (err) {
      showFeedback('error', err.message || 'Gagal mengirim permintaan pertemanan.');
    } finally {
      setBusy(player.id, false);
    }
  };

  const handleAccept = async ({ requestId, requesterId, displayName }) => {
    const key = requestId || requesterId;
    try {
      setBusy(key, true);
      await ApiClient.post('/friends/accept', { requestId, requesterId });
      await refreshAll();
      showFeedback('success', `${displayName || 'Pemain'} sekarang menjadi temanmu!`);
    } catch (err) {
      showFeedback('error', err.message || 'Gagal menerima permintaan pertemanan.');
    } finally {
      setBusy(key, false);
    }
  };

  const handleReject = async ({ requestId, requesterId }) => {
    const key = requestId || requesterId;
    try {
      setBusy(key, true);
      await ApiClient.post('/friends/reject', { requestId, requesterId });
      await refreshAll();
      showFeedback('success', 'Permintaan pertemanan ditolak.');
    } catch (err) {
      showFeedback('error', err.message || 'Gagal menolak permintaan pertemanan.');
    } finally {
      setBusy(key, false);
    }
  };

  const handleCancel = async ({ requestId, friendId }) => {
    const key = requestId || friendId;
    try {
      setBusy(key, true);
      await ApiClient.post('/friends/cancel', { requestId, friendId });
      await refreshAll();
      showFeedback('success', 'Permintaan pertemanan dibatalkan.');
    } catch (err) {
      showFeedback('error', err.message || 'Gagal membatalkan permintaan.');
    } finally {
      setBusy(key, false);
    }
  };

  const handleRemoveFriend = async (player) => {
    const confirmed = await showConfirm(`Hapus ${player.displayName} dari daftar teman?`, {
      title: 'Hapus Teman',
      variant: 'danger',
      confirmText: 'Hapus',
      cancelText: 'Batal'
    });
    if (!confirmed) return;
    try {
      setBusy(player.id, true);
      await ApiClient.post('/friends/remove', { friendId: player.id });
      await refreshAll();
      showFeedback('success', `${player.displayName} dihapus dari daftar teman.`);
    } catch (err) {
      showFeedback('error', err.message || 'Gagal menghapus teman.');
    } finally {
      setBusy(player.id, false);
    }
  };

  const handlePlayerClick = (username) => {
    if (onOpenPublicProfile && username) {
      onOpenPublicProfile(username);
    }
  };

  const renderPlayerSummary = (player) => (
    <div
      className="friend-card-profile"
      onClick={() => handlePlayerClick(player.username)}
      title={player.username ? `Buka profil /user/${player.username}` : ''}
      style={{ cursor: player.username ? 'pointer' : 'default' }}
    >
      <div className="friend-card-avatar-wrap">
        <Avatar
          src={player.avatarUrl}
          alt={player.displayName}
          seed={player.id || player.displayName}
          className="friend-card-avatar"
        />
        <span className={`friend-card-status-dot ${player.isOnline ? 'online' : ''}`} />
      </div>
      <div className="friend-card-info">
        <div className="friend-card-top">
          <div className="friend-card-name">{player.displayName}</div>
          <span className={`friend-card-status-pill ${player.isOnline ? 'online' : ''}`}>
            {player.isOnline ? 'Aktif' : 'Offline'}
          </span>
        </div>
        <div className="friend-card-meta">
          {player.username && (
            <span className="friend-card-username">
              @{player.username}
            </span>
          )}
          <span className="friend-card-stats">
            <span className="friend-card-stat">
              <Trophy size={11} color="var(--color-primary)" /> {player.bestScore || 0} pts
            </span>
            <span>• {player.gamesPlayed || 0} Games</span>
          </span>
        </div>
      </div>
    </div>
  );

  const isSearching = Boolean(searchQuery.trim());

  return (
    <div className="container-narrow mobile-page-container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '6px' }}>
              <Sparkles size={12} /> Sistem Pertemanan
            </span>
            <h2 style={{ fontSize: '1.6rem' }}>Teman</h2>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
          Cari pemain berdasarkan username untuk mengirim permintaan pertemanan. Setelah disetujui, kalian dapat saling mengajak duel langsung!
        </p>

        {feedback && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
            color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            fontSize: '0.88rem',
            fontWeight: 600,
            lineHeight: 1.4
          }}>
            {feedback.type === 'success'
              ? <Check size={16} style={{ flexShrink: 0 }} />
              : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Search Player Input */}
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }}
          />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '42px', paddingRight: '40px', fontSize: '0.95rem' }}
            placeholder="Cari username atau nama pemain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching ? (
            <Loader2
              size={18}
              className="spin"
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }}
            />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-dim)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {/* Search Results Mode */}
        {isSearching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Hasil Pencarian Pemain
            </span>

            {!searching && searchResults.length === 0 && (
              <Card style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)' }}>
                <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p>Pemain "{searchQuery.trim()}" tidak ditemukan.</p>
              </Card>
            )}

            {searchResults.map(player => {
              const isBusy = Boolean(busyIds[player.id] || (player.requestId && busyIds[player.requestId]));
              const status = player.friendshipStatus || 'NONE';

              return (
                <Card key={player.id} className="friend-card">
                  {renderPlayerSummary(player)}

                  <div className="friend-card-actions">
                    {status === 'NONE' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="friend-action-grow"
                        disabled={isBusy}
                        onClick={() => handleSendRequest(player)}
                        icon={isBusy ? <Loader2 size={15} className="spin" /> : <UserPlus size={15} />}
                      >
                        Tambah Teman
                      </Button>
                    )}

                    {status === 'PENDING_SENT' && (
                      <>
                        <span className="badge badge-gray friend-card-badge">
                          <Clock size={12} /> Menunggu
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="friend-action-secondary"
                          disabled={isBusy}
                          onClick={() => handleCancel({ requestId: player.requestId, friendId: player.id })}
                          icon={<X size={14} />}
                        >
                          Batalkan
                        </Button>
                      </>
                    )}

                    {status === 'PENDING_RECEIVED' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="friend-action-grow"
                          disabled={isBusy}
                          onClick={() => handleAccept({ requestId: player.requestId, requesterId: player.id, displayName: player.displayName })}
                          icon={<Check size={15} />}
                        >
                          Terima
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="friend-action-grow"
                          disabled={isBusy}
                          onClick={() => handleReject({ requestId: player.requestId, requesterId: player.id })}
                          icon={<X size={15} />}
                        >
                          Tolak
                        </Button>
                      </>
                    )}

                    {status === 'ACCEPTED' && (
                      <>
                        <span className="badge badge-green friend-card-badge">
                          <UserCheck size={12} /> Teman
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          className="friend-action-grow"
                          onClick={() => onStartMultiplayerWithFriend && onStartMultiplayerWithFriend(player)}
                          icon={<Play size={15} fill="#000" />}
                        >
                          Ajak Duel
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="friend-tabs">
              <button
                type="button"
                className={`btn btn-sm friend-tab-btn ${activeTab === 'friends' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('friends')}
              >
                <Users size={15} />
                <span>Teman ({friends.length})</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm friend-tab-btn ${activeTab === 'incoming' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('incoming')}
              >
                <Inbox size={15} />
                <span className="friend-tab-label-desktop">Permintaan Masuk</span>
                <span className="friend-tab-label-mobile">Masuk</span>
                {incomingRequests.length > 0 && (
                  <span style={{
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 5px',
                    borderRadius: '999px',
                    backgroundColor: activeTab === 'incoming' ? '#000' : 'var(--color-primary)',
                    color: activeTab === 'incoming' ? 'var(--color-primary)' : '#000',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {incomingRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`btn btn-sm friend-tab-btn ${activeTab === 'outgoing' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('outgoing')}
              >
                <Send size={14} />
                <span>Terkirim ({outgoingRequests.length})</span>
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-dim)' }}>
                <div className="spin" style={{ width: '28px', height: '28px', border: '3px solid rgba(29, 185, 84, 0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
                <span>Memuat daftar teman...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* TAB 1: ACCEPTED FRIENDS */}
                {activeTab === 'friends' && (
                  friends.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: '36px 18px', color: 'var(--color-text-dim)' }}>
                      <Users size={40} style={{ margin: '0 auto 10px', opacity: 0.45 }} />
                      <p style={{ fontWeight: 700, color: 'var(--color-text-bright)', marginBottom: '4px' }}>
                        Belum ada teman
                      </p>
                      <span style={{ fontSize: '0.85rem' }}>
                        Gunakan kolom pencarian di atas untuk mencari username pemain dan kirim permintaan pertemanan.
                      </span>
                    </Card>
                  ) : (
                    friends.map(player => (
                      <Card key={player.id} className="friend-card">
                        {renderPlayerSummary(player)}

                        <div className="friend-card-actions">
                          <Button
                            variant="primary"
                            size="sm"
                            className="friend-action-grow"
                            onClick={() => onStartMultiplayerWithFriend && onStartMultiplayerWithFriend(player)}
                            icon={<Play size={15} fill="#000" />}
                          >
                            Ajak Duel
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="friend-action-secondary"
                            disabled={Boolean(busyIds[player.id])}
                            onClick={() => handleRemoveFriend(player)}
                            title="Hapus teman"
                            icon={<UserMinus size={15} />}
                            style={{ color: 'var(--color-text-dim)' }}
                          >
                            Hapus
                          </Button>
                        </div>
                      </Card>
                    ))
                  )
                )}

                {/* TAB 2: INCOMING FRIEND REQUESTS */}
                {activeTab === 'incoming' && (
                  incomingRequests.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: '36px 18px', color: 'var(--color-text-dim)' }}>
                      <Inbox size={36} style={{ margin: '0 auto 10px', opacity: 0.45 }} />
                      <p style={{ fontWeight: 700, color: 'var(--color-text-bright)', marginBottom: '4px' }}>
                        Tidak ada permintaan masuk
                      </p>
                      <span style={{ fontSize: '0.85rem' }}>
                        Permintaan pertemanan dari pemain lain akan muncul di sini untuk kamu setujui.
                      </span>
                    </Card>
                  ) : (
                    incomingRequests.map(req => {
                      const isBusy = Boolean(busyIds[req.requestId] || busyIds[req.user.id]);
                      return (
                        <Card key={req.requestId} className="friend-card">
                          {renderPlayerSummary(req.user)}

                          <div className="friend-card-actions">
                            <Button
                              variant="primary"
                              size="sm"
                              className="friend-action-grow"
                              disabled={isBusy}
                              onClick={() => handleAccept({
                                requestId: req.requestId,
                                requesterId: req.user.id,
                                displayName: req.user.displayName
                              })}
                              icon={isBusy ? <Loader2 size={14} className="spin" /> : <Check size={15} />}
                            >
                              Terima
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="friend-action-grow"
                              disabled={isBusy}
                              onClick={() => handleReject({
                                requestId: req.requestId,
                                requesterId: req.user.id
                              })}
                              icon={<X size={15} />}
                            >
                              Tolak
                            </Button>
                          </div>
                        </Card>
                      );
                    })
                  )
                )}

                {/* TAB 3: OUTGOING FRIEND REQUESTS */}
                {activeTab === 'outgoing' && (
                  outgoingRequests.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: '36px 18px', color: 'var(--color-text-dim)' }}>
                      <Send size={36} style={{ margin: '0 auto 10px', opacity: 0.45 }} />
                      <p style={{ fontWeight: 700, color: 'var(--color-text-bright)', marginBottom: '4px' }}>
                        Tidak ada permintaan terkirim
                      </p>
                      <span style={{ fontSize: '0.85rem' }}>
                        Permintaan pertemanan yang masih menunggu konfirmasi akan terlihat di sini.
                      </span>
                    </Card>
                  ) : (
                    outgoingRequests.map(req => {
                      const isBusy = Boolean(busyIds[req.requestId] || busyIds[req.user.id]);
                      return (
                        <Card key={req.requestId} className="friend-card">
                          {renderPlayerSummary(req.user)}

                          <div className="friend-card-actions">
                            <span className="badge badge-gray friend-card-badge">
                              <Clock size={12} /> Menunggu
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="friend-action-secondary"
                              disabled={isBusy}
                              onClick={() => handleCancel({
                                requestId: req.requestId,
                                friendId: req.user.id
                              })}
                              icon={<X size={14} />}
                            >
                              Batalkan
                            </Button>
                          </div>
                        </Card>
                      );
                    })
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FriendsPage;
