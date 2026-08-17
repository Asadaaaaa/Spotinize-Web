import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Play, Sparkles, Search, UserCheck, Trophy, Loader2 } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Avatar from '../../components/Avatar.jsx';
import ApiClient from '../../services/api.js';

export function FriendsPage({ user, onStartMultiplayerWithFriend, onOpenPublicProfile }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  const loadFriends = () => {
    if (user?.id) {
      setLoading(true);
      ApiClient.get(`/friends/${user.id}`)
        .then(res => setFriends(res.friends || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadFriends();
  }, [user?.id]);

  // Live search registered players
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await ApiClient.get(`/friends/search?q=${encodeURIComponent(searchQuery)}&userId=${user.id}`);
        setSearchResults(res.players || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleAddFriend = async (friendId) => {
    try {
      await ApiClient.post('/friends/add', { userId: user.id, friendId });
      setAddedIds(prev => new Set([...prev, friendId]));
      loadFriends();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayerClick = (username) => {
    if (onOpenPublicProfile && username) {
      onOpenPublicProfile(username);
    }
  };

  const displayedList = searchQuery.trim() ? searchResults : friends;

  return (
    <div className="container-narrow mobile-page-container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '6px' }}>
              <Sparkles size={12} /> Spotinize Real Players
            </span>
            <h2 style={{ fontSize: '1.6rem' }}>Teman & Pemain Spotinize</h2>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Daftar pemain asli yang terdaftar di Spotinize. Klik pemain untuk membuka halaman profil atau ajak duel multiplayer!
        </p>

        {/* Search Player Input */}
        <div style={{ position: 'relative' }}>
          <Search 
            size={18} 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} 
          />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '42px', fontSize: '0.95rem' }}
            placeholder="Cari pemain (contoh: John Doe / john_doe)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && (
            <Loader2 
              size={18} 
              className="spin" 
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} 
            />
          )}
        </div>

        {/* Players List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-dim)' }}>
              <div className="spin" style={{ width: '28px', height: '28px', border: '3px solid rgba(29, 185, 84, 0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
              <span>Memuat data pemain asli...</span>
            </div>
          )}

          {!loading && displayedList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-dim)' }}>
              <Users size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>{searchQuery ? 'Pemain tidak ditemukan.' : 'Belum ada pemain lain yang terdaftar.'}</p>
            </div>
          )}

          {displayedList.map(player => (
            <Card
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                gap: '12px'
              }}
            >
              {/* Clickable Player Info */}
              <div 
                onClick={() => handlePlayerClick(player.username)}
                title={`Buka profil /user/${player.username}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px', 
                  minWidth: 0, 
                  flex: 1, 
                  cursor: 'pointer' 
                }}
              >
                <Avatar
                  src={player.avatarUrl}
                  alt={player.displayName}
                  seed={player.id || player.displayName}
                  style={{ width: '48px', height: '48px', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: 'var(--color-text-bright)'
                  }}>
                    {player.displayName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      @{player.username}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                      <Trophy size={11} color="var(--color-primary)" /> {player.bestScore || 0} pts
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                      • {player.gamesPlayed || 0} Games
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: player.isOnline ? 'var(--color-primary)' : 'var(--color-text-dim)'
                      }} />
                      <span style={{ fontSize: '0.75rem', color: player.isOnline ? 'var(--color-primary)' : 'var(--color-text-dim)' }}>
                        {player.isOnline ? 'Aktif' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {searchQuery && (
                  <Button
                    variant={addedIds.has(player.id) ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleAddFriend(player.id)}
                    icon={addedIds.has(player.id) ? <UserCheck size={16} color="var(--color-primary)" /> : <UserPlus size={16} />}
                  >
                    {addedIds.has(player.id) ? 'Teman' : 'Tambah'}
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onStartMultiplayerWithFriend ? onStartMultiplayerWithFriend(player) : null}
                  icon={<Play size={15} fill="#000" />}
                >
                  Ajak Duel
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FriendsPage;
