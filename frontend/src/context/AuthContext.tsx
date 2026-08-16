import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  pin: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginWithPassword: (email: string, pass: string) => { success: boolean; error?: string };
  loginWithPin: (email: string, pin: string) => { success: boolean; error?: string };
  registerUser: (name: string, email: string, pass: string, pin: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('stockies_user');
    const isLoggedIn = localStorage.getItem('stockies_logged_in');
    if (savedUser && isLoggedIn === 'true') {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const loginWithPassword = (email: string, pass: string) => {
    const savedUserStr = localStorage.getItem(`stockies_reg_${email.toLowerCase().trim()}`);
    if (!savedUserStr) {
      return { success: false, error: 'User does not exist. Please register first.' };
    }
    const savedUser = JSON.parse(savedUserStr) as User;
    if (savedUser.password !== pass) {
      return { success: false, error: 'Incorrect password.' };
    }
    setUser(savedUser);
    setIsAuthenticated(true);
    localStorage.setItem('stockies_user', JSON.stringify(savedUser));
    localStorage.setItem('stockies_logged_in', 'true');
    return { success: true };
  };

  const loginWithPin = (email: string, pin: string) => {
    const savedUserStr = localStorage.getItem(`stockies_reg_${email.toLowerCase().trim()}`);
    if (!savedUserStr) {
      return { success: false, error: 'User does not exist. Please register first.' };
    }
    const savedUser = JSON.parse(savedUserStr) as User;
    if (savedUser.pin !== pin) {
      return { success: false, error: 'Incorrect 4-digit PIN.' };
    }
    setUser(savedUser);
    setIsAuthenticated(true);
    localStorage.setItem('stockies_user', JSON.stringify(savedUser));
    localStorage.setItem('stockies_logged_in', 'true');
    return { success: true };
  };

  const registerUser = (name: string, email: string, pass: string, pin: string) => {
    const key = `stockies_reg_${email.toLowerCase().trim()}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      return { success: false, error: 'User with this email is already registered.' };
    }
    const newUser: User = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: pass,
      pin: pin.trim(),
    };
    localStorage.setItem(key, JSON.stringify(newUser));
    // Auto-login after registration
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('stockies_user', JSON.stringify(newUser));
    localStorage.setItem('stockies_logged_in', 'true');
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('stockies_user');
    localStorage.setItem('stockies_logged_in', 'false');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loginWithPassword, loginWithPin, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
