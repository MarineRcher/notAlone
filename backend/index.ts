import * as http from "node:http";
import { Server } from "socket.io";
import { Request, Response } from "express";
const express = require("express");
const dotenv = require("dotenv");
const initDatabase = require("./src/models/index");
const authRoutes = require("./src/routes/authRoutes");
import GroupController from "./src/constrollers/GroupController"; 
const app = express();
const server = http.createServer(app); 
dotenv.config();

app.use(express.json());
app.use("/api/auth", authRoutes); 

async function startServer() {
    try {
        await initDatabase();

        app.get("/", (req: Request, res: Response) => {
            res.json({ message: "Backend API is running" });
        });

        const io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        const groupController = new GroupController(io);

        io.on('connection', (socket) => {
            console.log('Nouveau client connecté:', socket.id);
            groupController.handleConnection(socket);
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