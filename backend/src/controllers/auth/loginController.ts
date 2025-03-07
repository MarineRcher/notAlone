import { Request, Response } from "express";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/Users");
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
                message: "Login/Email ou mot de passe incorrect",
            });
        }

        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Login/Email ou mot de passe incorrect",
            });
        }

        const token = jwt.sign(
            { id: user.id, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        
        const { password: _, ...userWithoutPassword } = user.get({
            plain: true,
        });

        res.status(200).json({
            message: "Connexion réussie",
            user: userWithoutPassword,
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