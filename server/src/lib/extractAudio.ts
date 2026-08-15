// ffmpeg -i input.mp4 -vn -ac 1 -ar 16000 -c:a pcm_s16le output.wav

import { spawn } from "child_process";

export const extractAudio = (filePath: string, outputPath: string) => {
  return new Promise((resolve, reject) => {
    const getAudio = spawn("ffmpeg", [
      "-i",
      filePath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "pcm_s16le",
      outputPath,
    ]);

    let output = "";

    getAudio.stdin.on("data", (data) => {
      output += data.toString();
    });

    getAudio.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    getAudio.on("close", (code) => {
      if (code === 0) {
        console.log("Transcribed Video Output:\n", output);
        resolve(output);
      } else reject(new Error(`Whisper failed with exit code ${code}`));
    });
  });
};
