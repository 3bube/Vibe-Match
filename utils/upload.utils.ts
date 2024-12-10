import { supabase } from "../lib/supabase";
import * as FileSystem from "expo-file-system";

interface UploadFileOptions {
  uri: string;
  bucket?: string;
}

export const uploadFile = async ({
  uri,
  bucket = "profile_picture",
}: UploadFileOptions): Promise<string> => {
  try {
    // If it's already a Supabase URL, return it as is
    if (uri.includes("supabase")) {
      return uri;
    }

    // Get the file name from the uri
    const fileName = uri.split("/").pop();
    const fileExtension = fileName.split(".").pop() as string;

    // Create a unique file name
    const uniqueFileName = `${Date.now()}-${fileName}`;

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, decode(base64), {
        contentType: `image/${fileExtension}`,
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(uniqueFileName);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

// Helper function to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
