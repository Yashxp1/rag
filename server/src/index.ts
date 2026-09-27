import "dotenv/config";
import express from "express";
import cors from "cors";
import { uploadRoute } from "./routes/upload.route";
import { chatRoute } from "./routes/chat.route";
import "./workers/document.worker";
import "./workers/video.worker";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "online",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", uploadRoute);
app.use("/api", chatRoute);

const PORT = 4001;

app.listen(PORT, () => {
  console.log("Server started on port 4001");
});
