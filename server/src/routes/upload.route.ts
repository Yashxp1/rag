import { Router } from "express";
import { upload } from "../middleware/multer";
import {
  getDocumentById,
  getDocuments,
  uploadByChatId,
  uploadFile,
} from "../controller/upload.controller";

export const uploadRoute = Router();

uploadRoute.get("/documents", getDocuments);
uploadRoute.get("/documents/:documentId", getDocumentById);
uploadRoute.post("/upload", upload.single("document"), uploadFile);
uploadRoute.post(
  "/upload/chat/:chatId",
  upload.single("document"),
  uploadByChatId,
);
