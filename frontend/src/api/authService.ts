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
	loginOrEmail: string;
	oldPassword: string;
	newPassword: string;
}

const authService = {
	register: async (userData: RegisterData) =>
	{
		const response = await apiClient.post("/auth/register", userData);

		if (response.data.token)
		{
			await authHelpers.saveToken(response.data.token);
		}
		return response;
	},

	login: async (userData: LoginData) =>
	{
		const response = await apiClient.post("/auth/login", userData);

		if (!response.data.requiresTwoFactor && response.data.token)
		{
			await authHelpers.saveToken(response.data.token);
		}
		return response;
	},

	logout: async () =>
	{
		await authHelpers.deleteToken();
	},

	changePassword: async (userData: newPasswordData) =>
	{
		return await apiClient.post("/auth/changePassword", userData);
	},

	generate2FASecret: () => apiClient.post("/auth/2fa/generate"),

	verify2FASetup: async (data: { token: string; otp: string }) =>
	{
		const response = await apiClient.post("/auth/2fa/verify-setup", data);

		if (response.data.token)
		{
			await authHelpers.saveToken(response.data.token);
		}
		return response;
	},

	verify2FALogin: async (data: { tempToken: string; otp: string }) =>
	{
		const response = await apiClient.post("/auth/2fa/verify-login", data);

		if (response.data.token)
		{
			await authHelpers.saveToken(response.data.token);
		}
		return response;
	},

	disable2FA: async (data: { userId: string; otp: string }) =>
	{
		const response = await apiClient.post("/auth/2fa/disable", data);

		if (response.data.token)
		{
			await authHelpers.saveToken(response.data.token);
		}
	},
};

const refreshToken = async () =>
{
	const token = await authHelpers.getToken();

	if (!token)
	{
		throw new Error("No token available");
	}

	const response = await apiClient.post("/auth/refresh");

	if (response.data.token)
	{
		await authHelpers.saveToken(response.data.token);
	}
	return response.data.token;
};

export { authService, refreshToken };
