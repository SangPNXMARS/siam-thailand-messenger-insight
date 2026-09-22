import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { COOKIE_NAME, verifySessionToken } from "../../../lib/auth";

// Làm mới dữ liệu thủ công: yêu cầu ĐÃ đăng nhập (cookie hợp lệ) HOẶC gọi kèm
// ?key=REFRESH_SECRET (dùng cho cron ngoài, ví dụ GitHub Actions / Vercel Cron).
export async function POST(request) {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const cookieToken = request.cookies.get(COOKIE_NAME)?.value;

    const loggedIn = await verifySessionToken(cookieToken);
    const keyOk = process.env.REFRESH_SECRET && key === process.env.REFRESH_SECRET;

    if (!loggedIn && !keyOk) {
          return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }

    revalidateTag("messenger-insights");
    return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
  }
