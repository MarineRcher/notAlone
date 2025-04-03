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
  
};

export default authService;