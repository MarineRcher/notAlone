import { Request, Response, NextFunction } from "express";
import User from "../../models/User";

export const getCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: "Non authentifié" });
            return;
        }

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password"] },
        });

        if (!user) {
            res.status(404).json({ message: "Utilisateur non trouvé" });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};
