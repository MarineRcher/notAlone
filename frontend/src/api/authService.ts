import apiClient from './apiClient';

export interface RegisterData {
  login: string;
  email: string;
  password: string;
  hasPremium?: boolean;
  has2FA?: boolean;
  isBlocked?: boolean;
}

export const authService = {
  register: async (userData: RegisterData) => {
    return await apiClient.post('/auth/register', userData);
  },
  
  // Vous pourrez ajouter d'autres méthodes comme login, resetPassword, etc.
};

export default authService;