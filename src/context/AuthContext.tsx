import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiService } from '../utils/api';
import { UserRole } from '../types/db';

interface AuthUser {
  id: string;
  fullname: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullname: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of current logged in user
    const checkAuth = async () => {
      const token = ApiService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await ApiService.get('/auth/me');
        setUser(data.user);
        setProfile(data.profile);
      } catch (err: any) {
        console.error('Check auth failed, clearing token:', err);
        ApiService.removeToken();
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.post('/auth/login', { email, password });
      ApiService.setToken(data.token);
      
      // Immediately fetch complete details
      const meData = await ApiService.get('/auth/me');
      setUser(meData.user);
      setProfile(meData.profile);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullname: string, email: string, password: string, role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.post('/auth/register', { fullname, email, password, role });
      ApiService.setToken(data.token);
      
      // Immediately fetch complete details
      const meData = await ApiService.get('/auth/me');
      setUser(meData.user);
      setProfile(meData.profile);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    ApiService.removeToken();
    setUser(null);
    setProfile(null);
    setError(null);
  };

  const refreshUser = async () => {
    try {
      const meData = await ApiService.get('/auth/me');
      setUser(meData.user);
      setProfile(meData.profile);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
