import { Request, Response, NextFunction } from "express";
import logger from "../../config/logger";
import Journal from "../../models/Journal";
import UserActivity from "../../models/UserActivity";
import Activities from "../../models/Activities";
import ResumeJourney from "../../models/ResumeJourney";

/**
 * Express controller for fetching journal to a user.
 *
 * Requires authentication (via req.user).
 * Returns journal with date in params
 *
 * @param {Request} req - Express request with user context.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next middleware.
 * @returns {Promise<void>}
 */
export const getUserJournal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user_id = req.user?.id;
        const date = req.body.date;

        if (!user_id) {
            res.status(401).json({ message: "Non autorisé" });
            return;
        }

        const user_journal = await Journal.findOne({
            where: { created_at: date, id_user: user_id },
            raw: true,
        });

        if (!user_journal) {
            res.status(200).json(null);
            return;
        }

        const currentDate = new Date(date);
        const previousDay = new Date(currentDate);
        previousDay.setDate(currentDate.getDate() - 1);

        const previous_journal = await Journal.findOne({
            where: {
                created_at: previousDay.toISOString().split("T")[0],
                id_user: user_id,
            },
            raw: true,
        });

        const response: any = {
            journal: user_journal,
            activities: [],
            resume_journey: null,
            previous_day_goal: previous_journal?.next_day_goal || null,
        };

        const user_activities = await UserActivity.findAll({
            where: { id_journal: user_journal.id_journal },
            raw: true,
        });

        if (user_activities && user_activities.length > 0) {
            for (const user_activity of user_activities) {
                const activities = await Activities.findAll({
                    where: {
                        id_activity: user_activity.id_activity,
                    },
                    raw: true,
                });

                response.activities.push({
                    user_activity: user_activity,
                    activity_details: activities,
                });
            }
        }

        if (user_journal.id_resume_journey) {
            const resume_journey = await ResumeJourney.findOne({
                where: {
                    id_resume_journey: user_journal.id_resume_journey,
                },
                raw: true,
            });
            response.resume_journey = resume_journey;
        }

        res.status(200).json(response);
    } catch (error) {
        logger.error(
            "Erreur lors de la récupération du journal de l'utilisateur",
            {
                error,
                user_id: req.user?.id,
                ip: req.ip,
            }
        );
        next(error);
    }
};
