export interface DecodedToken {
    exp: number;
}

export interface AuthTokens {
    token: string;
    refreshToken?: string;
}
export type ApiError = {
    response: {
        data: {
            message?: string;
            token?: string;
        };
    };
};
