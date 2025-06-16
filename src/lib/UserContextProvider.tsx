import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from './api';

interface UserContextProps {
  userId: string | null;
  name: string | null;
  email: string | null;
  globalRole: string | null;
  isAuthenticated: boolean;
  setUser: (user: Partial<UserContextProps>) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextProps>({
    userId: null,
    name: null,
    email: null,
    globalRole: null,
    isAuthenticated: false,
    setUser: (userData) => setUser((prev) => ({ ...prev, ...userData })),
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await apiClient.get(`/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser({
          userId: response.data.userId,
          name: response.data.name,
          email: response.data.email,
          globalRole: response.data.globalRole,
          isAuthenticated: true,
          setUser: user.setUser,
        });
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await apiClient.post('/auth/refresh-token', null, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        localStorage.setItem('token', response.data.token);
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    };

    const interval = setInterval(refreshToken, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};
