import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export async function uploadToBucket(
  file: File | Blob | Buffer,
  fileName: string,
  contentType?: string,
) {
  try {
    const { data, error } = await supabase.storage
      .from("rag")
      .upload(fileName, file, {
        contentType: contentType,
        upsert: false,
      });

    if (error) {
      console.error("File upload failed:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("File upload failed:", error);
    return null;
  }
}
