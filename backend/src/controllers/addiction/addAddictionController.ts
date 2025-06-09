import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";

/**
 * Validates the input string for an addiction name.
 *
 * Checks if the addiction string exists and meets the minimum length requirement (2 characters).
 *
 * @param {string} addiction - The name of the addiction to validate.
 * @returns {{ isValid: boolean; errors: { addiction?: string } }}
 * An object containing a boolean indicating validity and any associated validation errors.
 */
const validateAddictionInput = (addiction: string) => {
    const errors: { addiction?: string } = {};

    if (!addiction || addiction.trim().length < 2) {
        errors.addiction = "Nom d'addiction invalide (min. 2 caractères)";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Express controller to add a new addiction to the database.
 *
 * Validates the request body and creates a new addiction record.
 * Returns appropriate HTTP responses based on the outcome:
 * - 201 Created on success
 * - 400 Bad Request for validation errors
 * - 409 Conflict if the addiction already exists
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {Promise<void>} A promise that resolves when the response is sent or passes control to error middleware.
 */
export const addAddiction = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { addiction } = req.body;

        const { isValid, errors } = validateAddictionInput(addiction);
        if (!isValid) {
            res.status(400).json({ errors });
            return;
        }

        await Addiction.create({ addiction: addiction.trim() });
        res.status(201).json({ success: true });
    } catch (error) {
        if (error instanceof Error && "name" in error) {
            if (error.name === "SequelizeUniqueConstraintError") {
                res.status(409).json({
                    message: "Cette addiction existe déjà",
                });
                return;
            }
        }
        next(error);
    }
};
