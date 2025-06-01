import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";

export const selectAddictions = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const addictions = await Addiction.findAll();
        if (addictions) {
            res.status(201).json({
                addictions,
            });
        } else {
            res.status(400).json({
                message: "Aucune addiction",
            });
        }
    } catch (error) {
        next(error);
    }
};
