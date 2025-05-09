import { Request, Response, NextFunction } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import User from '../../models/User';

export const generate2FASecret = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.body;
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }

    const secret = speakeasy.generateSecret({
      name: `MonApplication:${user.email}`
    });
    if (!secret.otpauth_url) {
        res.status(500).json({ message: "Failed to generate 2FA secret" });
        return;
      }
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    const tempToken = jwt.sign(
      { userId: user.id, secret: secret.base32, setupPhase: true },
      process.env.JWT_SECRET!,
      { expiresIn: "10m" }
    );

    res.status(200).json({
      message: "Secret 2FA généré avec succès",
      tempToken,
      qrCodeUrl,
      secret: secret.base32
    });
  } catch (error) {
    next(error);
  }
};

export const verify2FASetup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, otp } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      setupPhase: boolean;
      secret: string;
      userId: number;
    };

    if (!decoded.setupPhase || !decoded.secret) {
      res.status(400).json({ message: "Token invalide pour la configuration 2FA" });
      return;
    }

    const isValid = speakeasy.totp.verify({
      secret: decoded.secret,
      encoding: 'base32',
      token: otp
    });

    if (!isValid) {
      res.status(400).json({ message: "Code incorrect" });
      return;
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }

    await user.update({
      twoFactorSecret: decoded.secret,
      has2FA: true
    });

    res.status(200).json({
      message: "L'authentification à deux facteurs a été activée avec succès"
    });
  } catch (error) {
    next(error);
  }
};

export const verify2FALogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tempToken, otp } = req.body;
    
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as {
      requiresTwoFactor: boolean;
      id: number;
    };

    if (!decoded.requiresTwoFactor) {
      res.status(400).json({ message: "Token invalide pour la vérification 2FA" });
      return;
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.twoFactorSecret) {
      res.status(404).json({ message: "Utilisateur non trouvé ou 2FA non configurée" });
      return;
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp
    });

    if (!isValid) {
      res.status(401).json({ message: "Code d'authentification incorrect" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, login: user.login },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    const { password: _, twoFactorSecret: __, ...userWithoutSensitiveData } = user.get();
    res.status(200).json({
      message: "Authentification à deux facteurs réussie",
      user: userWithoutSensitiveData,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const disable2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, otp } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }

    if (!user.has2FA || !user.twoFactorSecret) {
      res.status(400).json({ 
        message: "L'authentification à deux facteurs n'est pas activée pour cet utilisateur" 
      });
      return;
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp
    });

    if (!isValid) {
      res.status(401).json({ message: "Code d'authentification incorrect" });
      return;
    }

    await user.update({
      twoFactorSecret: null,
      has2FA: false
    });

    res.status(200).json({
      message: "L'authentification à deux facteurs a été désactivée avec succès"
    });
  } catch (error) {
    next(error);
  }
};