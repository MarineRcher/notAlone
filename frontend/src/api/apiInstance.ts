import { authHelpers } from "./authHelpers";
import { createApiClient } from "./apiClient";
import { authService } from "./authService";

let apiClient: ReturnType<typeof createApiClient>;

export const initApiClient = () => {
    if (!apiClient) {
        apiClient = createApiClient(async () => {
            await authService.refreshToken();
        });
    }
    return apiClient;
};

export const getApiClient = () => {
    if (!apiClient) throw new Error("API Client non initialisé");
    return apiClient;
};
