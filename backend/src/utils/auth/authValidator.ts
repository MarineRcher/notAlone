import validator from "validator";

/**
 * Validates the input data for a email/login.
 *
 * @param loginOrEmail - The user's login or email.
 * @returns An object containing a boolean `isValid` and any validation `errors`.
 */
export const validateLoginOrEmail = (
    loginOrEmail: string
): string | undefined => {
    if (!loginOrEmail.trim()) {
        return "Le login ou l'email est requis";
    } else if (loginOrEmail.includes("@")) {
        if (!validator.isEmail(loginOrEmail)) {
            return "Format d'email invalide";
        }
    } else {
        if (!validator.matches(loginOrEmail, /^[a-zA-Z0-9_-]{3,20}$/)) {
            return "Login invalide (caractères autorisés: a-z, 0-9, -, _)";
        }
    }
    return undefined;
};
