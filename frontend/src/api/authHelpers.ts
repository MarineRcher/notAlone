import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
    exp: number;
}

export const authHelpers = {
    saveToken: async (token: string) => {
        await SecureStore.setItemAsync("jwt", token);
    },

    getToken: async () => {
        const token = await SecureStore.getItemAsync("jwt");
        return token;
    },

    deleteToken: async () => {
        await SecureStore.deleteItemAsync("jwt");
    },

    isTokenValid: async (): Promise<boolean> => {
        try {
            const token = await SecureStore.getItemAsync("jwt");
            if (!token) return false;

            const decoded = jwtDecode<DecodedToken>(token);
            const currentTime = Date.now() / 1000;
            
            // Check if token is expired (with 30 second buffer)
            return !!(decoded.exp && decoded.exp > (currentTime + 30));
        } catch (error) {
            console.log("Error validating token:", error);
            return false;
        }
    },

    getValidToken: async (): Promise<string | null> => {
        try {
            const token = await SecureStore.getItemAsync("jwt");
            if (!token) return null;

            const decoded = jwtDecode<DecodedToken>(token);
            const currentTime = Date.now() / 1000;
            
            // Check if token is expired
            if (!decoded.exp || decoded.exp <= currentTime) {
                // Token is expired, remove it
                await SecureStore.deleteItemAsync("jwt");
                return null;
            }
            
            return token;
        } catch (error) {
            console.log("Error getting valid token:", error);
            // Invalid token, remove it
            await SecureStore.deleteItemAsync("jwt");
            return null;
        }
    },
};
