const express = require("express");
const { Sequelize } = require("sequelize");
import { Request, Response } from "express";

const app = express();
// Utiliser la variable d'environnement DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL);

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.json({ message: "Backend API is running" });
});

async function connectToDatabase() {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
}

connectToDatabase();

// Utiliser le port 3000 comme défini dans le Dockerfile et docker-compose
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
