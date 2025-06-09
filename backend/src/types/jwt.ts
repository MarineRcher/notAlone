export interface JwtPayload {
    id: number;
    login: string;
    has2FA: boolean;
    [key: string]: any;
}
