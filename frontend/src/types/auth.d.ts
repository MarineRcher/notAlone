export interface DecodedToken {
    exp: number;
}

export interface AuthTokens {
    token: string;
    refreshToken?: string;
}
