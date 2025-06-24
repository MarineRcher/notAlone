import { createContext, useState, useEffect, ReactNode } from "react";
import { authHelpers } from "../api/authHelpers";
import { jwtDecode } from "jwt-decode";
import { View } from "react-native";

export type User = {
    id: number;
    has2FA: boolean;
    notify?: boolean;
    hourNotify?: string;
    hasPremium: boolean;
};

type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    update2FAStatus: (status: boolean) => void;
    updateNotificationSettings: (notify: boolean, hourNotify?: string) => void;
    updatePremiumStatus: (status: boolean) => void;
    checkTokenValidity: () => Promise<void>;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    update2FAStatus: () => {},
    updateNotificationSettings: () => {},
    updatePremiumStatus: () => {},
    checkTokenValidity: async () => {},
});

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const update2FAStatus = (status: boolean) => {
        setUser((prev) => (prev ? { ...prev, has2FA: status } : null));
    };
    const updatePremiumStatus = (status: boolean) => {
        setUser((prev) => (prev ? { ...prev, hasPremium: status } : null));
    };
    const updateNotificationSettings = (
        notify: boolean,
        hourNotify?: string
    ) => {
        setUser((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                notify,
                hourNotify: hourNotify || prev.hourNotify,
            };
        });
    };

    const checkTokenValidity = async () => {
        const isValid = await authHelpers.isTokenValid();
        if (!isValid && user) {
            // Token is invalid and we have a user set, clear it
            setUser(null);
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            const token = await authHelpers.getToken();
            if (token) {
                try {
                    const decoded = jwtDecode<User & { exp: number }>(token);
                    
                    // Check if token is expired
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < currentTime) {
                        // Token is expired, remove it and don't set user
                        console.log("Token expired, removing from storage");
                        await authHelpers.deleteToken();
                        setUser(null);
                        return;
                    }
                    
                    setUser(decoded);
                } catch (error) {
                    // Invalid token, remove it
                    console.log("Invalid token, removing from storage");
                    await authHelpers.deleteToken();
                    setUser(null);
                }
            }
        };
        loadUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                update2FAStatus,
                updateNotificationSettings,
                updatePremiumStatus,
                checkTokenValidity,
            }}
        >
            <View style={{ flex: 1 }}>{children}</View>
        </AuthContext.Provider>
    );
}
