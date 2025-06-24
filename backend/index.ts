import * as http from "node:http";
import { Server, Socket } from "socket.io";
import { Request, Response } from "express";
import * as path from "path";
import express from "express";
import dotenv from "dotenv";
import sequelize from "./src/config/database";
import authRoutes from "./src/routes/authRoutes";
import usersRoutes from "./src/routes/userRoutes";
import addictionRoutes from "./src/routes/addictionRoutes";
import groupRoutes from "./src/routes/groupRoutes";
import { E2EEGroupController } from "./src/controllers/E2EEGroupController";
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
app.use("/api/groups", groupRoutes);

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

// Initialize E2EE Group controller
const e2eeController = new E2EEGroupController(io);

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    e2eeController.handleConnection(socket);

    socket.on("disconnect", (reason) => {
        console.log(`Client ${socket.id} disconnected:`, reason);
    });

    socket.on("error", (error) => {
        console.error(`Socket error for client ${socket.id}:`, error);
    });
});

// Schedule cleanup jobs every 5 minutes
setInterval(async () => {
    try {
        console.log('🧹 Running scheduled cleanup...');
        e2eeController.getSocketService().getGroupService().cleanupInactiveGroups();
    } catch (error) {
        console.error('Error in scheduled cleanup:', error);
    }
}, 5 * 60 * 1000); // 5 minutes

async function startServer() {
    let databaseConnected = false;
    
    try {
        // Database connection (optional for Socket.IO testing)
        try {
            await sequelize.authenticate();
            await sequelize.sync();
            console.log('✅ Database connected successfully');
            databaseConnected = true;
        } catch (dbError: any) {
            console.warn('⚠️  Database connection failed - E2EE groups will work in-memory only:');
            console.warn('   To enable full functionality, start PostgreSQL or use Docker Compose');
            console.warn('   Database error:', dbError.message);
        }
        
        // Redis connection (optional)
        try {
            await connectRedis();
            console.log('✅ Redis connected successfully');
        } catch (error: any) {
            console.warn('⚠️  Redis connection failed, continuing without Redis:', error.message);
        }

        // Basic health check endpoint
        app.get("/", (req: Request, res: Response) => {
            res.json({ 
                message: "E2EE Group Chat Backend API",
                status: "healthy",
                timestamp: new Date().toISOString(),
                services: {
                    database: databaseConnected ? "connected" : "disabled",
                    redis: "optional",
                    websocket: "ready"
                },
                endpoints: {
                    auth: "/api/auth",
                    groups: "/api/groups (requires database)",
                    websocket: "socket.io E2EE group chat"
                },
                note: databaseConnected ? "Full E2EE functionality available" : "E2EE groups available in-memory - database required for persistence"
            });
        });

        // Socket.IO test endpoint
        app.get("/test-e2ee", (req: Request, res: Response) => {
            res.json({
                message: "E2EE Group Chat Test Endpoint",
                instructions: "Connect to this server using Socket.IO client on same port",
                events: [
                    "join_random_group",
                    "send_group_message", 
                    "leave_group",
                    "crypto_key_exchange"
                ],
                authentication: {
                    mock: "mock_jwt_token_alice (for testing)",
                    real: "Valid JWT token with user ID"
                }
            });
        });

        const PORT = process.env.PORT || 3000;

        server.listen(PORT as number, "0.0.0.0", () => {
            console.log(`🚀 E2EE Server running on port ${PORT}`);
            console.log(`📡 HTTP endpoints: http://localhost:${PORT}`);
            console.log(`🔌 Socket.IO E2EE ready for connections`);
            console.log(`🔐 End-to-end encrypted group chat enabled`);

            if (databaseConnected) {
                console.log(`📋 Full functionality available with database persistence`);
            } else {
                console.log(`🧪 In-memory mode - groups and messages not persisted`);
            }
        });

        process.on("SIGTERM", () => {
            console.log("SIGTERM received. Closing server...");
            server.close(() => {
                console.log("Server closed");
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error("❌ Critical server startup error:", error);
        process.exit(1);
    }
}

startServer();