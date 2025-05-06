import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";

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
};
