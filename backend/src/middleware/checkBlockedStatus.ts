import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import User from "../models/User";

interface LoginRequestBody {
    loginOrEmail: string;
}

export const checkBlockedStatus = async (
    req: Request<{}, {}, LoginRequestBody>,
    res: Response,
    next: NextFunction
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
