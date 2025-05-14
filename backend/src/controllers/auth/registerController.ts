import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import validator from "validator";
import isPasswordCompromised from "../../utils/auth/isPasswordCompromised";
import logger from "../../config/logger";
import { generateToken } from "../../services/JwtServices";

/**
 * Validates user input for registration:
 * - Checks login, email, and password format
 * - Enforces password strength
 * - Optionally checks for compromised passwords
 *
 * @param login - The user's desired login
 * @param email - The user's email address
 * @param password - The user's password
 * @returns An object containing isValid boolean and error messages
 */
const validateRegisterData = async (
    login: string,
    email: string,
    password: string
) => {
    const errors: { login?: string; email?: string; password?: string } = {};

    // Validation du login
    if (!login.trim()) {
        errors.login = "Le login est requis";
    } else if (!validator.matches(login, /^[a-zA-Z0-9_-]{3,20}$/)) {
        errors.login = "Login invalide (caractères autorisés: a-z, 0-9, -, _)";
    }

    // Validation de l'email
    if (!email.trim()) {
        errors.email = "L'email est requis";
    } else if (!validator.isEmail(email)) {
        errors.email = "Format d'email invalide";
    }

    // Validation du mot de passe
    if (!password) {
        errors.password = "Le mot de passe est requis";
    } else if (
        !validator.isStrongPassword(password, {
            minLength: 12,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })
    ) {
        errors.password =
            "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial";
    } else if (await isPasswordCompromised(password)) {
        errors.password =
            "Ce mot de passe a été compromis. Choisissez-en un autre.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Handles user registration:
 * - Validates input fields
 * - Checks for duplicate login/email
 * - Hashes password securely
 * - Creates user in database
 * - Returns JWT token
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { login, email, password, hasPremium, has2FA, isBlocked } =
            req.body;

        logger.info("Tentative d'inscription", {
            login,
            email,
            ip: req.ip,
            timestamp: new Date(),
        });

        // Validation des données
        const { isValid, errors } = await validateRegisterData(
            login,
            email,
            password
        );
        if (!isValid) {
            logger.warn("Échec de validation du formulaire d'inscription", {
                errors,
                ip: req.ip,
            });
            res.status(400).json({
                message: "Données d'inscription invalides",
                errors,
            });
            return;
        }

        // Vérification de l'unicité de l'email
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            logger.warn("Échec d'inscription - Email déjà utilisé", {
                email,
                ip: req.ip,
            });
            res.status(400).json({
                message: "Un utilisateur avec cet email existe déjà",
                errors: { email: "Un utilisateur avec cet email existe déjà" },
            });
            return;
        }

        // Vérification de l'unicité du login
        const existingLogin = await User.findOne({ where: { login } });
        if (existingLogin) {
            logger.warn("Échec d'inscription - Login déjà utilisé", {
                login,
                ip: req.ip,
            });
            res.status(400).json({
                message: "Un utilisateur avec ce login existe déjà",
                errors: { login: "Un utilisateur avec ce login existe déjà" },
            });
            return;
        }

        // Sécurisation du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Création de l'utilisateur
        const sanitizedLogin = validator.escape(login.trim());
        const normalizedEmail = validator.normalizeEmail(email) || email;

        const newUser = await User.create({
            login: sanitizedLogin,
            email: normalizedEmail,
            password: hashedPassword,
            hasPremium: hasPremium || false,
            has2FA: has2FA || false,
            isBlocked: isBlocked || false,
        });

        // Génération du token
        const token = generateToken(
            { id: newUser.id, login: newUser.login },
            "24h"
        );

        logger.info("Inscription réussie", {
            userId: newUser.id,
            login: sanitizedLogin,
            ip: req.ip,
        });

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            token,
        });
    } catch (error) {
        logger.error("Erreur lors de l'inscription", {
            error: error,
            ip: req.ip,
        });
        next(error);
    }
};
