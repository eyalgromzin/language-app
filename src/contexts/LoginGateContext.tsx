import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import wordCountService from '../services/wordCountService';

interface LoginGateState {
  shouldShowLoginGate: boolean;
  isLoginGateVisible: boolean;
  showLoginGate: () => void;
  hideLoginGate: () => void;
  checkLoginGate: () => Promise<void>;
}

const LoginGateContext = createContext<LoginGateState | undefined>(undefined);

export const useLoginGate = () => {
  const context = useContext(LoginGateContext);
  if (context === undefined) {
    throw new Error('useLoginGate must be used within a LoginGateProvider');
  }
  return context;
};

export const LoginGateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoginGateVisible, setIsLoginGateVisible] = useState(false);
  const { isAuthenticated } = useAuth();

  console.log('[LoginGateProvider] Rendering with isAuthenticated:', isAuthenticated, 'isLoginGateVisible:', isLoginGateVisible);

  const checkLoginGate = async () => {
    try {
      await wordCountService.initialize();
      const shouldShow = wordCountService.shouldShowLoginGate() && !isAuthenticated;
      
      if (shouldShow) {
        setIsLoginGateVisible(true);
      }
    } catch (error) {
      console.log('[LoginGateContext] Error checking login gate:', error);
    }
  };

  const showLoginGate = () => {
    console.log('[LoginGateContext] showLoginGate called');
    if (!isAuthenticated) {
      setIsLoginGateVisible(true);
    }
  };

  const hideLoginGate = () => {
    console.log('[LoginGateContext] hideLoginGate called');
    setIsLoginGateVisible(false);
  };

  // Hide login gate when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[LoginGateContext] User authenticated, hiding login gate');
      setIsLoginGateVisible(false);
    }
  }, [isAuthenticated]);

  const value: LoginGateState = {
    shouldShowLoginGate: isLoginGateVisible,
    isLoginGateVisible,
    showLoginGate,
    hideLoginGate,
    checkLoginGate,
  };

  return <LoginGateContext.Provider value={value}>{children}</LoginGateContext.Provider>;
};
