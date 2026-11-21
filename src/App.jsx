import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/Landing/LandingPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import RoomLobbyPage from './pages/RoomLobby/RoomLobbyPage.jsx';
import GamePage from './pages/Game/GamePage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import FriendsPage from './pages/Friends/FriendsPage.jsx';
import GlobalLeaderboardPage from './pages/Dashboard/GlobalLeaderboardPage.jsx';
import NotificationDrawer from './components/NotificationDrawer.jsx';
import NotificationToast from './components/NotificationToast.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import ApiClient from './services/api.js';
import socketService from './services/socket.js';

const SPOTINIZE_SESSION_KEY = 'spotinize_active_session';

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

function getRoomCodeFromUrl() {
  const match = window.location.pathname.match(/^\/room\/([A-Za-z0-9_-]+)/);
  return match ? decodeURIComponent(match[1]).toUpperCase() : null;
}

function getGameIdFromUrl() {
  const match = window.location.pathname.match(/^\/game\/([A-Za-z0-9_-]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function saveActiveSession(payload) {
  try {
    sessionStorage.setItem(SPOTINIZE_SESSION_KEY, JSON.stringify(payload));
  } catch (e) {}
}

function clearActiveSession() {
  try {
    sessionStorage.removeItem(SPOTINIZE_SESSION_KEY);
  } catch (e) {}
}

export function App() {
  const { user, rawUser, refreshUser } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeGameId, setActiveGameId] = useState(null);
  const [isActiveGameFinished, setIsActiveGameFinished] = useState(false);
  const [lobbyGame, setLobbyGame] = useState(null);
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

  // Real-time Personal WebSocket Notifications & Invites (re-registers on reconnect)
  useEffect(() => {
    if (!currentUser?.id) return;

    const socket = socketService.getSocket();

    const handleConnect = () => {
      socket.emit('user:init', { userId: currentUser.id });
    };

    if (socket.connected) {
      handleConnect();
    }

    const handleInviteReceived = (inviteData) => {
      setActiveToastInvite(inviteData);
      loadNotifications();
    };

    const handleNotificationNew = () => {
      loadNotifications();
    };

    socket.on('connect', handleConnect);
    socket.on('invite:received', handleInviteReceived);
    socket.on('notification:new', handleNotificationNew);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('invite:received', handleInviteReceived);
      socket.off('notification:new', handleNotificationNew);
    };
  }, [currentUser?.id, loadNotifications]);

  // When game is created or resumed into active gameplay
  const handleGameCreated = useCallback((gameState, replaceUrl = false) => {
    if (!gameState?.id) return;
    setActiveGameId(gameState.id);
    setLobbyGame(null);
    setIsActiveGameFinished(Boolean(gameState.isFinished || gameState.status === 'FINISHED'));
    setCurrentTab('game');
    saveActiveSession({ type: 'game', gameId: gameState.id });

    const targetUrl = `/game/${encodeURIComponent(gameState.id)}`;
    if (window.location.pathname !== targetUrl) {
      if (replaceUrl) {
        window.history.replaceState({}, '', targetUrl);
      } else {
        window.history.pushState({}, '', targetUrl);
      }
    }
  }, []);

  // When multiplayer room is created or joined (handles PLAYING rejoin directly into GamePage)
  const handleJoinRoom = useCallback((gameState, replaceUrl = false) => {
    if (!gameState?.id) return;
    if (gameState.status === 'PLAYING' || gameState.status === 'STARTING' || gameState.status === 'FINISHED') {
      handleGameCreated(gameState, replaceUrl);
      return;
    }

    setLobbyGame(gameState);
    setActiveGameId(null);
    setIsActiveGameFinished(false);
    setCurrentTab('room-lobby');
    saveActiveSession({ type: 'room', roomCode: gameState.roomCode, gameId: gameState.id });

    if (gameState.roomCode) {
      const targetUrl = `/room/${encodeURIComponent(gameState.roomCode)}`;
      if (window.location.pathname !== targetUrl) {
        if (replaceUrl) {
          window.history.replaceState({}, '', targetUrl);
        } else {
          window.history.pushState({}, '', targetUrl);
        }
      }
    }
  }, [handleGameCreated]);

  // Session persistence & URL restore on mount/login
  useEffect(() => {
    if (!currentUser?.id || publicProfileUsername) return;
    let cancelled = false;

    const restoreSession = async () => {
      const urlRoomCode = getRoomCodeFromUrl();
      const urlGameId = getGameIdFromUrl();

      try {
        if (urlRoomCode) {
          const res = await ApiClient.post('/game/multiplayer/join', {
            roomCode: urlRoomCode
          });
          if (!cancelled && res?.id) {
            handleJoinRoom(res, true);
          }
          return;
        }

        if (urlGameId) {
          const state = await ApiClient.get(`/game/${urlGameId}`);
          if (!cancelled && state?.id) {
            if (state.status === 'WAITING') {
              handleJoinRoom(state, true);
            } else if (state.status === 'ABANDONED') {
              clearActiveSession();
              window.history.replaceState({}, '', '/');
            } else {
              handleGameCreated(state, true);
            }
          }
          return;
        }

        const { activeGame } = await ApiClient.get('/game/active');
        if (!cancelled && activeGame?.id) {
          if (activeGame.status === 'WAITING') {
            handleJoinRoom(activeGame, true);
          } else {
            handleGameCreated(activeGame, true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          clearActiveSession();
          if (urlRoomCode || urlGameId) {
            window.history.replaceState({}, '', '/');
          }
        }
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, publicProfileUsername, handleJoinRoom, handleGameCreated]);

  const handleJoinByRoomCode = async (roomCode) => {
    if (!currentUser?.id || !roomCode) return;
    try {
      const res = await ApiClient.post('/game/multiplayer/join', {
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

  const handleGameStartedFromLobby = useCallback((gameId) => {
    if (!gameId) return;
    setActiveGameId(gameId);
    setLobbyGame(null);
    setIsActiveGameFinished(false);
    setCurrentTab('game');
    saveActiveSession({ type: 'game', gameId });
    const targetUrl = `/game/${encodeURIComponent(gameId)}`;
    if (window.location.pathname !== targetUrl) {
      window.history.replaceState({}, '', targetUrl);
    }
  }, []);

  const handleLeaveLobby = useCallback(() => {
    setLobbyGame(null);
    setIsActiveGameFinished(false);
    setCurrentTab('dashboard');
    clearActiveSession();
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const handleExitGame = useCallback(() => {
    setActiveGameId(null);
    setLobbyGame(null);
    setIsActiveGameFinished(false);
    setCurrentTab('dashboard');
    clearActiveSession();
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    refreshUser();
  }, [refreshUser]);

  const handleGameFinished = useCallback(() => {
    setIsActiveGameFinished(true);
  }, []);

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
          onGameFinished={handleGameFinished}
        />
      );
    }

    if (currentTab === 'room-lobby' && lobbyGame) {
      return (
        <RoomLobbyPage
          initialGame={lobbyGame}
          user={currentUser}
          onGameStarted={handleGameStartedFromLobby}
          onLeave={handleLeaveLobby}
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
        onNavigate={async (tab) => {
          if (tab === 'login') {
            setAuthModal('LOGIN');
            return;
          }
          if (tab === 'register') {
            setAuthModal('REGISTER');
            return;
          }

          const activeTargetId = (activeGameId && !isActiveGameFinished)
            ? activeGameId
            : (lobbyGame?.id || null);

          if (activeTargetId) {
            const msg = lobbyGame
              ? 'Kamu sedang berada di Room Lobby. Yakin mau keluar?'
              : 'Game sedang berlangsung. Yakin mau keluar ke menu?';
            if (!confirm(msg)) {
              return;
            }
            try {
              await ApiClient.post(`/game/${activeTargetId}/leave`);
            } catch (e) {}
            try {
              socketService.getSocket().emit('game:leave_room', { gameId: activeTargetId });
            } catch (e) {}
            setActiveGameId(null);
            setLobbyGame(null);
            setIsActiveGameFinished(false);
            clearActiveSession();
            window.history.pushState({}, '', '/');
          } else if (activeGameId && isActiveGameFinished) {
            setActiveGameId(null);
            setLobbyGame(null);
            setIsActiveGameFinished(false);
            clearActiveSession();
            window.history.pushState({}, '', '/');
          }

          if (tab === 'profile' && currentUser?.username) {
            handleNavigateToPublicProfile(currentUser.username);
            return;
          }
          if (publicProfileUsername) {
            setPublicProfileUsername(null);
            window.history.pushState({}, '', '/');
          }
          setCurrentTab(tab);
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
    </div>
  );
}

export default App;
