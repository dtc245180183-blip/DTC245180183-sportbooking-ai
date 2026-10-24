import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Validate token by calling /auth/me; clear stale/expired sessions
      authAPI.getMe()
        .then((me) => {
          localStorage.setItem('user_info', JSON.stringify(me));
          setUser(me);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_info');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    localStorage.setItem('access_token', data.access_token);
    const me = await authAPI.getMe();
    localStorage.setItem('user_info', JSON.stringify(me));
    setUser(me);
    return me;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
