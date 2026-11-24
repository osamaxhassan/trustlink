/* eslint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { socket } from '../services/socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('trustlink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('trustlink_token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (user) {
        socket.emit('join_personal_channel', user.userId);
      }
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token, user]);

  const login = async (phoneNumber, password) => {
    const res = await api.post('/auth/login', { phoneNumber, password });
    const { token: jwtToken, user: userData } = res.data.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('trustlink_token', jwtToken);
    localStorage.setItem('trustlink_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('trustlink_token');
    localStorage.removeItem('trustlink_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
