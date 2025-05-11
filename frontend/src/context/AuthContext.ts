import { useEffect } from "react";
import { authHelpers } from "../api/authHelpers";
import apiClient from "../api/apiClient";

export const useAuthCheck = () => {
    useEffect(() => {
        const checkAuth = async () => {
            const token = await authHelpers.getToken();
            if (token) {
                try {
                    await apiClient.get("/auth/me");
                } catch (error) {
                    await authHelpers.deleteToken();
                }
            }
        };
        checkAuth();
    }, []);
};
