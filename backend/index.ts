const express = require("express");
import { Request, Response } from "express";
const initDatabase = require("./src/models/index");

const app = express();
app.use(express.json());

async function startServer() {
    try {
        await initDatabase();

        app.get("/", (req: Request, res: Response) => {
            res.json({ message: "Backend API is running" });
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Erreur au démarrage du serveur:", error);
        process.exit(1);
    }
}

startServer();
