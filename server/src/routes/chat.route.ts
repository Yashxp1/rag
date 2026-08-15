import { Router } from "express";
import { attachDocumentToChat, createChat, getChatMessages, getChats, sendMessage, sendMessageById } from "../controller/chat.controller";

export const chatRoute = Router();

chatRoute.post("/chats", createChat);
chatRoute.get("/chats", getChats);
chatRoute.get("/chats/:chatId", getChatMessages);
chatRoute.post("/chats/:chatId/documents", attachDocumentToChat);
chatRoute.post("/chat", sendMessage);
chatRoute.post("/chat/:chatId", sendMessageById);
