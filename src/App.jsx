import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar.jsx';
import AppShell from './components/AppShell.jsx';
import LandingPage from './pages/Landing/LandingPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import SearchPage from './pages/Search/SearchPage.jsx';
import RoomLobbyPage from './pages/RoomLobby/RoomLobbyPage.jsx';
import GamePage from './pages/Game/GamePage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import FriendsPage from './pages/Friends/FriendsPage.jsx';
import GlobalLeaderboardPage from './pages/Dashboard/GlobalLeaderboardPage.jsx';
import StorePage from './pages/Store/StorePage.jsx';
import NotificationDrawer from './components/NotificationDrawer.jsx';
import NotificationToast from './components/NotificationToast.jsx';
import PostComposerModal from './components/PostComposerModal.jsx';
import SavedSongsModal from './components/SavedSongsModal.jsx';
import DailyLoginModal from './components/DailyLoginModal.jsx';
import QuestsModal from './components/QuestsModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import StreakCelebrationModal from './components/StreakCelebrationModal.jsx';
import StreakReminderModal from './components/StreakReminderModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import { useDialog } from './hooks/useDialog.jsx';
import { useLanguage } from './hooks/useLanguage.jsx';
import { TrackDetailProvider } from './hooks/useTrackDetail.jsx';
import { useVersionCheck } from './hooks/useVersionCheck.js';
import ApiClient from './services/api.js';
import socketService from './services/socket.js';
import pushNotifications from './services/pushNotifications.js';
import soundFx from './services/soundFx.js';
import haptics from './services/haptics.js';

const SPOTINIZE_SESSION_KEY = 'spotinize_active_session';

