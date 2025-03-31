import { Request, Response } from "express";
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../../models/Users");
const jwt = require("jsonwebtoken");

/**
 * Génère un secret pour l'authentification à deux facteurs
 */
const generate2FASecret = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        
        // Vérifier si l'utilisateur existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                message: "Utilisateur non trouvé"
            });
        }
        
        // Générer un secret unique
        const secret = speakeasy.generateSecret({
            name: `MonApplication:${user.email}` // Format: Service:email
        });
        
        // Générer un QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        
        // Stocker temporairement le secret (ne pas enregistrer en base de données pour l'instant)
        // L'utilisateur devra vérifier qu'il peut générer un code valide avant qu'on ne le sauvegarde
        
        // Générer un token temporaire contenant le secret
        const tempToken = jwt.sign(
            { 
                userId: user.id,
                secret: secret.base32,
                setupPhase: true
            },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );
        
        return res.status(200).json({
            message: "Secret 2FA généré avec succès",
            tempToken,
            qrCodeUrl,
            secret: secret.base32 // Ce secret doit être affiché à l'utilisateur comme code de secours
        });
    } catch (error) {
        console.error("Erreur lors de la génération du secret 2FA:", error);
        return res.status(500).json({
            message: "Erreur lors de la génération du secret 2FA",
            error: error
        });
    }
};

/**
 * Vérifie le code 2FA fourni par l'utilisateur et active la 2FA pour son compte
 */
const verify2FASetup = async (req: Request, res: Response) => {
    try {
        const { token, otp } = req.body;
        
        // Décoder le token pour obtenir les informations
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                message: "Token invalide ou expiré"
            });
        }
        
        // Vérifier que c'est bien un token de configuration
        if (!decoded.setupPhase || !decoded.secret) {
            return res.status(400).json({
                message: "Token invalide pour la configuration 2FA"
            });
        }
        
        // Vérifier le code OTP fourni
        const isValid = speakeasy.totp.verify({
            secret: decoded.secret,
            encoding: 'base32',
            token: otp
        });
        
        if (!isValid) {
            return res.status(400).json({
                message: "Code incorrect"
            });
        }
        
        // Code valide, on peut maintenant sauvegarder le secret dans la base de données
        const user = await User.findByPk(decoded.userId);
        if (!user) {
            return res.status(404).json({
                message: "Utilisateur non trouvé"
            });
        }
        
        // Mettre à jour l'utilisateur avec le secret 2FA et activer la 2FA
        await user.update({
            twoFactorSecret: decoded.secret,
            has2FA: true
        });
        
        return res.status(200).json({
            message: "L'authentification à deux facteurs a été activée avec succès"
        });
    } catch (error) {
        console.error("Erreur lors de la vérification du code 2FA:", error);
        return res.status(500).json({
            message: "Erreur lors de la vérification du code 2FA",
            error: error
        });
    }
};

/**
 * Vérifie le code 2FA pendant le processus de connexion
 */
const verify2FALogin = async (req: Request, res: Response) => {
    try {
        const { tempToken, otp } = req.body;
        
        // Décoder le token temporaire
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                message: "Token invalide ou expiré"
            });
        }
        
        // Vérifier que c'est bien un token qui requiert une 2FA
        if (!decoded.requiresTwoFactor) {
            return res.status(400).json({
                message: "Token invalide pour la vérification 2FA"
            });
        }
        
        // Récupérer l'utilisateur
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(404).json({
                message: "Utilisateur non trouvé"
            });
        }
        
        // Vérifier le code OTP
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: otp
        });
        
        if (!isValid) {
            return res.status(401).json({
                message: "Code d'authentification incorrect"
            });
        }
        
        // Générer un nouveau token complet (connexion validée)
        const token = jwt.sign(
            { id: user.id, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        
        // Retourner les données de l'utilisateur sans les informations sensibles
        const { password: _, twoFactorSecret: __, ...userWithoutSensitiveData } = user.get({
            plain: true,
        });
        
        return res.status(200).json({
            message: "Authentification à deux facteurs réussie",
            user: userWithoutSensitiveData,
            token
        });
    } catch (error) {
        console.error("Erreur lors de la vérification du code 2FA:", error);
        return res.status(500).json({
            message: "Erreur lors de la vérification du code 2FA",
            error: error
        });
    }
};

/**
 * Désactive la 2FA pour un utilisateur
 */
const disable2FA = async (req: Request, res: Response) => {
    try {
        const { userId, otp } = req.body;
        
        // Récupérer l'utilisateur
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                message: "Utilisateur non trouvé"
            });
        }
        
        // Vérifier que l'utilisateur a la 2FA activée
        if (!user.has2FA) {
            return res.status(400).json({
                message: "L'authentification à deux facteurs n'est pas activée pour cet utilisateur"
            });
        }
        
        // Vérifier le code OTP pour s'assurer que c'est bien l'utilisateur qui demande la désactivation
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: otp
        });
        
        if (!isValid) {
            return res.status(401).json({
                message: "Code d'authentification incorrect"
            });
        }
        
        // Désactiver la 2FA
        await user.update({
            twoFactorSecret: null,
            has2FA: false
        });
        
        return res.status(200).json({
            message: "L'authentification à deux facteurs a été désactivée avec succès"
        });
    } catch (error) {
        console.error("Erreur lors de la désactivation de la 2FA:", error);
        return res.status(500).json({
            message: "Erreur lors de la désactivation de la 2FA",
            error: error
        });
    }
};

module.exports = {
    generate2FASecret,
    verify2FASetup,
    verify2FALogin,
    disable2FA
};