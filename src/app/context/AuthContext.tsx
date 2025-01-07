"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface User {
  id: number;
  username: string;
  email: string;
  nickname: string;
}

interface LoginResponse {
  user: User;
  jwt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (!storedUser || !storedToken) {
          return;
        }

        try {
          const parsedUser = JSON.parse(storedUser);
          if (isValidUser(parsedUser)) {
            setUser(parsedUser);
            setToken(storedToken);
          } else {
            clearStorage();
          }
        } catch (parseError) {
          console.error('Failed to parse stored user:', parseError);
          clearStorage();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearStorage();
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const isValidUser = (user: unknown): user is User => {
    if (!user || typeof user !== 'object') return false;
    
    const userObj = user as Record<string, unknown>;
    
    return (
      typeof userObj.id === 'number' &&
      typeof userObj.username === 'string' &&
      typeof userObj.email === 'string' &&
      typeof userObj.nickname === 'string'
    );
  };

  const clearStorage = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  };

  const login = (response: LoginResponse) => {
    try {
      console.log('Login Response:', response);
      console.log('User Data:', response.user);
      console.log('JWT Token:', response.jwt);

      if (!response.user || !response.jwt) {
        console.error('Missing user or token in response');
        throw new Error('Invalid login response');
      }

      setUser(response.user);
      setToken(response.jwt);

      try {
        const userString = JSON.stringify(response.user);
        console.log('Storing user data:', userString);

        localStorage.setItem('user', userString);
        localStorage.setItem('token', response.jwt);
        
        console.log('Stored user:', localStorage.getItem('user'));
        console.log('Stored token:', localStorage.getItem('token'));
      } catch (storageError) {
        console.error('Failed to save to localStorage:', storageError);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('로그인 처리 중 오류가 발생했습니다.');
    }
  };

  const logout = () => {
    clearStorage();
    toast.info('로그아웃 되었습니다.');
  };

  if (!isInitialized) {
    return null; // 또는 로딩 컴포넌트
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoggedIn: !!user && !!token, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
