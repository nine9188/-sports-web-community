'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '@/shared/context/AuthContext';

interface UserProfileModalContextType {
  openProfileModal: (publicId: string) => void;
  closeProfileModal: () => void;
}

const UserProfileModalContext = createContext<UserProfileModalContextType | null>(null);

export function UserProfileModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [publicId, setPublicId] = useState<string | null>(null);
  const { user } = useAuth();

  const openProfileModal = useCallback((id: string) => {
    setPublicId(id);
    setIsOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setIsOpen(false);
    setPublicId(null);
  }, []);

  return (
    <UserProfileModalContext.Provider value={{ openProfileModal, closeProfileModal }}>
      {children}
      {publicId && (
        <UserProfileModal
          publicId={publicId}
          isOpen={isOpen}
          onClose={closeProfileModal}
          currentUserId={user?.id}
        />
      )}
    </UserProfileModalContext.Provider>
  );
}

export function useUserProfileModal() {
  const context = useContext(UserProfileModalContext);
  if (!context) {
    throw new Error('useUserProfileModal must be used within UserProfileModalProvider');
  }
  return context;
}
