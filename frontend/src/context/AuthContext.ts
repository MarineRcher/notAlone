import { useEffect } from "react";
import { authHelpers } from "../api/authHelpers";
import { getApiClient } from "../api/apiInstance";

export const useAuthCheck = () => {
    useEffect(() => {
        const checkAuth = async () => {
            const token = await authHelpers.getToken();
            if (token) {
                try {
                    await getApiClient().get("/auth/me");
                } catch (error) {
                    await authHelpers.deleteToken();
                }
            }
        };
        checkAuth();
    }, []);
};
