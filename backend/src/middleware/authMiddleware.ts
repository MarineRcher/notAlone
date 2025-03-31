import { Request, Response, NextFunction } from "express";
const jwt = require("jsonwebtoken");
const User = require("../models/Users");

// Étendre l'interface Request pour inclure l'utilisateur
declare global {
    namespace Express {
        interface Request {
            user?: any; // Vous pouvez définir un type plus précis si nécessaire
        }
    }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Vérifier si le token est présent dans l'en-tête
        const token = req.headers.authorization?.split(" ")[1]; // Format: Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                message: "Accès non autorisé. Token manquant."
            });
        }
        
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Vérifier si l'utilisateur existe toujours dans la base de données
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                message: "L'utilisateur n'existe plus."
            });
        }
        
        // Vérifier si l'utilisateur est bloqué
        if (user.isBlocked) {
            return res.status(403).json({
                message: "Votre compte est bloqué. Veuillez contacter l'administrateur."
            });
        }
        
        // Ajouter l'utilisateur à l'objet request pour les middlewares suivants
        req.user = user;
        
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                message: "Token invalide."
            });
        }
        
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                message: "Token expiré."
            });
        }
        
        console.error("Erreur d'authentification:", error);
        return res.status(500).json({
            message: "Erreur lors de l'authentification",
            error: error
        });
    }
};

module.exports = authMiddleware;