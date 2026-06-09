import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, token, setUser, setToken, logout: clearAuth } = useAuthStore();

  const login = async (credentials: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder logic
      console.log('Logging in with', credentials);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder logic
      console.log('Registering user with', data);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
  };

  return {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
