const express = require("express");
import { Request, Response } from "express";
const createDb = require("./src/models/index");
const authRoutes = require("./src/routes/authRoutes");

const app = express();
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

async function startServer() {
    try {
        await createDb();

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
