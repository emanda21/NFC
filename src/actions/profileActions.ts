/**
 * @file src/actions/profileActions.ts
 * @description Next.js 14 Server Actions for the NFC Digital Business Card platform.
 *
 * All functions in this file run exclusively on the server (they are never
 * bundled into the client). They interact directly with Supabase using the
 * server-side client that handles cookie-based auth sessions.
 *
 * Usage in a Server Component:
 *   import { getProfileBySlug } from "@/actions/profileActions";
 *   const profile = await getProfileBySlug("hotel-skylight");
 *
 * Usage in a Client Component (via <form action={…} /> or startTransition):
 *   import { createProfile } from "@/actions/profileActions";
 */

"use server";

import { createClient } from "@/utils/supabase/server";
import { generateUniqueSlug, toSlug } from "@/utils/slugify";
import type {
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
} from "@/types/profile";

// ─── Return type helpers ──────────────────────────────────────────────────────

/**
 * Generic server action response wrapper.
 * Discriminated union: either success or error – never both.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── createProfile ────────────────────────────────────────────────────────────

/**
 * Inserts a new profile record into the `profiles` table.
 *
 * Behaviour:
 * - If `input.slug` is provided, it is slugified and uniqueness-checked.
 * - If `input.slug` is absent, a slug is auto-generated from `input.name`.
 * - Returns the final slug so the caller can redirect to `/p/<slug>`.
 *
 * @param input - Profile data (see CreateProfileInput).
 * @returns ActionResult containing { slug } on success or an error message.
 *
 * @example
 * const result = await createProfile({
 *   profile_type: "hotel",
 *   name: "Hotel Skylight",
 *   bio: "Luxury stays in the heart of the city.",
 *   avatar_url: "https://example.com/logo.png",
 *   contact_info: { email: "info@hotelskylight.com", phone: "+1-800-555-0100" },
 *   social_links: [{ platform: "Instagram", url: "https://instagram.com/hotelskylight" }],
 *   custom_links: [{ title: "Book a Room", url: "https://hotelskylight.com/book" }],
 * });
 *
 * if (result.success) {
 *   redirect(`/p/${result.data.slug}`);
 * }
 */
export async function createProfile(
  input: CreateProfileInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const supabase = createClient();

    // ── 1. Resolve slug ──────────────────────────────────────────────────────
    let slug: string;

    if (input.slug && input.slug.trim().length > 0) {
      // Caller provided a preferred slug – still need to guarantee uniqueness
      slug = await generateUniqueSlug(input.slug.trim());
    } else {
      // Auto-generate from the profile name
      if (!input.name || input.name.trim().length === 0) {
        return { success: false, error: "A profile name is required to generate a slug." };
      }
      slug = await generateUniqueSlug(input.name.trim());
    }

    // ── 2. Build the insert payload ──────────────────────────────────────────
    const payload = {
      slug,
      profile_type: input.profile_type,
      name: input.name.trim(),
      bio: input.bio ?? null,
      avatar_url: input.avatar_url ?? null,
      // JSONB columns – store as-is (Supabase handles serialisation)
      contact_info: input.contact_info ?? null,
      social_links: input.social_links ?? null,
      custom_links: input.custom_links ?? null,
    };

    // ── 3. Insert into Supabase ──────────────────────────────────────────────
    const { data, error } = await supabase
      .from("profiles")
      .insert(payload)
      .select("id, slug")
      .single();

    if (error) {
      console.error("[createProfile] Supabase error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: { id: data.id, slug: data.slug } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred.";
    console.error("[createProfile] Unexpected error:", message);
    return { success: false, error: message };
  }
}

// ─── getProfileBySlug ─────────────────────────────────────────────────────────

/**
 * Fetches a single profile from the `profiles` table by its URL slug.
 *
 * Intended to be called from Server Components rendering the public profile page
 * (e.g., `app/p/[slug]/page.tsx`).
 *
 * @param slug - The URL-safe slug, e.g. "hotel-skylight".
 * @returns ActionResult containing the full Profile object, or an error.
 *
 * @example
 * // app/p/[slug]/page.tsx
 * const result = await getProfileBySlug(params.slug);
 * if (!result.success) notFound();
 * const profile = result.data;
 */
export async function getProfileBySlug(
  slug: string
): Promise<ActionResult<Profile>> {
  try {
    if (!slug || slug.trim().length === 0) {
      return { success: false, error: "Slug must not be empty." };
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", slug.trim())
      .single();

    if (error) {
      // PostgREST returns error code PGRST116 when no rows are found
      if (error.code === "PGRST116") {
        return { success: false, error: `No profile found with slug "${slug}".` };
      }
      console.error("[getProfileBySlug] Supabase error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Profile };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred.";
    console.error("[getProfileBySlug] Unexpected error:", message);
    return { success: false, error: message };
  }
}

// ─── getAllProfiles ───────────────────────────────────────────────────────────

/**
 * Fetches all profiles, optionally filtered by `profile_type`.
 * Useful for admin dashboards or listing pages.
 *
 * @param profileType - Optional filter (e.g. "hotel", "individual").
 * @param limit       - Max number of records to return (default: 50).
 * @returns ActionResult containing an array of Profile objects.
 */
export async function getAllProfiles(
  profileType?: Profile["profile_type"],
  limit = 50
): Promise<ActionResult<Profile[]>> {
  try {
    const supabase = createClient();

    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (profileType) {
      query = query.eq("profile_type", profileType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getAllProfiles] Supabase error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as Profile[]) ?? [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred.";
    console.error("[getAllProfiles] Unexpected error:", message);
    return { success: false, error: message };
  }
}

// ─── updateProfile ────────────────────────────────────────────────────────────

/**
 * Updates an existing profile record by its `id`.
 *
 * If `slug` is included in the update payload, uniqueness is re-validated.
 *
 * @param input - Partial profile fields + mandatory `id`.
 * @returns ActionResult containing the updated Profile.
 */
export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult<Profile>> {
  try {
    const supabase = createClient();

    // If the caller wants to change the slug, validate uniqueness
    if (input.slug) {
      const newSlug = toSlug(input.slug.trim());

      // Check if this slug belongs to a *different* profile
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", newSlug)
        .maybeSingle();

      if (existing && existing.id !== input.id) {
        return {
          success: false,
          error: `The slug "${newSlug}" is already taken by another profile.`,
        };
      }

      input.slug = newSlug;
    }

    // Strip `id` from the update payload (it's the filter, not a column to update)
    const { id, ...fields } = input;

    const { data, error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[updateProfile] Supabase error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Profile };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred.";
    console.error("[updateProfile] Unexpected error:", message);
    return { success: false, error: message };
  }
}

// ─── deleteProfile ────────────────────────────────────────────────────────────

/**
 * Permanently deletes a profile record by its `id`.
 *
 * @param id - UUID of the profile to delete.
 * @returns ActionResult containing `{ deleted: true }` on success.
 */
export async function deleteProfile(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const supabase = createClient();

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      console.error("[deleteProfile] Supabase error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: { deleted: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred.";
    console.error("[deleteProfile] Unexpected error:", message);
    return { success: false, error: message };
  }
}
