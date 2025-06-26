import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";
import AddictionUser from "../../models/AddictionUser";
import Link from "../../models/Links";
import logger from "../../config/logger";
/**
 * Express controller to retrieve all links grouped by each addiction 
 * associated with the authenticated user.
 *
 * The user must be authenticated (via req.user).
 * This function:
 *  - Fetches all addiction-user relationships (AddictionUser) for the current user.
 *  - Retrieves addiction details for each of those relationships.
 *  - Fetches all links (resources) associated with the user's addictions.
 *  - Groups the links by addiction and returns them in a structured format.
 *
 * Response structure:
 * [
 *   {
 *     addictionId: string,
 *     addictionName: string,
 *     links: [
 *       {
 *         id: string,
 *         name: string,
 *         name_link: string,
 *         resume: string,
 *         link: string,
 *         image_url: string | null
 *       },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 *
 * @param {Request} req - Express request object (must contain authenticated user).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - Returns a JSON response with links grouped by addiction.
 */

export const getUserAddictionLinks = async (
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

    // 1. Récupérer les addictions de l'utilisateur
    const addictionUsers = await AddictionUser.findAll({
      where: { id_user: user_id },
      order: [["date", "DESC"]],
      raw: true,
    });
    if (!addictionUsers.length) {
      res.status(200).json([]);
      return;
    }

    const addictionIds = addictionUsers.map(au => au.id_addiction);

    // 2. Récupérer les addictions
    const addictions = await Addiction.findAll({
      where: { id: addictionIds },
      raw: true,
    });

    const addictionMap = new Map(addictions.map(add => [add.id, add]));

    // 3. Récupérer les liens liés aux addictions
    const links = await Link.findAll({
      where: { id_addiction: addictionIds },
      raw: true,
    });

    // 4. Grouper les liens par addiction
    const groupedLinks = addictionIds.map(addictionId => {
      const addiction = addictionMap.get(addictionId);
      const addictionLinks = links.filter(link => link.id_addiction === addictionId);

      return {
        addictionId: addiction?.id,
        addictionName: addiction?.addiction,
        links: addictionLinks.map(link => ({
          id: link.id_link,
          name: link.name,
          name_link: link.name_link,
          resume: link.resume,
          link: link.link,
          image_url: link.image_url,
        })),
      };
    });
    res.status(200).json(groupedLinks);
  } catch (error) {
    logger.error("Erreur lors de la récupération des liens par addiction", {
      error,
      user_id: req.user?.id,
      ip: req.ip,
    });
    next(error);
  }
};
