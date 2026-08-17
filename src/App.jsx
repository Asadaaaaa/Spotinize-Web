import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/Landing/LandingPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import RoomLobbyPage from './pages/RoomLobby/RoomLobbyPage.jsx';
import GamePage from './pages/Game/GamePage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import FriendsPage from './pages/Friends/FriendsPage.jsx';
import GlobalLeaderboardPage from './pages/Dashboard/GlobalLeaderboardPage.jsx';
import SpotifyConnectModal from './components/SpotifyConnectModal.jsx';
import NotificationDrawer from './components/NotificationDrawer.jsx';
import NotificationToast from './components/NotificationToast.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import ApiClient from './services/api.js';
import socketService from './services/socket.js';

function getUsernameFromUrl() {
  const path = window.location.pathname;
  if (path.startsWith('/user/')) {
    const segment = path.replace('/user/', '').split('/')[0];
    if (segment) return decodeURIComponent(segment);
  }
  const hash = window.location.hash;
  if (hash.startsWith('#/user/') || hash.startsWith('#user/')) {
    const segment = hash.replace(/#\/?user\//, '').split('/')[0];
    if (segment) return decodeURIComponent(segment);
  }
  return null;
}

export function App() {
  const { user, rawUser, isAuthenticated, requireSpotifyConnect, setAuthSession, refreshUser } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeGameId, setActiveGameId] = useState(null);
  const [lobbyGame, setLobbyGame] = useState(null);
  const [isAuthenticatingSpotify, setIsAuthenticatingSpotify] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authModal, setAuthModal] = useState(null); // 'LOGIN' | 'REGISTER' | null
  const [publicProfileUsername, setPublicProfileUsername] = useState(() => getUsernameFromUrl());

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeToastInvite, setActiveToastInvite] = useState(null);

  const currentUser = user || rawUser;

  // Handle URL change for /user/:username route
  useEffect(() => {
    const handleUrlChange = () => {
      const uname = getUsernameFromUrl();
      if (uname) {
        setPublicProfileUsername(uname);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Load user notifications
  const loadNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await ApiClient.get('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {}
  }, [currentUser?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time Personal WebSocket Notifications & Invites
  useEffect(() => {
    if (!currentUser?.id) return;

    const socket = socketService.getSocket();

    // Register user personal channel
    socket.emit('user:init', { userId: currentUser.id });

    // Handle incoming instant invitation
    const handleInviteReceived = (inviteData) => {
      setActiveToastInvite(inviteData);
      loadNotifications();
    };

    // Handle new general notification
    const handleNotificationNew = () => {
      loadNotifications();
    };

    socket.on('invite:received', handleInviteReceived);
    socket.on('notification:new', handleNotificationNew);

    return () => {
      socket.off('invite:received', handleInviteReceived);
      socket.off('notification:new', handleNotificationNew);
    };
  }, [currentUser?.id, loadNotifications]);

  // Check Spotify OAuth callback parameter (?code= & ?state=)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      window.history.replaceState({}, document.title, '/');
      setAuthError('Otorisasi Spotify dibatalkan atau ditolak.');
      return;
    }

    if (code) {
      setIsAuthenticatingSpotify(true);
      window.history.replaceState({}, document.title, '/');
      
      ApiClient.post('/auth/spotify/callback', { code, state })
        .then(data => {
          if (data.user) {
            setAuthSession(data.user, data.token);
            setCurrentTab('dashboard');
          }
        })
        .catch(err => {
          console.error('OAuth callback failed:', err);
          setAuthError('Gagal menghubungkan Spotify: ' + (err.response?.data?.error || err.message));
        })
        .finally(() => {
          setIsAuthenticatingSpotify(false);
        });
    }
  }, [setAuthSession]);

  // When game is created from Dashboard
  const handleGameCreated = (gameState) => {
    setActiveGameId(gameState.id);
    setCurrentTab('game');
  };

  // When multiplayer room is created or joined
  const handleJoinRoom = (gameState) => {
    setLobbyGame(gameState);
    setCurrentTab('room-lobby');
  };

  const handleJoinByRoomCode = async (roomCode) => {
    if (!currentUser?.id || !roomCode) return;
    try {
      const res = await ApiClient.post('/game/multiplayer/join', {
        userId: currentUser.id,
        roomCode: roomCode.trim().toUpperCase()
      });
      handleJoinRoom(res);
    } catch (err) {
      alert('Gagal bergabung ke room: ' + err.message);
    }
  };

  const handleStartDuelWithPlayer = async (targetUser) => {
    if (!currentUser?.id) {
      alert('Silakan login terlebih dahulu untuk mengajak duel.');
      setAuthModal('LOGIN');
      return;
    }

    try {
      const res = await ApiClient.post('/game/multiplayer/create', {
        userId: currentUser.id,
        category: 'Global Trends',
        numberOfSongs: 5
      });

      try {
        await ApiClient.post('/notifications/invite', {
          targetUserId: targetUser.id,
          roomCode: res.roomCode,
          gameId: res.id
        });

        const socket = socketService.getSocket();
        socket.emit('invite:send', {
          targetUserId: targetUser.id,
          roomCode: res.roomCode,
          gameId: res.id,
          hostId: currentUser.id,
          hostName: currentUser.displayName,
          hostAvatar: currentUser.avatarUrl,
          category: 'Global Trends'
        });
      } catch (e) {}

      handleJoinRoom(res);
    } catch (e) {
      alert('Gagal memulai room duel: ' + e.message);
    }
  };

  const handleGameStartedFromLobby = (gameId) => {
    setActiveGameId(gameId);
    setLobbyGame(null);
    setCurrentTab('game');
  };

  const handleExitGame = () => {
    setActiveGameId(null);
    setLobbyGame(null);
    setCurrentTab('dashboard');
    refreshUser();
  };

  const handleNavigateToPublicProfile = (username) => {
    setPublicProfileUsername(username);
    window.history.pushState({}, '', `/user/${encodeURIComponent(username)}`);
  };

  const handleExitPublicProfile = () => {
    setPublicProfileUsername(null);
    window.history.pushState({}, '', '/');
    if (!currentUser) {
      setCurrentTab('landing');
    } else {
      setCurrentTab('dashboard');
    }
  };

  // Render current view
  const renderContent = () => {
    if (isAuthenticatingSpotify) {
      return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div className="spin" style={{ width: '36px', height: '36px', border: '3px solid rgba(29, 185, 84, 0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-bright)' }}>
            Menghubungkan Akun Spotify ke Spotinize...
          </p>
        </div>
      );
    }

    // Dedicated Profile Route (/user/:username)
    if (publicProfileUsername) {
      return (
        <ProfilePage
          targetUsername={publicProfileUsername}
          user={currentUser}
          onStartDuel={handleStartDuelWithPlayer}
          onBack={handleExitPublicProfile}
        />
      );
    }

    // Not logged in -> Landing page
    if (!currentUser) {
      return (
        <div>
          {authError && (
            <div className="container-narrow" style={{ paddingTop: '20px' }}>
              <div style={{
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{authError}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setAuthError(null)} style={{ padding: '4px 8px' }}>Tutup</button>
              </div>
            </div>
          )}
          <LandingPage 
            onStart={() => setCurrentTab('dashboard')} 
            authModal={authModal}
            setAuthModal={setAuthModal}
          />
        </div>
      );
    }

    if (currentTab === 'game' && activeGameId) {
      return (
        <GamePage
          gameId={activeGameId}
          user={currentUser}
          onExitToDashboard={handleExitGame}
        />
      );
    }

    if (currentTab === 'room-lobby' && lobbyGame) {
      return (
        <RoomLobbyPage
          initialGame={lobbyGame}
          user={currentUser}
          onGameStarted={handleGameStartedFromLobby}
          onLeave={() => {
            setLobbyGame(null);
            setCurrentTab('dashboard');
          }}
        />
      );
    }

    if (currentTab === 'profile') {
      return (
        <ProfilePage 
          user={currentUser} 
          targetUsername={currentUser?.username}
          onStartDuel={handleStartDuelWithPlayer}
        />
      );
    }

    if (currentTab === 'friends') {
      return (
        <FriendsPage
          user={currentUser}
          onStartMultiplayerWithFriend={handleStartDuelWithPlayer}
          onOpenPublicProfile={handleNavigateToPublicProfile}
        />
      );
    }

    if (currentTab === 'leaderboard') {
      return (
        <GlobalLeaderboardPage
          currentUserId={currentUser?.id}
          onStartMultiplayerWithFriend={handleStartDuelWithPlayer}
          onOpenPublicProfile={handleNavigateToPublicProfile}
        />
      );
    }

    return (
      <DashboardPage
        user={currentUser}
        onGameCreated={handleGameCreated}
        onJoinRoom={handleJoinRoom}
      />
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <Navbar
        currentTab={publicProfileUsername ? (publicProfileUsername === currentUser?.username ? 'profile' : '') : currentTab}
        unreadCount={unreadCount}
        onOpenNotifications={() => {
          setIsNotificationOpen(true);
          loadNotifications();
        }}
        onNavigate={(tab) => {
          if (tab === 'profile' && currentUser?.username) {
            handleNavigateToPublicProfile(currentUser.username);
            return;
          }
          if (publicProfileUsername) {
            setPublicProfileUsername(null);
            window.history.pushState({}, '', '/');
          }
          if (tab === 'login') {
            setAuthModal('LOGIN');
            return;
          }
          if (tab === 'register') {
            setAuthModal('REGISTER');
            return;
          }
          if (activeGameId) {
            if (confirm('Game sedang berlangsung. Yakin mau keluar ke menu?')) {
              setActiveGameId(null);
              setLobbyGame(null);
              setCurrentTab(tab);
            }
          } else {
            setCurrentTab(tab);
          }
        }}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
      </main>

      {/* Floating In-App Live Invitation Toast */}
      {activeToastInvite && (
        <NotificationToast
          invite={activeToastInvite}
          onAccept={(roomCode) => {
            setActiveToastInvite(null);
            handleJoinByRoomCode(roomCode);
          }}
          onDecline={() => setActiveToastInvite(null)}
        />
      )}

      {/* Notification Center Drawer Modal */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onJoinRoom={(roomCode) => {
          handleJoinByRoomCode(roomCode);
        }}
        onRefresh={loadNotifications}
      />

      {/* Mandatory Spotify Connect Modal */}
      <SpotifyConnectModal
        isOpen={requireSpotifyConnect && !publicProfileUsername}
        user={rawUser}
        onConnected={() => {
          refreshUser();
          setCurrentTab('dashboard');
        }}
      />
    </div>
  );
}

export default App;
