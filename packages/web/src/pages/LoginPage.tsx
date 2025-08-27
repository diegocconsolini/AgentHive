import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { LoginInput } from '@memory-manager/shared';

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

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });

  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { accessToken, refreshToken } = data.login.tokens;
      localStorage.setItem('auth-token', accessToken);  // Fixed: use 'auth-token' key
      localStorage.setItem('refresh-token', refreshToken);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ variables: { input: formData } });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Sign In</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error.message}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="demo-credentials">
          <h3>Demo Credentials:</h3>
          <p>Email: demo@example.com</p>
          <p>Password: password123</p>
        </div>
      </div>
    </div>
  );
};