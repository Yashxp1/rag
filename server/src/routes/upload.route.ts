import { Router } from "express";
import { upload } from "../middleware/multer";
import { uploadFile } from "../controller/upload.controller";

export const uploadRoute = Router();

uploadRoute.post("/upload", upload.single("document"), uploadFile);
