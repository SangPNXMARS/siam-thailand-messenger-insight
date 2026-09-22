import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_TTL_SECONDS, createSessionToken, verifyPassword } from "../../../lib/auth";

export async function POST(request) {
    const form = await request.formData().catch(() => null);
    const password = form?.get("password")?.toString() || "";
    const next = form?.get("next")?.toString() || "/";

    if (!verifyPassword(password)) {
          const url = new URL("/login", request.url);
          url.searchParams.set("error", "1");
          url.searchParams.set("next", next);
          return NextResponse.redirect(url, { status: 303 });
        }

    const token = await createSessionToken();
    const res = NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", request.url), { status: 303 });
    res.cookies.set(COOKIE_NAME, token, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_TTL_SECONDS,
        });
    return res;
  }
