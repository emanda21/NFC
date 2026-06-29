/**
 * @file src/utils/supabase/client.ts
 * @description Browser-side Supabase client using @supabase/ssr.
 *
 * Use this client inside Client Components ("use client") that need to
 * interact with Supabase (e.g., real-time subscriptions, client-side queries).
 * For mutations and sensitive operations, prefer Server Actions.
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a singleton Supabase browser client.
 * Safe to call multiple times – internally memoised by @supabase/ssr.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
