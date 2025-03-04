import * as http from "node:http";

const express = require("express");
import { Request, Response } from "express";
import {Server} from "socket.io";
import GroupController from "./src/constrollers/GroupController";
const initDatabase = require("./src/models/index");

const app = express();
const server = http.createServer(app);

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

const io = new Server(server, {
    cors : {
        origin: "*",
        methods:["GET", "POST"]
    }
})

const groupController = new GroupController(io);

io.on('connection', (socket) => {
    console.log('Nouveau client connecté:', socket.id);
    groupController.handleConnection(socket);
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

startServer();
