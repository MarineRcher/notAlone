import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

const userService = {
    activatePremium: async () => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/users/activatePremium", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.token) {
            await authHelpers.saveToken(response.data.token);
        }
        return response.data;
    },
    deactivatePremium: async () => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/users/deactivatePremium", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.token) {
            await authHelpers.saveToken(response.data.token);
        }
        return response.data;
    },
    activateNotifications: async () => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/users/activateNotifs", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.token) {
            await authHelpers.saveToken(response.data.token);
        }
        return response.data;
    },
    deactivateNotifications: async () => {
        const token = await authHelpers.getToken();
        const response = await apiClient.post(
            "/users/deactivateNotifs",
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        if (response.data.token) {
            await authHelpers.saveToken(response.data.token);
        }
        return response.data;
    },
    hourNotifications: async (data: { hour: string }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/users/hourNotifs", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.token) {
            await authHelpers.saveToken(response.data.token);
        }
        return response.data;
    },
    changeEmail: async (data: { newEmail: string }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/users/changeEmail", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
    deleteUserAccount: async () => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.delete("/users/delete", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};

export default userService;
