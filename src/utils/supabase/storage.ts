/**
 * @file src/utils/supabase/storage.ts
 * @description Browser-side Supabase Storage upload helper.
 *
 * Must only be called from Client Components ("use client").
 * Uploads a File to a Supabase Storage bucket and returns
 * the publicly accessible URL.
 *
 * Prerequisites:
 *   - The target bucket must exist in your Supabase project.
 *   - The bucket must be set to PUBLIC, or have an RLS policy
 *     that allows anonymous INSERT.
 */

import { createClient } from "@/utils/supabase/client";

/**
 * Uploads a `File` to a Supabase Storage bucket.
 *
 * @param file   - The File object from an <input type="file"> element.
 * @param bucket - Supabase Storage bucket name (e.g. "logos").
 * @param folder - Optional subfolder within the bucket (default: "uploads").
 * @returns The permanent public URL of the uploaded file.
 * @throws  If the upload fails or the bucket is inaccessible.
 *
 * @example
 * const url = await uploadFile(file, "logos", "covers");
 * // → "https://<project>.supabase.co/storage/v1/object/public/logos/covers/..."
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder = "uploads"
): Promise<string> {
  const supabase = createClient();

  // Build a unique file path to avoid collisions
  const ext        = file.name.split(".").pop() ?? "jpg";
  const uniqueName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(uniqueName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}
