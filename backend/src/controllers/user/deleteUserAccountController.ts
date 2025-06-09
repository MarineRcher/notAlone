import AddictionUser from "../../models/AddictionUser";
import User from "../../models/User";
import { Request, Response, NextFunction } from "express";

/**
 * Express controller to delete the authenticated user's account.
 *
 * Deletes the user record from the database based on the authenticated user ID.
 *
 * HTTP Responses:
 * - 200 OK: Account successfully deleted
 * - 401 Unauthorized: User is not authenticated
 * - 404 Not Found: No user found with the provided ID
 *
 * @param {Request} req - Express request object. Must include `req.user.id`.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} A promise that resolves when the operation completes or an error is handled.
 */
export const deleteUserAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user_id = req.user?.id;

        if (!user_id) {
            res.status(401).json({ message: "Non autorisé" });
            return;
        }
        await AddictionUser.destroy({
            where: { id_user: user_id },
        });
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
