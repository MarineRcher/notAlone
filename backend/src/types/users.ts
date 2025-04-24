export interface IUser {
    id?: number;
    login: string;
    email: string;
    password: string;
    hasPremium?: boolean;
    has2FA?: boolean;
    twoFactorSecret?: string | null;
    isBlocked?: boolean;
    notify?: boolean;
    hourNotify?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}
