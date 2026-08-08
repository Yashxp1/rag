import { PDFParse } from "pdf-parse";

export async function parse(file: Buffer | Uint8Array) {
  const uint8Array = new Uint8Array(
    file.buffer,
    file.byteOffset,
    file.byteLength,
  );
  const parser = new PDFParse(uint8Array);
  const result = await parser.getText();
  return result;
}
