import { Request, Response } from "express";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user.model");
const { Op } = require("sequelize");

const login = async (req: Request, res: Response) => {
    try {
        const { loginOrEmail, password } = req.body;
        
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { login: loginOrEmail },
                    { email: loginOrEmail }
                ]
            },
        });
        
        if (!user) {
            return res.status(401).json({
                message: "Login ou Email incorrect",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Mot de passe incorrect",
            });
        }
        if (user.has2FA) {
            const tempToken = jwt.sign(
                { 
                    id: user.id,
                    requiresTwoFactor: true
                },
                process.env.JWT_SECRET,
                { expiresIn: "5m" }
            );
            
            return res.status(200).json({
                message: "Authentification à deux facteurs requise",
                userId: user.id,
                requiresTwoFactor: true,
                tempToken: tempToken
            });
        }

        const token = jwt.sign(
            { id: user.id, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        const { password: _, twoFactorSecret: __, ...userWithoutSensitiveData } = user.get({
            plain: true,
        });


        res.status(200).json({
            message: "Connexion réussie",
            user: userWithoutSensitiveData,
            token
        });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        res.status(500).json({
            message: "Erreur lors de la connexion de l'utilisateur",
            error: error,
        });
    }
};

module.exports = { login };