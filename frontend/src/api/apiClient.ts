import axios from "axios";
import { jwtDecode } from "jwt-decode";
import authService from "./authService";
import { authHelpers } from "./authHelpers";

interface DecodedToken {
    exp: number;
}

const apiClient = axios.create({
    baseURL: "http://192.168.1.139:3000/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

let refreshTokenPromise: Promise<any> | null = null;

apiClient.interceptors.request.use(async (config) => {
    const token = await authHelpers.getToken();
    if (!token) return config;

    const decoded = jwtDecode<DecodedToken>(token);
    const now = Date.now() / 1000;

    if (decoded.exp < now + 300) {
        if (!refreshTokenPromise) {
            refreshTokenPromise = authService
                .refreshToken()
                .then(() => {})
                .catch(async (error) => {
                    await authHelpers.deleteToken();
                    throw error;
                })
                .finally(() => {
                    refreshTokenPromise = null;
                });
        }

        await refreshTokenPromise;
        const newToken = await authHelpers.getToken();
        config.headers.Authorization = `Bearer ${newToken}`;
    } else {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error);
        return Promise.reject(error);
    }
);

export default apiClient;
