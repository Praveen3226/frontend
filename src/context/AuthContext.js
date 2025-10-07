import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL;

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') localStorage.setItem('token', token || '');
  }, [token]);

  const login = (tok) => setToken(tok);
  const logout = () => { setToken(null); if (typeof window !== 'undefined') localStorage.removeItem('token'); };

  return (
    <AuthContext.Provider value={{ token, login, logout, loading, setLoading, API }}>
      {children}
    </AuthContext.Provider>
  );
}
