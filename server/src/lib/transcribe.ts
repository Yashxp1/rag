import { spawn } from "child_process";

export const transcribe = (filePath: string) => {
  return new Promise((resolve, reject) => {
    const whisper = spawn(
      "D:/projects/whisper.cpp/build/bin/whisper-cli.exe",
      [
        "-m",
        "D:/projects/whisper.cpp/models/ggml-base.bin",
        "-f",
        filePath,
        "-nt",
      ],
      {
        env: {
          ...process.env,
          PATH: `C:\\msys64\\ucrt64\\bin;${process.env.PATH || ""}`,
        },
      },
    );

    let output = "";

    whisper.stdout.on("data", (data) => {
      output += data.toString();
    });

    whisper.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    whisper.on("close", (code) => {
      if (code === 0) {
        console.log("Transcribed Output:\n", output);
        resolve(output);
      } else reject(new Error(`Whisper failed with exit code ${code}`));
    });
  });
};
