import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // TODO: Implement actual authentication with a backend service
      // This is a mock implementation
      const mockUser = {
        id: '123',
        email,
        name: 'Test User',
      };

      await AsyncStorage.setItem('@user_data', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error('Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // TODO: Implement actual user registration with a backend service
      // This is a mock implementation
      const mockUser = {
        id: '123',
        email,
        name,
      };

      await AsyncStorage.setItem('@user_data', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error('Failed to sign up');
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('@user_data');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
