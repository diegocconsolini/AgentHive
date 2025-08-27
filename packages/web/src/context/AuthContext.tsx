import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import type { AuthState, User } from '../types';

const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      role
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        name
        role
      }
      tokens {
        accessToken
        refreshToken
        expiresIn
      }
    }
  }
`;

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const { data, loading, error, refetch } = useQuery(GET_ME, {
    errorPolicy: 'ignore', // Don't throw errors for unauthenticated requests
    notifyOnNetworkStatusChange: true,
  });

  const [loginMutation] = useMutation(LOGIN_MUTATION);

  useEffect(() => {
    // Check if user has a token
    const token = localStorage.getItem('auth-token');
    
    if (!token) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      return;
    }

    if (data?.me) {
      setAuthState({
        isAuthenticated: true,
        user: data.me,
        loading: false,
        error: null,
      });
    } else if (!loading) {
      // Token exists but query failed or returned no user
      if (error) {
        localStorage.removeItem('auth-token');
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: 'Authentication expired. Please log in again.',
        });
      }
    }
  }, [data, loading, error]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data: loginData } = await loginMutation({
        variables: { input: { email, password } },
      });

      if (loginData?.login?.tokens?.accessToken) {
        localStorage.setItem('auth-token', loginData.login.tokens.accessToken);
        setAuthState({
          isAuthenticated: true,
          user: loginData.login.user,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};