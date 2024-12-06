import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@GroundSchoolAI:user');
      const token = await AsyncStorage.getItem('@GroundSchoolAI:token');
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user, token } = await auth.login({ email, password });
      await AsyncStorage.setItem('@GroundSchoolAI:user', JSON.stringify(user));
      await AsyncStorage.setItem('@GroundSchoolAI:token', token);
      setUser(user);
    } catch (error) {
      console.error('Error signing in:', error);
      throw new Error('Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { user, token } = await auth.register({ email, password, name });
      await AsyncStorage.setItem('@GroundSchoolAI:user', JSON.stringify(user));
      await AsyncStorage.setItem('@GroundSchoolAI:token', token);
      setUser(user);
    } catch (error) {
      console.error('Error signing up:', error);
      throw new Error('Failed to sign up');
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.multiRemove(['@GroundSchoolAI:user', '@GroundSchoolAI:token']);
      auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
