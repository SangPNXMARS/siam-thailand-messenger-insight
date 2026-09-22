import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "./lib/auth";

export const config = {
  matcher: ["/((?!login|api/login|api/refresh|api/logout|_next/static|_next/image|favicon.ico).*)"],
  };

  export async function middleware(request) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
      const valid = await verifySessionToken(token);

        if (!valid) {
            const loginUrl = new URL("/login", request.url);
                loginUrl.searchParams.set("next", request.nextUrl.pathname);
                    return NextResponse.redirect(loginUrl);
                      }

                        return NextResponse.next();
                        }
                        
