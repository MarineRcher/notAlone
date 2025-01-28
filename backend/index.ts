import express, { Express, Request, Response } from "express";

const app: Express = express();

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
    res.json({ message: "Backend API is running" });
});

