import React, { createContext, useState, useEffect, useContext } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Fetch user profile on mount
      ApiService.get('/users/me')
        .then(res => {
          if (res.success) {
            setUser(res.data);
          }
        })
        .catch(err => {
          console.error('Session restore failed:', err);
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await ApiService.post('/auth/login', { email, password });
      if (res.success) {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);
        setUser(res.data.user);
      }
      return res;
    } catch (e) {
      setLoading(false);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async (display_name, email, password) => {
    setLoading(true);
    try {
      const res = await ApiService.post('/auth/register', { display_name, email, password });
      if (res.success) {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);
        setUser(res.data.user);
      }
      return res;
    } catch (e) {
      setLoading(false);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const guestLogin = async (displayName) => {
    setLoading(true);
    try {
      const res = await ApiService.post('/auth/guest', { display_name: displayName });
      if (res.success) {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);
        setUser(res.data.user);
      }
      return res;
    } catch (e) {
      setLoading(false);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, guestLogin, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
