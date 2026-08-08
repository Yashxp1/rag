import { Queue } from "bullmq";
import { redis } from "../config/redis";

export const uploadQueue = new Queue("uploads", {
  connection: redis
});
