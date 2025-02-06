import express, { Express, Request, Response } from "express";
import { Server, Socket } from "socket.io";

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


    socket.on('disconnect', () => {
        console.log('client disconnected');
    });
});