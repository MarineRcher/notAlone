export interface JwtPayload {
    id: string;
    login: string;
    has2FA: boolean;
    [key: string]: any;
}
