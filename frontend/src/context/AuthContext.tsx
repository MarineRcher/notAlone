import { createContext, useState, useEffect, ReactNode } from "react";
import { authHelpers } from "../api/authHelpers";
import { jwtDecode } from "jwt-decode";
import { View } from "react-native";

type User = {
    id: number;
    has2FA: boolean;
};

type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    update2FAStatus: (status: boolean) => void;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    update2FAStatus: () => {},
});

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const update2FAStatus = (status: boolean) => {
        setUser((prev) => (prev ? { ...prev, has2FA: status } : null));
    };

    useEffect(() => {
        const loadUser = async () => {
            const token = await authHelpers.getToken();
            if (token) {
                const decoded = jwtDecode<User>(token);
                setUser(decoded);
            }
        };
        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, update2FAStatus }}>
            <View style={{ flex: 1 }}>{children}</View>
        </AuthContext.Provider>
    );
}
