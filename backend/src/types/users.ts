export interface UserAttributes {
    id: number;
    login: string;
    email: string;
    password: string;
    hasPremium: boolean;
    has2FA: boolean;
    twoFactorSecret: string | null;
    isBlocked: boolean;
    notify: boolean;
    hourNotify: Date | null;
    failedLoginAttempts: number;
    blockedUntil: Date | null;
    points: number;

    createdAt?: Date;
    updatedAt?: Date;
}
export interface LoginRequestBody {
    loginOrEmail: string;
}
