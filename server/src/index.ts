import "dotenv/config";
import express from "express";
import cors from "cors";
import { uploadRoute } from "./routes/upload.route";
import { chatRoute } from "./routes/chat.route";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", uploadRoute);
app.use("/api", chatRoute);

const PORT = 4001;

app.listen(PORT, () => {
  console.log("Server started on port 4001");
});
