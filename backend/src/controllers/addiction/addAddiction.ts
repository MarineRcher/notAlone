import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";

export const addAddiction = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { addiction } = req.body;
        await Addiction.create({ addiction: addiction });
        res.status(201).json({
            success: true,
        });
    } catch (error) {
        next(error);
    }
};
