import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiClient from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spotinize_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('spotinize_token') || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Refresh user profile & stats
      ApiClient.get(`/profile/${user.id}`)
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('spotinize_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  const register = async (username, password, displayName) => {
    setIsLoading(true);
    try {
      const data = await ApiClient.post('/auth/register', { username, password, displayName });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('spotinize_user', JSON.stringify(data.user));
      localStorage.setItem('spotinize_token', data.token);
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
      localStorage.setItem('spotinize_user', JSON.stringify(data.user));
      localStorage.setItem('spotinize_token', data.token);
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
    localStorage.setItem('spotinize_user', JSON.stringify(userData));
    localStorage.setItem('spotinize_token', tokenData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('spotinize_user');
    localStorage.removeItem('spotinize_token');
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const data = await ApiClient.get(`/profile/${user.id}`);
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('spotinize_user', JSON.stringify(data.user));
      }
    } catch (e) {}
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('spotinize_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!user.spotifyConnected,
      requireSpotifyConnect: !!user && !user.spotifyConnected,
      rawUser: user,
      isLoading,
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
