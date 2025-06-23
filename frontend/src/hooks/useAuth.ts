import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    user: context.user,
    setUser: context.setUser,
    update2FAStatus: context.update2FAStatus,
    updateNotificationSettings: context.updateNotificationSettings,
    updatePremiumStatus: context.updatePremiumStatus,
    isAuthenticated: !!context.user,
  };
};
