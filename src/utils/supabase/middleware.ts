/**
 * @file src/utils/supabase/middleware.ts
 * @description Supabase session refresh helper for Next.js Middleware.
 *
 * Refreshes the user's Supabase session on every request so that
 * Server Components always receive a fresh, valid session cookie.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Call this inside your root `middleware.ts` to keep sessions alive.
 *
 * @param request - The incoming Next.js request object.
 * @returns A NextResponse with refreshed auth cookies attached.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          // First write cookies to the request (for subsequent middleware)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Then rewrite the response with updated cookies
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  // A simple mistake can make the session hard to debug.
  await supabase.auth.getUser();

  return supabaseResponse;
}
