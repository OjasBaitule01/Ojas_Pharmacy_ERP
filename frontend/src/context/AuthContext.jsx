import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ username: 'admin', role: 'Admin', email: 'admin@ojas.com' });
  const [token, setToken] = useState('mock_bypass_token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('ojas_token', data.token);
      localStorage.setItem('ojas_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ojas_token');
    localStorage.removeItem('ojas_user');
  };

  // Automated authenticated request helper
  const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, apiRequest, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
