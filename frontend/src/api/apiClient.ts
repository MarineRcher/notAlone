import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { authHelpers } from "./authHelpers";
import { DecodedToken } from "../types/auth";

export const createApiClient = (refreshTokenCallback: () => Promise<void>) => {
    const instance = axios.create({
        baseURL: "http://192.168.1.155:3000/api",
        timeout: 10000,
    });

    let refreshPromise: Promise<void> | null = null;

    instance.interceptors.request.use(async (config) => {
        const token = await authHelpers.getToken();
        if (!token) return config;

        const decoded = jwtDecode<DecodedToken>(token);
        const now = Date.now() / 1000;

        if (decoded.exp < now + 300) {
            if (!refreshPromise) {
                refreshPromise = refreshTokenCallback()
                    .catch(async (error) => {
                        await authHelpers.deleteToken();
                        throw error;
                    })
                    .finally(() => {
                        refreshPromise = null;
                    });
            }
            await refreshPromise;
            config.headers.Authorization = `Bearer ${await authHelpers.getToken()}`;
        } else {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    });

    return instance;
};
