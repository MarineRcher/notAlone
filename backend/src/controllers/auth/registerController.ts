import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import jwt from "jsonwebtoken";

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { login, email, password, hasPremium, has2FA, isBlocked } =
            req.body;
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;

        if (!passwordRegex.test(password)) {
            res.status(400).json({
                message:
                    "Le mot de passe doit contenir au moins 12 caractères...",
            });
            return;
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            res.status(400).json({
                message: "Un utilisateur avec cet email existe déjà",
            });
            return;
        }

        const existingLogin = await User.findOne({ where: { login } });
        if (existingLogin) {
            res.status(400).json({
                message: "Un utilisateur avec ce login existe déjà",
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            login,
            email,
            password: hashedPassword,
            hasPremium,
            has2FA,
            isBlocked,
        });

        const token = jwt.sign(
            { id: newUser.id, login: newUser.login },
            process.env.JWT_SECRET!,
            { expiresIn: "24h" }
        );

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            token,
        });
    } catch (error) {
        next(error);
    }
};
