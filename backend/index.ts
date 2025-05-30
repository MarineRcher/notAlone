import * as http from "node:http";
import { Server, Socket } from "socket.io";
import { Request, Response } from "express";
import * as path from "path";
import express from "express";
import dotenv from "dotenv";
import sequelize from "./src/config/database";
import authRoutes from "./src/routes/authRoutes";
<<<<<<< HEAD
import usersRoutes from "./src/routes/userRoutes";
import addictionRoutes from "./src/routes/addictionRoutes";
import GroupController from "./src/constrollers/GroupController";
=======
import groupRoutes from "./src/routes/groupRoutes";
import GroupController from "./src/controllers/GroupController";
>>>>>>> 6293628 (ADD: backend e2ee logic + tests)
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
<<<<<<< HEAD
app.use("/api/addictions", addictionRoutes);
app.use("/api/users", usersRoutes);
=======
app.use("/api/groups", groupRoutes);
// Add the e2ee compatibility routes directly
app.use("/api", groupRoutes);

// Extend Socket type for user property
interface AuthenticatedSocket extends Socket {
    user?: {
        userId: number;
        login: string;
        isMockUser?: boolean;
    };
}
>>>>>>> 6293628 (ADD: backend e2ee logic + tests)

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
        const authSocket = socket as AuthenticatedSocket;
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        
        // For testing without database, allow mock tokens
        if (token.startsWith('mock_jwt_token_')) {
            const mockUser = {
                userId: Math.floor(Math.random() * 1000),
                login: token.replace('mock_jwt_token_', ''),
                isMockUser: true
            };
            authSocket.user = mockUser;
            console.log(`🧪 Mock user authenticated: ${mockUser.login} (ID: ${mockUser.userId})`);
            return next();
        }
        
        // For production with database, verify actual JWT
        // This is where you would verify the JWT token with your secret
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // authSocket.user = decoded;
        
        // For now, allow any token for testing
        authSocket.user = { userId: 1, login: 'testuser' };
        next();
    } catch (error) {
        console.error('Socket.IO authentication error:', error);
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
    groupController.handleConnection(socket as AuthenticatedSocket);
});

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
            console.warn('⚠️  Database connection failed - Socket.IO will work but groups won\'t persist:');
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
                message: "Backend API is running",
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
                    websocket: "socket.io connection (works without database)"
                },
                note: databaseConnected ? "Full functionality available" : "Socket.IO available for testing - database required for persistence"
            });
        });

        // Socket.IO test endpoint
        app.get("/test-socketio", (req: Request, res: Response) => {
            res.json({
                message: "Socket.IO Test Endpoint",
                instructions: "Connect to this server using Socket.IO client on same port",
                example: `
                const io = require('socket.io-client');
                const socket = io('http://localhost:3000');
                socket.on('connect', () => console.log('Connected!'));
                socket.emit('test_message', { text: 'Hello Socket.IO!' });
                `,
                events: [
                    "join_random_group",
                    "send_group_message", 
                    "leave_group",
                    "typing_start",
                    "typing_stop"
                ]
            });
        });

        // Start the server
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📡 HTTP endpoints available at http://localhost:${PORT}`);
            console.log(`🔌 Socket.IO server is ready for connections`);
            
            if (databaseConnected) {
                console.log(`📋 Available routes:`);
                console.log(`  - POST /api/groups/join-random (join random group)`);
                console.log(`  - GET /api/groups/stats (group statistics)`);
                console.log(`  - Socket.IO events: join_random_group, send_group_message, leave_group`);
            } else {
                console.log(`🧪 Testing mode - Socket.IO events available:`);
                console.log(`  - Connect to Socket.IO for real-time testing`);
                console.log(`  - Visit http://localhost:${PORT}/test-socketio for examples`);
                console.log(`  - Database features disabled (groups won't persist)`);
                console.log(`  - Run test client: node test-socketio-client.js`);
            }
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
        console.error("❌ Critical server startup error:", error);
        process.exit(1);
    }
}

startServer();