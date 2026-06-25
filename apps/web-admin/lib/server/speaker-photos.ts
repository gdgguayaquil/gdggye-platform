import "server-only";

import { getSupabaseServiceClient } from "./supabase";

const BUCKET = "speakers";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — speaker photos shouldn't be huge.

export interface UploadSpeakerPhotoResult {
  publicUrl: string;
  path: string;
}

function extensionFor(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

// Uploads a photo for `speakerId` to the `speakers` Storage bucket and
// returns the public URL. Uses service-role to bypass storage.objects RLS;
// the migration's bucket-scoped staff-write policy is the defense-in-depth.
// Files land at `speakers/<speakerId>/<timestamp>.<ext>` so re-uploads don't
// clobber the previous file (Supabase serves them with cache headers).
export async function uploadSpeakerPhoto(
  speakerId: string,
  file: File,
): Promise<UploadSpeakerPhotoResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      `unsupported photo type: ${file.type || "unknown"} (allowed: jpg, png, webp, avif)`,
    );
  }
  if (file.size === 0) {
    throw new Error("empty file");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      `photo too large (${Math.round(file.size / 1024)} KB); max is ${MAX_BYTES / 1024 / 1024} MB`,
    );
  }

  const supabase = getSupabaseServiceClient();
  const ext = extensionFor(file.type);
  const path = `${speakerId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "604800", // 7d
      upsert: false,
    });
  if (uploadError) {
    throw new Error(`speaker photo upload failed: ${uploadError.message}`);
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: publicData.publicUrl, path };
}
