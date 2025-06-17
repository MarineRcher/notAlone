import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { authHelpers } from "./authHelpers";

interface DecodedToken {
    exp: number;
}

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

const apiClient = axios.create({
    baseURL: "http://192.168.1.190:3000/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Intercepteur de requête
apiClient.interceptors.request.use(
    async (config) => {
        // Routes qui ne nécessitent pas d'authentification
        const publicRoutes = [
            "/auth/register",
            "/auth/login",
            "/auth/changePassword",
            "/auth/refresh",
        ];

        // Si c'est une route publique, passer directement
        if (publicRoutes.some((route) => config.url?.startsWith(route))) {
            return config;
        }

        // Récupérer le token
        const token = await authHelpers.getToken();
        if (!token) {
            return config;
        }

        try {
            const decoded = jwtDecode<DecodedToken>(token);
            const now = Date.now() / 1000;

            // Si le token expire dans moins de 5 minutes, on le rafraîchit
            if (decoded.exp < now + 300) {
                if (isRefreshing) {
                    // Si un refresh est déjà en cours, attendre
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        config.headers.Authorization = `Bearer ${token}`;
                        return config;
                    });
                }

                isRefreshing = true;

                try {
                    // Appel direct à l'API de refresh pour éviter la boucle
                    const response = await axios.post(
                        "http://192.168.1.155:3000/api/auth/refresh",
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    const newToken = response.data.token;
                    await authHelpers.saveToken(newToken);

                    processQueue(null, newToken);
                    config.headers.Authorization = `Bearer ${newToken}`;
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    await authHelpers.deleteToken();
                    throw refreshError;
                } finally {
                    isRefreshing = false;
                }
            } else {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Token decode error:", error);
            await authHelpers.deleteToken();
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur de réponse
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.error("API Error:", error);

        // Log détaillé pour le debugging
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);

            // Si le token est expiré ou invalide
            if (error.response.status === 401) {
                await authHelpers.deleteToken();
            }
        } else if (error.request) {
            console.error("Request error - No response received");
            console.error("Request details:", {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL,
            });
        } else {
            console.error("Error message:", error.message);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
