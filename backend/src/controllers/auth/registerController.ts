import { Request, Response } from "express";
const bcrypt = require("bcryptjs");
const User = require("../../models/user.model");

const register = async (req: Request, res: Response) => {
    try {
        const { login, email, password, hasPremium, has2FA, isBlocked } = req.body;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;
        
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
            });
        }

        const existingEmail = await User.findOne({
            where: {
                email: email,
            },
        });
        
        if (existingEmail) {
            return res.status(400).json({
                message: "Un utilisateur avec cet email existe déjà",
            });
         } 

         const existingLogin = await User.findOne({
            where: {
                login: login,
            },
        });
        
        if (existingLogin) {
            return res.status(400).json({
                message: "Un utilisateur avec ce login existe déjà",
            });
         } 
         const salt = await bcrypt.genSalt(10);
         const hashedPassword = await bcrypt.hash(password, salt);
     
        const newUser = await User.create({
            login,
            email,
            password: hashedPassword,
            hasPremium: hasPremium,
            has2FA: has2FA,
            isBlocked: isBlocked,
        });
        
        const { password: _, ...userWithoutPassword } = newUser.get({
            plain: true,
        });

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        res.status(500).json({
            message: "Erreur lors de la création de l'utilisateur",
            error: error,
        });
    }
};



module.exports = { register };
