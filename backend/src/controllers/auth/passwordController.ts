import { error } from "console";
import {Request, Response} from "express";
const bcrypt = require("bcryptjs");
const User = require("../../models/Users");


const changePassword =  async (req: Request, res: Response) => {
    try{
        const {email, oldPassword, newPassword } = req.body;
        const user = await User.findOne({
            where: {
                email: email,
            },
        });
       
        if (!user) {
            return res.status(401).json({
                message: "Email incorrect",
            });
        };
        
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Mot de passe incorrect",
            });
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            user.password = hashedPassword;
            const newUser = await user.save();
            const { password: _, ...userWithoutPassword } = newUser.get({
                plain: true,
            });
    
            res.status(201).json({
                message: "Mot de passe modifié avec succès",
                user: userWithoutPassword,
            });
        } 



    }catch(error){
        res.status(500).json({
            message: "Erreur lors du changement de mot de passe de l'utilisateur",
            error: error,
        });
    }
}


module.exports = {changePassword}