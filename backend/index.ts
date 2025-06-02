import * as http from "node:http";
import { Server } from "socket.io";
import { Request, Response } from "express";
import * as path from "path";
import express from "express";
import dotenv from "dotenv";
import sequelize from "./src/config/database";
import authRoutes from "./src/routes/authRoutes";
import usersRoutes from "./src/routes/userRoutes";
import addictionRoutes from "./src/routes/addictionRoutes";
import GroupController from "./src/constrollers/GroupController";
import { connectRedis } from "./src/config/redis";
import helmet from "helmet";

const app = express();
const server = http.createServer(app);

dotenv.config({ path: path.resolve(__dirname, "./.env") });
app.use(helmet());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/addictions", addictionRoutes);
app.use("/api/users", usersRoutes);

async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        await connectRedis();
        app.get("/", (req: Request, res: Response) => {
            res.json({ message: "Backend API is running" });
        });

        const io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

        const groupController = new GroupController(io);

        io.on("connection", (socket) => {
            console.log("Nouveau client connecté:", socket.id);
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
