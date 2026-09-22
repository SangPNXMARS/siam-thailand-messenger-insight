// Xác thực đăng nhập bằng mật khẩu đơn giản + session cookie ký bằng HMAC-SHA256
// (dùng Web Crypto API để chạy được cả trên Edge middleware lẫn Node route handler).

const COOKIE_NAME = "siam_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 ngày

function getSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
          throw new Error("Thiếu biến môi trường SESSION_SECRET");
    }
    return secret;
}

async function hmacHex(message, secret) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
          "raw",
          enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(message));
    return Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
}

export async function createSessionToken() {
    const secret = getSecret();
    const exp = Date.now() + SESSION_TTL_SECONDS * 1000;
    const sig = await hmacHex(String(exp), secret);
    return `${exp}.${sig}`;
}

export async function verifySessionToken(token) {
    if (!token || typeof token !== "string" || !token.includes(".")) return false;
    const [expStr, sig] = token.split(".");
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Date.now()) return false;
    try {
          const secret = getSecret();
          const expectedSig = await hmacHex(expStr, secret);
          if (expectedSig.length !== sig.length) return false;
          // so sánh constant-time đơn giản
      let diff = 0;
          for (let i = 0; i < expectedSig.length; i++) {
                  diff |= expectedSig.charCodeAt(i) ^ sig.charCodeAt(i);
          }
          return diff === 0;
    } catch {
          return false;
    }
}

export function verifyPassword(candidate) {
    const real = process.env.SITE_PASSWORD;
    if (!real) return false;
    if (!candidate) return false;
    if (candidate.length !== real.length) return false;
    let diff = 0;
    for (let i = 0; i < real.length; i++) {
          diff |= candidate.charCodeAt(i) ^ real.charCodeAt(i);
    }
    return diff === 0;
}

export { COOKIE_NAME, SESSION_TTL_SECONDS };
