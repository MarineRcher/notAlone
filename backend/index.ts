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

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "./.env") });

// HTTP Middleware
app.use(helmet());
app.use(express.json());

// HTTP Routes
app.use("/api/auth", authRoutes);
app.use("/api/addictions", addictionRoutes);
app.use("/api/users", usersRoutes);

// Socket.IO server configuration
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        // Verify token and attach user to socket
        // This is where you would verify the JWT token
        // socket.user = decodedUser;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Handle client disconnection
    socket.on("disconnect", (reason) => {
        console.log(`Client ${socket.id} disconnected:`, reason);
    });

    // Handle connection errors
    socket.on("error", (error) => {
        console.error(`Socket error for client ${socket.id}:`, error);
    });

    // Initialize group controller for this socket
    const groupController = new GroupController(io);
    groupController.handleConnection(socket);
});

async function startServer() {
    try {
        // Database connection
        await sequelize.authenticate();
        await sequelize.sync();
        
        // Redis connection
        await connectRedis();

        // Basic health check endpoint
        app.get("/", (req: Request, res: Response) => {
            res.json({ 
                message: "Backend API is running",
                status: "healthy",
                timestamp: new Date().toISOString(),
                services: {
                    database: "connected",
                    redis: "connected",
                    websocket: "ready"
                }
            });
        });

        // Start the server
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`HTTP endpoints available at http://localhost:${PORT}`);
            console.log(`Socket.IO server is ready for connections`);
        });

        // Handle server shutdown gracefully
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Closing server...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
}

startServer();
