import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

export interface RegisterData {
    login: string;
    email: string;
    password: string;
    hasPremium?: boolean;
    has2FA?: boolean;
    isBlocked?: boolean;
}
export interface LoginData {
    loginOrEmail: string;
    password: string;
}

export interface newPasswordData {
    email: string;
    oldPassword: string;
    newPassword: string;
}

export const authService = {
    register: async (userData: RegisterData) => {
        const response = await apiClient.post("/auth/register", userData);
        await authHelpers.saveToken(response.data.token);
        return response;
    },
    login: async (userData: LoginData) => {
        const response = await apiClient.post("/auth/login", userData);

        if (!response.data.requiresTwoFactor) {
            await authHelpers.saveToken(response.data.token);
        }
        return response;
    },
    logout: async () => {
        await authHelpers.deleteToken();
    },
    changePassword: async (userData: newPasswordData) => {
        return await apiClient.post("/auth/changePassword", userData);
    },
    generate2FASecret: () => apiClient.post("/auth/2fa/generate"),
    verify2FASetup: (data: { token: string; otp: string }) =>
        apiClient.post("/auth/2fa/verify-setup", data),
    verify2FALogin: (data: { tempToken: string; otp: string }) =>
        apiClient.post("/auth/2fa/verify-login", data),
    disable2FA: (data: { userId: string; otp: string }) =>
        apiClient.post("/auth/2fa/disable", data),
};

export default authService;
