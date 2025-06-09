import apiClient from "./apiClient";
import { authHelpers } from "./authHelpers";

const userService = {
    activateNotifications: async () => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/users/activateNotifs", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
    hourNotifications: async (data: { hour: string }) => {
        const token = await authHelpers.getToken();
        if (!token) throw new Error("Token non disponible");

        const response = await apiClient.post("/users/hourNotifs", data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};

export default userService;
