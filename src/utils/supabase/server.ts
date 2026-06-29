/**
 * @file src/utils/supabase/server.ts
 * @description Server-side Supabase client using @supabase/ssr.
 *
 * This utility creates a Supabase client that correctly reads and writes
 * authentication cookies in Next.js 14 App Router Server Components,
 * Server Actions, and Route Handlers.
 *
 * Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client scoped to the current server request.
 *
 * Must be called inside a Server Component, Server Action, or Route Handler
 * where `next/headers` is available.
 *
 * @returns A fully-configured Supabase client with cookie-based session handling.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Read all cookies from the incoming request.
         */
        getAll() {
          return cookieStore.getAll();
        },
        /**
         * Write cookies back to the response.
         * Note: In Server Components this is a no-op; it only works in
         * Server Actions and Route Handlers where the response can be mutated.
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` call is a no-op in Server Components – this is fine.
            // Middleware is responsible for refreshing the session in that case.
          }
        },
      },
    }
  );
}