function getRouteFromLocation() {
  const path = window.location.pathname;
  if (path.startsWith('/user/')) {
    const segment = path.replace('/user/', '').split('/')[0];
    if (segment) return { tab: 'public-profile', username: decodeURIComponent(segment) };
  }
  const hash = window.location.hash;
  if (hash.startsWith('#/user/') || hash.startsWith('#user/')) {
    const segment = hash.replace(/#\/?user\//, '').split('/')[0];
    if (segment) return { tab: 'public-profile', username: decodeURIComponent(segment) };
  }
  const roomMatch = path.match(/^\/room\/([A-Za-z0-9_-]+)/);
  if (roomMatch) {
    return { tab: 'room-lobby', roomCode: decodeURIComponent(roomMatch[1]).toUpperCase() };
  }
  const gameMatch = path.match(/^\/game\/([A-Za-z0-9_-]+)/);
  if (gameMatch) {
    return { tab: 'game', gameId: decodeURIComponent(gameMatch[1]) };
  }
  if (path === '/main' || path === '/main/') {
    return { tab: 'dashboard' };
  }
  if (path === '/search' || path === '/search/') {
    return { tab: 'search' };
  }
  if (path === '/leaderboard' || path === '/leaderboard/') {
    return { tab: 'leaderboard' };
  }
  if (path === '/friends' || path === '/friends/') {
    return { tab: 'friends' };
  }
  if (path === '/store' || path === '/store/') {
    return { tab: 'store' };
  }
  return { tab: 'landing' };
}

function getPathForTab(tab) {
  switch (tab) {
    case 'dashboard':
      return '/main';
    case 'search':
      return '/search';
    case 'leaderboard':
      return '/leaderboard';
    case 'friends':
      return '/friends';
    case 'store':
      return '/store';
    case 'landing':
    default:
      return '/';
  }
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
  const { user, rawUser, isGuest, refreshUser, isAuthChecking } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const { tx } = useLanguage();
  const [currentTab, setCurrentTab] = useState(() => {
    const route = getRouteFromLocation();
    if (route.tab === 'public-profile') return 'dashboard';
    return route.tab;
  });
  const [activeGameId, setActiveGameId] = useState(null);
  const [isActiveGameFinished, setIsActiveGameFinished] = useState(false);
  const [lobbyGame, setLobbyGame] = useState(null);

  const isInGame = Boolean(
    (currentTab === 'game' && activeGameId) ||
    (currentTab === 'room-lobby' && lobbyGame)
  );
  useVersionCheck({ isInGame });
  const [authError, setAuthError] = useState(null);
  const [authModal, setAuthModal] = useState(null); // 'LOGIN' | 'REGISTER' | null
  const [publicProfileUsername, setPublicProfileUsername] = useState(() => {
    const route = getRouteFromLocation();
    return route.tab === 'public-profile' ? route.username : null;
  });

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeToastInvite, setActiveToastInvite] = useState(null);

  // Feed Composer & Saved Songs State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitialTrack, setComposerInitialTrack] = useState(null);
  const [isSavedSongsOpen, setIsSavedSongsOpen] = useState(false);
  const [isDailyLoginOpen, setIsDailyLoginOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreakReminderOpen, setIsStreakReminderOpen] = useState(false);
  const [streakCelebration, setStreakCelebration] = useState({ open: false, newStreak: 1, previousStreak: 0 });
  const [guestAuthMode, setGuestAuthMode] = useState(null);
  const [gamificationLoaded, setGamificationLoaded] = useState(false);
  const [quickPlayingStreak, setQuickPlayingStreak] = useState(false);
  const [canClaimDailyLogin, setCanClaimDailyLogin] = useState(false);
  const [claimableQuestsCount, setClaimableQuestsCount] = useState(0);
  const [latestCreatedPost, setLatestCreatedPost] = useState(null);
  const autoPromptedDailyUserRef = useRef(null);
  const pendingStreakReminderAfterDailyRef = useRef(false);
  const prevStreakRef = useRef({ userId: null, currentStreak: 0, streakLitToday: false });
  const wasOfflineRef = useRef(false);

  const currentUser = user || rawUser;

  // Handle Spotify Opt-In OAuth callback (/auth/callback?code=...&state=...)
  useEffect(() => {
    const path = window.location.pathname;
    if (path !== '/auth/callback') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code) {
      window.history.replaceState({}, '', '/main');
      setCurrentTab('dashboard');
      return;
    }

    ApiClient.post('/auth/spotify/callback', { code, state })
      .then((res) => {
        if (res?.user && refreshUser) {
          refreshUser();
        }
        window.history.replaceState({}, '', '/main');
        setCurrentTab('profile');
      })
      .catch((err) => {
        setAuthError(err.message || 'Gagal menghubungkan Spotify');
        window.history.replaceState({}, '', '/main');
        setCurrentTab('profile');
      });
  }, [refreshUser]);

  // Handle browser back/forward URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const route = getRouteFromLocation();
      if (route.tab === 'public-profile') {
        setPublicProfileUsername(route.username);
        return;
      }
      setPublicProfileUsername(null);
      setCurrentTab(route.tab);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Redirect logged-out users away from protected routes back to '/'
  useEffect(() => {
    if (isAuthChecking || currentUser || isGuest) return;
    const path = window.location.pathname;
    const isProtectedPath =
      path === '/main' ||
      path === '/main/' ||
      path === '/search' ||
      path === '/search/' ||
      path === '/leaderboard' ||
      path === '/leaderboard/' ||
      path === '/friends' ||
      path === '/friends/' ||
      path === '/store' ||
      path === '/store/' ||
      path.startsWith('/room/') ||
      path.startsWith('/game/');

    if (isProtectedPath) {
      setActiveGameId(null);
      setLobbyGame(null);
      setIsActiveGameFinished(false);
      clearActiveSession();
      setCurrentTab('landing');
      window.history.replaceState({}, '', '/');
    }
  }, [currentUser, isGuest, isAuthChecking]);

  // Load user notifications
  const loadNotifications = useCallback(async () => {
    if (isAuthChecking || !currentUser?.id) return;
    try {
      const res = await ApiClient.get('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {}
  }, [currentUser?.id, isAuthChecking]);

  const loadGamificationBadges = useCallback(async (force = false) => {
    if (isAuthChecking || !currentUser?.id) return null;
    try {
      const [dlRes, qRes] = await Promise.all([
        ApiClient.get('/daily-login/status', { force }).catch(() => null),
        ApiClient.get('/quests', { force }).catch(() => null)
      ]);
      const canClaim = Boolean(dlRes?.canClaimToday);
      setCanClaimDailyLogin(canClaim);
      const allQuests = [...(qRes?.daily || []), ...(qRes?.weekly || [])];
      setClaimableQuestsCount(allQuests.filter(q => q.status === 'COMPLETED').length);
      setGamificationLoaded(true);
      return { canClaim };
    } catch (e) {
      return null;
    }
  }, [currentUser?.id, isAuthChecking]);

  useEffect(() => {
    if (isAuthChecking) return;
    loadNotifications();
    loadGamificationBadges();
  }, [loadNotifications, loadGamificationBadges, isAuthChecking]);

  // Listen for guest register modal CTA trigger
  useEffect(() => {
    const handleOpenGuestUpgrade = () => setGuestAuthMode('REGISTER');
    window.addEventListener('spotinize:open-guest-upgrade', handleOpenGuestUpgrade);
    return () => window.removeEventListener('spotinize:open-guest-upgrade', handleOpenGuestUpgrade);
  }, []);

  // Detect Streak Increment -> Open Duolingo-style Animated Streak Calendar Modal
  useEffect(() => {
    if (!currentUser?.id || isGuest) {
      prevStreakRef.current = { userId: null, currentStreak: 0, streakLitToday: false };
      return;
    }

    const prev = prevStreakRef.current;
    const nextStreak = Number(currentUser.currentStreak || 0);
    const nextLit = Boolean(currentUser.streakLitToday);

    if (prev.userId === currentUser.id) {
      const justLitToday = !prev.streakLitToday && nextLit && nextStreak >= 1;
      const streakIncreased = nextStreak > prev.currentStreak && nextStreak >= 1;
      if (justLitToday || streakIncreased) {
        setStreakCelebration({
          open: true,
          newStreak: nextStreak,
          previousStreak: prev.currentStreak
        });
      }
    }

    prevStreakRef.current = {
      userId: currentUser.id,
      currentStreak: nextStreak,
      streakLitToday: nextLit
    };
  }, [currentUser?.id, currentUser?.currentStreak, currentUser?.streakLitToday, isGuest]);

  const triggerEntryModals = useCallback(({ canClaim, streakLit }) => {
    if (!currentUser?.id || isGuest || isInGame) return;
    if (!publicProfileUsername && currentTab === 'landing') return;

    if (canClaim) {
      pendingStreakReminderAfterDailyRef.current = !streakLit;
      setIsDailyLoginOpen(true);
    } else if (!streakLit) {
      pendingStreakReminderAfterDailyRef.current = false;
      setIsStreakReminderOpen(true);
    }
  }, [currentUser?.id, isGuest, isInGame, publicProfileUsername, currentTab]);

  // Auto-open Daily Login / Streak Reminder on initial visit when unclaimed or streak unlit
  useEffect(() => {
    if (!publicProfileUsername && currentTab === 'landing') {
      setIsDailyLoginOpen(false);
      setIsStreakReminderOpen(false);
      return;
    }
    if (!currentUser?.id || isGuest) {
      autoPromptedDailyUserRef.current = null;
      setGamificationLoaded(false);
      return;
    }
    if (isAuthChecking || !gamificationLoaded || isInGame) return;

    if (autoPromptedDailyUserRef.current !== currentUser.id) {
      autoPromptedDailyUserRef.current = currentUser.id;
      triggerEntryModals({
        canClaim: canClaimDailyLogin,
        streakLit: Boolean(currentUser.streakLitToday)
      });
    }
  }, [currentUser?.id, currentUser?.streakLitToday, isGuest, isAuthChecking, gamificationLoaded, canClaimDailyLogin, isInGame, currentTab, publicProfileUsername, triggerEntryModals]);

  // Re-trigger Daily Login / Streak Reminder when returning from offline -> online
  useEffect(() => {
    if (!currentUser?.id || isGuest) return;
    const socket = socketService.getSocket();

    const markOffline = () => {
      wasOfflineRef.current = true;
    };

    const handleBackOnline = async () => {
      if (!wasOfflineRef.current) return;
      wasOfflineRef.current = false;
      const [dlState] = await Promise.all([
        loadGamificationBadges(true),
        refreshUser?.()
      ]);
      const latestUser = (() => {
        try { return JSON.parse(localStorage.getItem('spotinize_user') || 'null'); } catch { return null; }
      })();
      triggerEntryModals({
        canClaim: dlState ? dlState.canClaim : canClaimDailyLogin,
        streakLit: Boolean(latestUser?.streakLitToday ?? currentUser?.streakLitToday)
      });
    };

    window.addEventListener('offline', markOffline);
    window.addEventListener('online', handleBackOnline);
    socket.on('disconnect', markOffline);
    socket.on('connect', handleBackOnline);

    return () => {
      window.removeEventListener('offline', markOffline);
      window.removeEventListener('online', handleBackOnline);
      socket.off('disconnect', markOffline);
      socket.off('connect', handleBackOnline);
    };
  }, [currentUser?.id, currentUser?.streakLitToday, isGuest, loadGamificationBadges, refreshUser, triggerEntryModals, canClaimDailyLogin]);

  // Real-time Personal WebSocket Notifications & Invites (re-registers on reconnect)
  useEffect(() => {
    if (isAuthChecking || !currentUser?.id) return;

    pushNotifications.registerWorker();
    const socket = socketService.getSocket();

    const handleConnect = () => {
      socket.emit('user:init', { userId: currentUser.id });
    };

    if (socket.connected) {
      handleConnect();
    }

    const handleInviteReceived = (inviteData) => {
      ApiClient.invalidateCache(['/feed', '/friends', '/follows']);
      setActiveToastInvite(inviteData);
      loadNotifications();
      soundFx.playNotif();
      haptics.tap();
      pushNotifications.show({
        title: tx('Game Invite', 'Undangan Bermain'),
        body: `${inviteData?.inviterUsername || 'Someone'} ${tx('invited you to play!', 'mengundangmu bermain!')}`,
        tag: `invite-${inviteData?.roomId || Date.now()}`,
        url: '/main'
      });
    };

    const handleNotificationNew = (notifData) => {
      ApiClient.invalidateCache(['/feed', '/friends', '/follows']);
      loadNotifications();
      soundFx.playNotif();
      haptics.tap();
      if (notifData?.title || notifData?.message || notifData?.body) {
        pushNotifications.show({
          title: notifData.title || 'Spotinize',
          body: notifData.message || notifData.body || '',
          tag: `notif-${notifData.id || Date.now()}`,
          url: '/main'
        });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('invite:received', handleInviteReceived);
    socket.on('notification:new', handleNotificationNew);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('invite:received', handleInviteReceived);
      socket.off('notification:new', handleNotificationNew);
    };
  }, [currentUser?.id, isAuthChecking, loadNotifications]);

  const handleGoToMain = useCallback(() => {
    setPublicProfileUsername(null);
    setCurrentTab('dashboard');
    if (window.location.pathname !== '/main') {
      window.history.pushState({}, '', '/main');
    }
  }, []);

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
    if (isAuthChecking || !currentUser?.id || publicProfileUsername) return;
    let cancelled = false;

    const restoreSession = async () => {
      const route = getRouteFromLocation();
      const urlRoomCode = route.tab === 'room-lobby' ? route.roomCode : null;
      const urlGameId = route.tab === 'game' ? route.gameId : null;

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
              setCurrentTab('dashboard');
              window.history.replaceState({}, '', '/main');
            } else {
              handleGameCreated(state, true);
            }
          }
          return;
        }

        // Only auto-restore active game when user is on /main
        if (route.tab === 'dashboard') {
          const { activeGame } = await ApiClient.get('/game/active');
          if (!cancelled && activeGame?.id) {
            if (activeGame.status === 'WAITING') {
              handleJoinRoom(activeGame, true);
            } else {
              handleGameCreated(activeGame, true);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          clearActiveSession();
          if (urlRoomCode || urlGameId) {
            setCurrentTab('dashboard');
            window.history.replaceState({}, '', '/main');
          }
        }
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isAuthChecking, publicProfileUsername, handleJoinRoom, handleGameCreated]);

  const handleJoinByRoomCode = async (roomCode) => {
    if (!currentUser?.id || !roomCode) return;
    try {
      const res = await ApiClient.post('/game/multiplayer/join', {
        roomCode: roomCode.trim().toUpperCase()
      });
      handleJoinRoom(res);
    } catch (err) {
      await showAlert(tx('Failed to join room: ', 'Gagal bergabung ke room: ') + err.message, {
        title: tx('Failed to Join', 'Gagal Bergabung'),
        variant: 'danger'
      });
    }
  };

  const handleStartDuelWithPlayer = async (targetUser) => {
    if (!currentUser?.id) {
      await showAlert(tx('Please log in first to challenge a player.', 'Silakan login terlebih dahulu untuk mengajak duel.'), {
        title: tx('Login Required', 'Login Diperlukan'),
        variant: 'info'
      });
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
      await showAlert(tx('Failed to start duel room: ', 'Gagal memulai room duel: ') + e.message, {
        title: tx('Failed to Start Duel', 'Gagal Memulai Duel'),
        variant: 'danger'
      });
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
    if (window.location.pathname !== '/main') {
      window.history.pushState({}, '', '/main');
    }
  }, []);

  const handleExitGame = useCallback(() => {
    setActiveGameId(null);
    setLobbyGame(null);
    setIsActiveGameFinished(false);
    setCurrentTab('dashboard');
    clearActiveSession();
    if (window.location.pathname !== '/main') {
      window.history.pushState({}, '', '/main');
    }
    refreshUser();
  }, [refreshUser]);

  const handleGameFinished = useCallback(() => {
    setIsActiveGameFinished(true);
    setTimeout(() => {
      refreshUser?.();
      loadGamificationBadges(true);
    }, 600);
  }, [refreshUser, loadGamificationBadges]);

  const handleQuickPlayForStreak = useCallback(async () => {
    if (quickPlayingStreak) return;
    try {
      setQuickPlayingStreak(true);
      const res = await ApiClient.post('/game/solo/create', {
        category: 'Global Trends',
        numberOfSongs: 5
      });
      setIsStreakReminderOpen(false);
      handleGameCreated(res);
    } catch (err) {
      showAlert?.(err.message || tx('Failed to start game', 'Gagal memulai game'));
    } finally {
      setQuickPlayingStreak(false);
    }
  }, [quickPlayingStreak, handleGameCreated, showAlert, tx]);

  const handleNavigateToPublicProfile = (username) => {
    setPublicProfileUsername(username);
    window.history.pushState({}, '', `/user/${encodeURIComponent(username)}`);
  };

  const handleExitPublicProfile = () => {
    setPublicProfileUsername(null);
    if (!currentUser && !isGuest) {
      window.history.pushState({}, '', '/');
      setCurrentTab('landing');
    } else {
      window.history.pushState({}, '', '/main');
      setCurrentTab('dashboard');
    }
  };

  const renderLanding = () => (
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
            <button className="btn btn-ghost btn-sm" onClick={() => setAuthError(null)} style={{ padding: '4px 8px' }}>{tx('Close', 'Tutup')}</button>
          </div>
        </div>
      )}
      <LandingPage
        onStart={handleGoToMain}
        authModal={authModal}
        setAuthModal={setAuthModal}
      />
    </div>
  );

  // Render current view
  const renderContent = () => {
    // Dedicated Profile Route (/user/:username)
    if (publicProfileUsername) {
      return (
        <ProfilePage
          targetUsername={publicProfileUsername}
          user={currentUser}
          onStartDuel={handleStartDuelWithPlayer}
          onOpenPublicProfile={handleNavigateToPublicProfile}
          onPlayChallenge={handleGameCreated}
          onBack={handleExitPublicProfile}
        />
      );
    }

    // Landing Page at '/' (accessible even when logged in)
    if (currentTab === 'landing') {
      return renderLanding();
    }

    // Not logged in and not in Guest trial -> Landing page
    if (!currentUser && !isGuest) {
      return renderLanding();
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
      if (isGuest) {
        return (
          <div className="home-column-wrap mobile-page-container" style={{ paddingTop: '24px' }}>
            <div className="card" style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                {tx('Guest Mode — No Profile Yet', 'Mode Guest — Belum Ada Profil')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '380px', margin: 0 }}>
                {tx(
                  'Register a free account to build your music profile, track streaks, unlock achievements, and collect cosmetics.',
                  'Daftar akun gratis untuk membuat profil musikmu, simpan streak, raih achievement, dan koleksi kosmetik.'
                )}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setGuestAuthMode('REGISTER')}
                style={{ fontWeight: 800, padding: '8px 18px', marginTop: '4px' }}
              >
                {tx('Register Account', 'Daftar Akun')}
              </button>
            </div>
          </div>
        );
      }
      return (
        <ProfilePage
          user={currentUser}
          targetUsername={currentUser?.username}
          onStartDuel={handleStartDuelWithPlayer}
          onOpenPublicProfile={handleNavigateToPublicProfile}
          onPlayChallenge={handleGameCreated}
        />
      );
    }

    if (currentTab === 'search') {
      return (
        <SearchPage
          user={currentUser}
          onOpenPublicProfile={handleNavigateToPublicProfile}
          onPlayChallenge={handleGameCreated}
        />
      );
    }

    if (currentTab === 'friends') {
      if (isGuest) {
        return (
          <div className="home-column-wrap mobile-page-container" style={{ paddingTop: '24px' }}>
            <div className="card" style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                {tx('Account Required for Friends', 'Perlu Akun untuk Fitur Teman')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '380px', margin: 0 }}>
                {tx(
                  'Register a free account to follow players, invite friends, and play real-time Multiplayer duels.',
                  'Daftar akun gratis untuk follow pemain, undang teman, dan main duel Multiplayer.'
                )}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setGuestAuthMode('REGISTER')}
                style={{ fontWeight: 800, padding: '8px 18px', marginTop: '4px' }}
              >
                {tx('Register Account', 'Daftar Akun')}
              </button>
            </div>
          </div>
        );
      }
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

    if (currentTab === 'store') {
      return <StorePage />;
    }

    return (
      <DashboardPage
        user={currentUser}
        onGameCreated={handleGameCreated}
        onJoinRoom={handleJoinRoom}
        latestCreatedPost={latestCreatedPost}
        onOpenPublicProfile={handleNavigateToPublicProfile}
        onOpenComposer={() => handleOpenComposer(null)}
      />
    );
  };

  const handleOpenComposer = (initialTrack = null) => {
    if (isGuest || !currentUser?.id) {
      setGuestAuthMode('REGISTER');
      return;
    }
    setComposerInitialTrack(initialTrack);
    setIsComposerOpen(true);
  };

  const handleNavigate = async (tab) => {
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
        ? tx('You are currently in a Room Lobby. Are you sure you want to leave?', 'Kamu sedang berada di Room Lobby. Yakin mau keluar?')
        : tx('A game is in progress. Are you sure you want to leave to the menu?', 'Game sedang berlangsung. Yakin mau keluar ke menu?');
      const confirmed = await showConfirm(msg, {
        title: lobbyGame ? tx('Leave Room Lobby', 'Keluar Room Lobby') : tx('Leave Game', 'Keluar Game'),
        variant: 'danger',
        confirmText: tx('Yes, Leave', 'Ya, Keluar'),
        cancelText: tx('Cancel', 'Batal')
      });
      if (!confirmed) {
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
    } else if (activeGameId && isActiveGameFinished) {
      setActiveGameId(null);
      setLobbyGame(null);
      setIsActiveGameFinished(false);
      clearActiveSession();
    }

    if (tab === 'profile' && currentUser?.username) {
      handleNavigateToPublicProfile(currentUser.username);
      return;
    }
    if (publicProfileUsername) {
      setPublicProfileUsername(null);
    }

    const nextTab = (!currentUser && !isGuest) && tab !== 'landing' ? 'landing' : tab;
    const targetPath = getPathForTab(nextTab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentTab(nextTab);
  };

  const activeNavTab = publicProfileUsername
    ? (publicProfileUsername === currentUser?.username ? 'profile' : '')
    : currentTab;

  const useThreeColumnShell = Boolean(
    (currentUser || isGuest) &&
    (publicProfileUsername || currentTab !== 'landing')
  );

  return (
    <TrackDetailProvider>
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      {useThreeColumnShell ? (
        <AppShell
          currentTab={activeNavTab}
          unreadCount={unreadCount}
          canClaimDailyLogin={canClaimDailyLogin}
          claimableQuestsCount={claimableQuestsCount}
          onOpenDailyLogin={() => setIsDailyLoginOpen(true)}
          onOpenQuests={() => setIsQuestsOpen(true)}
          onNavigate={handleNavigate}
          onOpenNotifications={() => {
            setIsNotificationOpen(true);
            loadNotifications();
          }}
          onOpenComposer={() => handleOpenComposer(null)}
          onOpenSavedSongs={() => setIsSavedSongsOpen(true)}
          onOpenPublicProfile={handleNavigateToPublicProfile}
          onOpenSettings={() => setIsSettingsOpen(true)}
        >
          {renderContent()}
        </AppShell>
      ) : (
        <>
          <Navbar
            currentTab={activeNavTab}
            unreadCount={unreadCount}
            hideNavLinks={currentTab === 'landing'}
            isLanding={currentTab === 'landing' || (!currentUser && !publicProfileUsername)}
            onOpenNotifications={() => {
              setIsNotificationOpen(true);
              loadNotifications();
            }}
            onNavigate={handleNavigate}
          />

          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {renderContent()}
          </main>
        </>
      )}

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
        onOpenPublicProfile={handleNavigateToPublicProfile}
        onNavigate={handleNavigate}
        onMarkReadLocal={(id) => {
          setNotifications(prev =>
            id === 'ALL'
              ? prev.map(n => ({ ...n, isRead: true }))
              : prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
          );
        }}
        onRefresh={loadNotifications}
      />

      {/* Music Post Composer Modal */}
      <PostComposerModal
        isOpen={isComposerOpen}
        initialTrack={composerInitialTrack}
        onClose={() => {
          setIsComposerOpen(false);
          setComposerInitialTrack(null);
        }}
        onPostCreated={(newPost) => {
          setLatestCreatedPost(newPost);
          if (currentTab !== 'dashboard') {
            handleGoToMain();
          }
        }}
      />

      {/* Saved Songs / Bookmarks Modal */}
      <SavedSongsModal
        isOpen={isSavedSongsOpen}
        onClose={() => setIsSavedSongsOpen(false)}
        onPostTrack={(track) => handleOpenComposer(track)}
      />

      {/* Weekly AI Daily Login Modal */}
      <DailyLoginModal
        isOpen={useThreeColumnShell && isDailyLoginOpen}
        onClose={() => {
          setIsDailyLoginOpen(false);
          if (pendingStreakReminderAfterDailyRef.current) {
            pendingStreakReminderAfterDailyRef.current = false;
            if (!isGuest && !currentUser?.streakLitToday && !isInGame && currentTab !== 'landing') {
              setIsStreakReminderOpen(true);
            }
          }
        }}
        onClaimed={() => {
          refreshUser?.();
          loadGamificationBadges(true);
        }}
      />

      {/* Streak Increment Calendar Celebration Modal */}
      <StreakCelebrationModal
        isOpen={useThreeColumnShell && streakCelebration.open}
        onClose={() => setStreakCelebration(prev => ({ ...prev, open: false }))}
        newStreak={streakCelebration.newStreak}
        previousStreak={streakCelebration.previousStreak}
      />

      {/* Streak Unlit Reminder Modal (after Daily Login or if streak not lit yet) */}
      <StreakReminderModal
        isOpen={useThreeColumnShell && isStreakReminderOpen}
        onClose={() => setIsStreakReminderOpen(false)}
        currentStreak={currentUser?.currentStreak || 0}
        onPlayNow={handleQuickPlayForStreak}
        startingGame={quickPlayingStreak}
      />

      {/* Shared Register / Login CTA Modal */}
      <AuthModal
        mode={guestAuthMode}
        onChangeMode={setGuestAuthMode}
        onClose={() => setGuestAuthMode(null)}
      />

      {/* Daily & Weekly Quests Modal */}
      <QuestsModal
        isOpen={isQuestsOpen}
        onClose={() => setIsQuestsOpen(false)}
        onQuestClaimed={() => {
          refreshUser?.();
          loadGamificationBadges();
        }}
      />

      {/* Settings Modal (Audio, SFX, Haptics, Push Notifications, Language) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
    </TrackDetailProvider>
  );
}

export default App;
