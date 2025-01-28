import express, { Express, Request, Response } from "express";
import { Server, Socket } from "socket.io";
import { joinWaitList } from "./src/controllers/ChatRoomController";

const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;
const io = new Server(port, {
    cors: { origin: '*' },
    cookie: true
});

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
    res.json({ message: "Backend API is running" });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});

io.on('connection', (socket: Socket) => {
    console.log('Client connected');

    socket.on('sendMessage', (message: string) => {
        console.log('Message received: ', message);
        io.emit('Message received', message);
    });

    socket.on('joinChatGroup', (userID: string) => {
        const result = joinWaitList(userID);
        console.log(result);
        io.emit(result, "");
    });

    socket.on('disconnect', () => {
        console.log('client disconnected');
    });
});