import { Request, Response, NextFunction } from "express";
import Platforms from "../../models/Platforms";
import Forest from "../../models/Forest";
import Nature from "../../models/Nature";
import logger from "../../config/logger";

/**
 * Express controller for associating a platform with a user and optionally adding forest elements.
 * Logs successful operations and errors using the logger.
 *
 * @param {Request} req - Express request object. Requires authenticated user (`req.user`).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when processing is complete.
 */
export const AddUserPlatformController = async (
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

        const { x, y, element } = req.body;

        if (typeof x !== "number" || typeof y !== "number") {
            res.status(400).json({ message: "Coordonnées (x, y) invalides" });
            return;
        }

        const existing = await Platforms.findOne({
            where: { id_user: user_id, x, y },
        });

        if (existing) {
            res.status(409).json({
                message: "Une plateforme existe déjà à ces coordonnées",
            });
            return;
        }

        const newPlatform = await Platforms.create({
            x,
            y,
            id_user: user_id,
        });

        let forestElement = null;

        if (element?.type && element?.side) {
            const validTypes = ["tree", "flower"];
            const validSides = ["top", "right", "bottom", "left"];

            if (
                validTypes.includes(element.type) &&
                validSides.includes(element.side)
            ) {
                let nature = await Nature.findOne({
                    where: { type: element.type },
                });

                if (!nature) {
                    nature = await Nature.create({
                        type: element.type,
                        url: element.url,
                    });
                }

                forestElement = await Forest.create({
                    side: element.side,
                    id_platform: newPlatform.id_platform,
                    id_nature: nature.id_nature,
                });

                forestElement = await Forest.findByPk(forestElement.id_forest, {
                    include: [
                        {
                            model: Nature,
                            as: "nature",
                            attributes: ["id_nature", "type", "url"],
                        },
                    ],
                });
            } else {
                logger.warn(
                    "Type ou side invalide fourni pour l'élément forestier",
                    {
                        type: element.type,
                        side: element.side,
                    }
                );
            }
        }

        res.status(201).json({
            platform: newPlatform,
            forestElement,
        });
    } catch (error) {
        logger.error("Erreur lors de l'ajout d'une plateforme utilisateur", {
            error,
            user_id: req.user?.id,
            ip: req.ip,
        });
        next(error);
    }
};
