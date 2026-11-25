import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ApiClient from '../services/api.js';
import socketService from '../services/socket.js';

const AuthContext = createContext(null);

function isJwtMalformedOrExpired(token) {
  if (!token || typeof token !== 'string') return true;
  const parts = token.split('.');
  if (parts.length !== 3) return true;

  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const payload = JSON.parse(atob(base64));
    if (!payload || !payload.id) return true;
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
      return true;
    }
    return false;
  } catch (e) {
    return true;
  }
}

const BROWSER_ID_KEY = 'spotinize_browser_id';
const GUEST_TOKEN_KEY = 'spotinize_guest_token';
const GUEST_DAILY_PLAYED_KEY = 'spotinize_guest_daily_played_date';

function getTodayWibString() {
  const wib = new Date(Date.now() + 7 * 3600 * 1000);
  return wib.toISOString().slice(0, 10);
}

function getOrCreateBrowserId() {
  try {
    let id = localStorage.getItem(BROWSER_ID_KEY);
    if (!id) {
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? `br_${crypto.randomUUID()}`
        : `br_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(BROWSER_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return `br_${Date.now().toString(36)}`;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('spotinize_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem('spotinize_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('spotinize_token') || null);
  const [guestToken, setGuestToken] = useState(() => localStorage.getItem(GUEST_TOKEN_KEY) || null);
  const [hasGuestPlayedDaily, setHasGuestPlayedDaily] = useState(() => localStorage.getItem(GUEST_DAILY_PLAYED_KEY) === getTodayWibString());
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(() =>
    Boolean(localStorage.getItem('spotinize_token') || localStorage.getItem('spotinize_user'))
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setGuestToken(null);
    localStorage.removeItem('spotinize_user');
    localStorage.removeItem('spotinize_token');
    localStorage.removeItem(GUEST_TOKEN_KEY);
    try {
      sessionStorage.removeItem('spotinize_active_session');
    } catch (e) {}
    socketService.disconnect();
  }, []);

  // Verify stored token & user existence on page load
  useEffect(() => {
    let cancelled = false;

    const verifyAuthSession = async () => {
      const storedToken = localStorage.getItem('spotinize_token');
      const storedUser = localStorage.getItem('spotinize_user');

      if (!storedToken && !storedUser) {
        if (!cancelled) setIsAuthChecking(false);
        return;
      }

      if (!storedToken || isJwtMalformedOrExpired(storedToken)) {
        logout();
        if (!cancelled) setIsAuthChecking(false);
        return;
      }

      try {
        const data = await ApiClient.get('/auth/me');
        if (cancelled) return;
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('spotinize_user', JSON.stringify(data.user));
        } else {
          logout();
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 401 || err?.status === 404) {
          logout();
        }
      } finally {
        if (!cancelled) setIsAuthChecking(false);
      }
    };

    verifyAuthSession();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // Listen for mid-session 401 invalid/expired auth events
  useEffect(() => {
    const handleInvalidAuth = () => {
      logout();
    };
    window.addEventListener('spotinize:auth-invalid', handleInvalidAuth);
    return () => {
      window.removeEventListener('spotinize:auth-invalid', handleInvalidAuth);
    };
  }, [logout]);

  const register = async (username, password, displayName) => {
    setIsLoading(true);
    try {
      const data = await ApiClient.post('/auth/register', { username, password, displayName });
      setUser(data.user);
      setToken(data.token);
      setGuestToken(null);
      setIsAuthChecking(false);
      localStorage.setItem('spotinize_user', JSON.stringify(data.user));
      localStorage.setItem('spotinize_token', data.token);
      localStorage.removeItem(GUEST_TOKEN_KEY);
      ApiClient.clearCache();
      socketService.refreshAuth();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const data = await ApiClient.post('/auth/login', { username, password });
      setUser(data.user);
      setToken(data.token);
      setGuestToken(null);
      setIsAuthChecking(false);
      localStorage.setItem('spotinize_user', JSON.stringify(data.user));
      localStorage.setItem('spotinize_token', data.token);
      localStorage.removeItem(GUEST_TOKEN_KEY);
      ApiClient.clearCache();
      socketService.refreshAuth();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const connectSpotify = async (customUserId = null) => {
    const targetId = customUserId || user?.id;
    const { url } = await ApiClient.get(`/auth/spotify/connect?userId=${encodeURIComponent(targetId || '')}`);
    if (url) {
      window.location.href = url;
    }
  };

  const setAuthSession = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    setIsAuthChecking(false);
    localStorage.setItem('spotinize_user', JSON.stringify(userData));
    localStorage.setItem('spotinize_token', tokenData);
    socketService.refreshAuth();
  };

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('spotinize_token');
    if (!storedToken || isJwtMalformedOrExpired(storedToken)) {
      if (storedToken || localStorage.getItem('spotinize_user')) {
        logout();
      }
      return;
    }

    try {
      const data = await ApiClient.get('/auth/me');
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('spotinize_user', JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch (err) {
      if (err?.status === 401 || err?.status === 404) {
        logout();
      }
    }
  }, [logout]);

  const loginAsGuest = async () => {
    setIsLoading(true);
    try {
      const browserId = getOrCreateBrowserId();
      const existingGuestToken = localStorage.getItem(GUEST_TOKEN_KEY);
      const data = await ApiClient.post('/auth/guest', { browserId, guestToken: existingGuestToken });
      const nextToken = data?.guestToken || existingGuestToken || `gt_${browserId}`;
      localStorage.setItem(BROWSER_ID_KEY, data?.browserId || browserId);
      localStorage.setItem(GUEST_TOKEN_KEY, nextToken);
      if (data?.hasPlayedDaily) {
        localStorage.setItem(GUEST_DAILY_PLAYED_KEY, getTodayWibString());
        setHasGuestPlayedDaily(true);
      } else {
        localStorage.removeItem(GUEST_DAILY_PLAYED_KEY);
        setHasGuestPlayedDaily(false);
      }
      setUser(null);
      setToken(null);
      localStorage.removeItem('spotinize_user');
      localStorage.removeItem('spotinize_token');
      setGuestToken(nextToken);
      setIsAuthChecking(false);
      ApiClient.clearCache();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const markGuestDailyPlayed = useCallback(() => {
    try {
      localStorage.setItem(GUEST_DAILY_PLAYED_KEY, getTodayWibString());
    } catch (e) {}
    setHasGuestPlayedDaily(true);
  }, []);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('spotinize_user', JSON.stringify(updatedUser));
  };

  const isGuest = Boolean(!user && guestToken);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isGuest,
      hasGuestPlayedDaily,
      markGuestDailyPlayed,
      requireSpotifyConnect: false,
      rawUser: user,
      isLoading,
      isAuthChecking,
      register,
      login,
      loginAsGuest,
      connectSpotify,
      setAuthSession,
      logout,
      refreshUser,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
