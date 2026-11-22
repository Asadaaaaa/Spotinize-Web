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
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(() =>
    Boolean(localStorage.getItem('spotinize_token') || localStorage.getItem('spotinize_user'))
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('spotinize_user');
    localStorage.removeItem('spotinize_token');
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
      setIsAuthChecking(false);
      localStorage.setItem('spotinize_user', JSON.stringify(data.user));
      localStorage.setItem('spotinize_token', data.token);
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
      setIsAuthChecking(false);
      localStorage.setItem('spotinize_user', JSON.stringify(data.user));
      localStorage.setItem('spotinize_token', data.token);
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

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('spotinize_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      requireSpotifyConnect: false,
      rawUser: user,
      isLoading,
      isAuthChecking,
      register,
      login,
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
