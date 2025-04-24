import axios from "axios";
import * as SecureStore from "expo-secure-store";

const apiClient = axios.create({
    baseURL: "http://192.168.1.155:3000/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});
apiClient.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync("jwt");
    if (token) {
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
