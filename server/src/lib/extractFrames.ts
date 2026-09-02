import { spawn } from "child_process";

export const extractFrames = (filePath: string, outputPattern: string) => {
  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      filePath,
      "-vf",
      "fps=1/50,scale=1280:-1",
      "-q:v",
      "5",
      outputPattern,
    ]);

    ffmpeg.stderr.on("data", (data) => {
      console.log(data.toString());
    });

    ffmpeg.stderr.on("error", (error) => {
      console.error("Failed to start FFmpeg:", error);
      reject(error);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
};
