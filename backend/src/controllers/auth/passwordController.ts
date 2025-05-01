import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import isPasswordCompromised from "../../utils/auth/isPasswordCompromised";

export const changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        const user = await User.findOne({ where: { email }, raw: false });

        if (!user) {
            res.status(401).json({ message: "Email incorrect" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(
            oldPassword,
            user.getDataValue("password")
        );
        if (!isPasswordValid) {
            res.status(401).json({ message: "Mot de passe incorrect" });
            return;
        }
        if (await isPasswordCompromised(newPassword)) {
            res.status(400).json({
                message:
                    "Ce mot de passe a été compromis. Choisissez-en un autre.",
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        const updatedUser = await user.save();

        const { password: _, ...userWithoutPassword } = updatedUser.get({
            plain: true,
        });
        res.status(200).json({
            message: "Mot de passe modifié avec succès",
            user: userWithoutPassword,
        });
    } catch (error) {
        next(error);
    }
};
