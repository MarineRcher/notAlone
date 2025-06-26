import { Request, Response, NextFunction } from "express";
import User from "../../models/User";
import logger from "../../config/logger";

export const updateLastAnimation = async (
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

    const user = await User.findByPk(user_id);

    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }

    if (user.hasPremium) {
      res.status(200).json({
        message: "Les utilisateurs premium n'ont pas besoin de mettre à jour last_animation_at",
      });
      return;
    }

    await User.update({
      last_animation_at: new Date()

    },{
      where: {
        id: user_id
      }
    }
  )
    res.status(200).json({ message: "last_animation_at mis à jour avec succès" });
  } catch (error) {
    logger.error("Erreur lors de la mise à jour de last_animation_at", {
      error,
      user_id: req.user?.id,
      ip: req.ip,
    });
    next(error);
  }
};
