import React, { createContext, useState, ReactNode, useContext } from 'react';
import { User } from '../types/User';
import { supabase } from '../lib/supabase';

interface Branch {
  id: string;
  brandName: string;
  branchName: string;
  address?: string;
  openTime?: string;
  closeTime?: string;
  capacity?: number;
  storeCategory?: string;
}

interface AppContextType {
  userInfo: (User & { branches?: Branch[]; activeBranchId?: string }) | null;
  userStatus: User['status'] | null;
  hasSelectedBranch: boolean;
  login: (user: User, hasBranch: boolean) => void;
  logout: () => void;
  setHasSelectedBranch: (hasBranch: boolean) => void;
  setActiveBranch: (branchId: string) => void;
  updateUserInfo: (data: Partial<User & { branches?: Branch[]; activeBranchId?: string }>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [userInfo, setUserInfo] = useState<(User & { branches?: Branch[]; activeBranchId?: string }) | null>(null);
  const [userStatus, setUserStatus] = useState<User['status'] | null>(null);
  const [hasSelectedBranch, setHasSelectedBranchState] = useState<boolean>(false);

  const login = (user: User, hasBranch: boolean) => {
    setUserInfo(user);
    setUserStatus(user.status);
    setHasSelectedBranchState(hasBranch);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserInfo(null);
    setUserStatus(null);
    setHasSelectedBranchState(false);
  };

  const setHasSelectedBranch = (hasBranch: boolean) => {
    setHasSelectedBranchState(hasBranch);
  };

  const setActiveBranch = (branchId: string) => {
    setUserInfo(prevUserInfo => 
      prevUserInfo ? { ...prevUserInfo, activeBranchId: branchId } : null
    );
  };

  const updateUserInfo = (data: Partial<User & { branches?: Branch[]; activeBranchId?: string }>) => {
    setUserInfo(prev => prev ? { ...prev, ...data } : null);
  };

  const value = {
    userInfo,
    userStatus,
    hasSelectedBranch,
    login,
    logout,
    setHasSelectedBranch,
    setActiveBranch,
    updateUserInfo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};