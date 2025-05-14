import { Request, Response, NextFunction } from "express";
import User from "../../models/User";

/**
 * Retrieves the currently authenticated user based on the JWT payload.
 *
 * This endpoint:
 * - Requires a valid authenticated user (via middleware attaching `req.user`)
 * - Returns the user data excluding sensitive fields like password
 *
 * @route GET /auth/me
 * @access Private
 */
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
