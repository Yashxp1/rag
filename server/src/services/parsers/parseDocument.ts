import { parseOffice } from "officeparser";

export const parseDocument = async (
  fileBuffer: Buffer | Uint8Array,
  fileTypeOrExt: string,
) => {
  const lower = fileTypeOrExt.toLowerCase();

  if (
    lower === "txt" ||
    lower === "md" ||
    lower === "text/plain" ||
    lower === "text/markdown"
  ) {
    return Buffer.from(fileBuffer).toString("utf-8");
  }

  let fileType = lower;
  if (lower.includes("wordprocessingml") || lower.includes("msword"))
    fileType = "docx";
  else if (lower.includes("pdf")) fileType = "pdf";
  else if (lower.includes("presentationml") || lower.includes("powerpoint"))
    fileType = "pptx";
  else if (lower.includes("spreadsheetml") || lower.includes("excel"))
    fileType = "xlsx";

  const ast = await parseOffice(fileBuffer, {
    fileType: fileType as any,
    extractAttachments: true,
    ocr: true,
  });

  return ast.toText();
};
