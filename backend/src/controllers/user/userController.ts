import User from "../../models/User";
import { Request, Response, NextFunction } from "express";
export const deleteUserAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            res.status(400).json({ message: "user_id requis" });
            return;
        }

        const deleted = await User.destroy({
            where: { id: user_id },
        });

        if (!deleted) {
            res.status(404).json({ message: "Utilisateur introuvable" });
            return;
        }

        res.status(200).json({
            message: "Compte et données associées supprimés",
        });
    } catch (error) {
        next(error);
    }
};
