import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import User from "../models/User";
import { LoginRequestBody } from "../types/users";

/**
 * Middleware to check if a user is temporarily blocked from logging in due to too many attempts.
 *
 * This function searches for a user by either login or email. If the user exists and their
 * `blockedUntil` timestamp is in the future (i.e., they are currently blocked), the request is
 * rejected with a 429 (Too Many Requests) response. Otherwise, the request proceeds to the next middleware.
 *
 * @param req - Express request object, containing the loginOrEmail in the body
 * @param res - Express response object, used to send a 429 status if the user is blocked
 * @param next - Express next function, called to pass control to the next middleware
 */
export const checkBlockedStatus = async (
	req: Request<{}, {}, LoginRequestBody>,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	const { loginOrEmail } = req.body;

	const user = await User.findOne({
		where: { [Op.or]: [{ login: loginOrEmail }, { email: loginOrEmail }] },
	});

	if (user?.blockedUntil && user.blockedUntil > new Date()) {
		res.status(429).json({
			message: "Trop de tentatives. Réessayez plus tard.",
		});
		return;
	}

	next();
};
