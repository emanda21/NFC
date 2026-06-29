/**
 * @file src/utils/slugify.ts
 * @description Slug generation utilities for profile URLs.
 */

import slugifyLib from "slugify";
import { createClient } from "@/utils/supabase/server";

/**
 * Converts any string into a URL-safe slug.
 *
 * Examples:
 *   "Hotel Skylight & Spa"  → "hotel-skylight-spa"
 *   "مرحبا بالعالم"          → "mrhb-blalm" (transliterated)
 *
 * @param text - The raw string to slugify.
 * @returns A lowercase, hyphen-separated, URL-safe string.
 */
export function toSlug(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,      // Removes characters that aren't alphanumeric or hyphens
    trim: true,
  });
}

/**
 * Generates a unique slug by checking the Supabase `profiles` table.
 * If the base slug already exists, appends a short random suffix.
 *
 * @param base - The preferred slug (e.g. derived from the profile name).
 * @returns A slug guaranteed to be unique in the database.
 */
export async function generateUniqueSlug(base: string): Promise<string> {
  const supabase = createClient();
  let candidate = toSlug(base);

  // Keep trying until we find a free slug
  let attempts = 0;
  while (attempts < 10) {
    const { data } = await supabase
      .from("profiles")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      // Slug is available
      return candidate;
    }

    // Append a random 4-char suffix and retry
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${toSlug(base)}-${suffix}`;
    attempts++;
  }

  // Fallback: timestamp-based slug (extremely unlikely to collide)
  return `${toSlug(base)}-${Date.now()}`;
}
