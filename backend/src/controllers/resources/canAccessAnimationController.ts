import { Request, Response, NextFunction } from "express";
import User from "../../models/User";
import logger from "../../config/logger";

export const canAccessAnimation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }

    const user = await User.findByPk(user_id, {raw: true});

    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }

    // Premium users always allowed
    if (user.hasPremium) {
      res.status(200).json({ allowed: true, reason: "premium" });
      return;
    }

    // Check last_animation_at
    const now = new Date();
    const last = user.last_animation_at;

    if (!last || now.getTime() - new Date(last).getTime() > 24 * 60 * 60 * 1000) {
      res.status(200).json({ allowed: true, reason: "non-premium >24h" });
    } else {
      res.status(200).json({
        allowed: false,
        reason: "non-premium <24h",
        nextAccessAt: new Date(last.getTime() + 24 * 60 * 60 * 1000),
      });
    }
  } catch (error) {
    logger.error("Erreur dans canAccessAnimation", {
      error,
      user_id: req.user?.id,
      ip: req.ip,
    });
    next(error);
  }
};
