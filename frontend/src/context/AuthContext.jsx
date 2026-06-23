// @ts-nocheck
import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authAPI.login(credentials);
      if (data.requiresTwoFactor) {
        setLoading(false);
        setRequiresTwoFactor(true);
        return false;
      }
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      setUser(data.data.user);
      setIsAuthenticated(true);
      setRequiresTwoFactor(false);
      setInitialized(true);
      setLoading(false);
      return true;
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Erreur de connexion';
      setError(message);
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    setRequiresTwoFactor(false);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
      setIsAuthenticated(true);
      setInitialized(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      setInitialized(true);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    requiresTwoFactor,
    initialized,
    login,
    logout,
    fetchMe,
    clearError,
    setRequiresTwoFactor,
    setInitialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
