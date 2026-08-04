import { Router } from "express";
import { sendMessage } from "../controller/chat.controller";

export const chatRoute = Router();

chatRoute.post("/chat", sendMessage);
