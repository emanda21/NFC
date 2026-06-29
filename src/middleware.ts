/**
 * @file src/middleware.ts
 * @description Next.js Middleware – refreshes Supabase auth sessions on every request.
 *
 * This ensures Server Components always have access to a valid session.
 * The matcher excludes static assets and image optimisation routes.
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico   (browser icon)
     * - Files with extensions (e.g. .png, .jpg, .svg, .css, .js)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
