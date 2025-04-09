import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types/users';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  id: number;
  [key: string]: any;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Vérification du token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: "Authentification requise" });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // 2. Vérification et décodage du JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // 3. Récupération de l'utilisateur
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({ message: "Utilisateur introuvable" });
      return;
    }

    // 4. Vérification du statut du compte
    if (user.isBlocked) {
      res.status(403).json({ 
        message: "Compte bloqué. Contactez l'administrateur." 
      });
      return;
    }

    // 5. Ajout de l'utilisateur à la requête
    req.user = user.get({ plain: true }) as IUser;
    next();

  } catch (error) {
    // Gestion centralisée des erreurs
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Session expirée" });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Token invalide" });
      return;
    }

    console.error('Erreur authMiddleware:', error);
    res.status(500).json({ 
      message: "Erreur d'authentification",
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};