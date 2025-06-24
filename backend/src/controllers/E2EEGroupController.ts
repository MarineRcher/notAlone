import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { E2EESocketService } from "../services/E2EESocketService";
import { SocketUserData } from "../types/e2ee";

interface AuthenticatedSocket extends Socket 
{
	user?: SocketUserData;
}

export class E2EEGroupController 
{
	private io: Server;
	private socketService: E2EESocketService;

	constructor(io: Server) 
	{
		this.io = io;
		this.socketService = new E2EESocketService(io);
		this.setupCleanupInterval();
	}

	public handleConnection(socket: AuthenticatedSocket): void 
	{
		this.authenticateSocket(socket, (authenticated) => {
			if (!authenticated) 
			{
				socket.disconnect();
				return;
			}

			this.socketService.handleConnection(socket);
		});
	}

	private authenticateSocket(
		socket: AuthenticatedSocket,
		callback: (authenticated: boolean) => void
	): void 
	{
		try 
		{
			const token = socket.handshake.auth.token;

			if (!token) 
			{
				console.log("❌ No token provided");
				callback(false);
				return;
			}

			if (token.startsWith("mock_jwt_token_")) 
			{
				this.handleMockAuthentication(socket, token, callback);
				return;
			}

			this.handleJWTAuthentication(socket, token, callback);
		} 
		catch (error) 
		{
			console.error("❌ Authentication error:", error);
			callback(false);
		}
	}

	private handleMockAuthentication(
		socket: AuthenticatedSocket,
		token: string,
		callback: (authenticated: boolean) => void
	): void 
	{
		const loginName = token.replace("mock_jwt_token_", "");
		const testUsers: Record<string, { id: number; login: string }> = {
			alice: { id: 1001, login: "alice" },
			bob: { id: 1002, login: "bob" },
			charlie: { id: 1003, login: "charlie" },
			diana: { id: 1004, login: "diana" },
			eve: { id: 1005, login: "eve" }
		};

		const testUser = testUsers[loginName];

		if (testUser) 
		{
			socket.user = {
				userId: testUser.id.toString(),
				socketId: socket.id
			};
			console.log(`🧪 Test user authenticated: ${testUser.login}`);
			callback(true);
		} 
		else 
		{
			console.log(`❌ Unknown test user: ${loginName}`);
			callback(false);
		}
	}

	private handleJWTAuthentication(
		socket: AuthenticatedSocket,
		token: string,
		callback: (authenticated: boolean) => void
	): void 
	{
		try 
		{
			const secret = process.env.JWT_SECRET || "your-secret-key";
			console.log(`🔍 Attempting to verify JWT token (first 20 chars): ${token.substring(0, 20)}...`);
			const decoded = jwt.verify(token, secret) as any;

			console.log(`🔍 JWT token decoded:`, JSON.stringify(decoded, null, 2));

			// Support both 'id' and 'userId' fields for compatibility
			const userId = decoded.id || decoded.userId;

			if (decoded && userId) 
			{
				socket.user = {
					userId: userId.toString(),
					socketId: socket.id
				};
				console.log(`✅ Real user authenticated: ${userId} (${decoded.login || 'unknown'})`);
				callback(true);
			} 
			else 
			{
				console.log("❌ Invalid token payload - missing user ID");
				console.log("Available fields:", Object.keys(decoded));
				callback(false);
			}
		} 
		catch (jwtError) 
		{
			console.error("❌ JWT verification failed:", jwtError instanceof Error ? jwtError.message : String(jwtError));
			callback(false);
		}
	}

	private setupCleanupInterval(): void 
	{
		setInterval(() => {
			this.socketService.getGroupService().cleanupInactiveGroups();
		}, 5 * 60 * 1000); // 5 minutes
	}

	public getSocketService(): E2EESocketService 
	{
		return this.socketService;
	}
} 