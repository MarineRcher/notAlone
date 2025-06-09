import { Request, Response, NextFunction } from "express";
import User from "../../models/User";
/**
 * Validates the format of an email address using a regular expression.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} `true` if the email is in a valid format, otherwise `false`.
 */
const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
/**
 * Express controller to change the authenticated user's email address.
 *
 * Validates the new email, checks for conflicts with existing users, and updates the email in the database.
 *
 * HTTP Responses:
 * - 200 OK: Email successfully updated
 * - 400 Bad Request: Missing or invalid email format
 * - 401 Unauthorized: User is not authenticated
 * - 404 Not Found: User not found in the database
 * - 409 Conflict: The new email is already in use
 *
 * @param {Request} req - Express request object, must include `req.user.id`.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when the process is complete.
 */
export const changeEmail = async (
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

        const { newEmail } = req.body;

        // Validation des paramètres
        if (!newEmail) {
            res.status(400).json({
                message: "Le nouveau email est requis",
            });
            return;
        }

        // Validation du format d'email
        if (!validateEmail(newEmail)) {
            res.status(400).json({
                message: "Format d'email invalide",
            });
            return;
        }

        // Récupération de l'utilisateur
        const user = await User.findByPk(user_id);

        if (!user) {
            res.status(404).json({ message: "Utilisateur introuvable" });
            return;
        }

        // Vérification si le nouvel email existe déjà
        const emailExists = await User.findOne({ where: { email: newEmail } });

        if (emailExists) {
            res.status(409).json({ message: "L'email est déjà utilisé" });
            return;
        }

        // Mise à jour de l'email
        await User.update({ email: newEmail }, { where: { id: user_id } });

        res.status(200).json({ message: "Email modifié avec succès" });
    } catch (error) {
        next(error);
    }
};
