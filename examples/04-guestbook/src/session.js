const WEEK = 60 * 60 * 24 * 7;

export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const prefix = `${name}=`;
  const found = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : "";
}

export function sessionCookie(token, secure) {
  const parts = [
    `session=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${WEEK}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie(secure) {
  const parts = ["session=", "HttpOnly", "Path=/", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export async function saveSession(env, token, session) {
  await env.SESSIONS.put(token, JSON.stringify(session), { expirationTtl: WEEK });
}

export async function readSession(env, request) {
  const token = readCookie(request, "session");
  if (!token) return null;
  const raw = await env.SESSIONS.get(token);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session || typeof session.username !== "string") return null;
    return { token, userId: Number(session.userId), username: session.username };
  } catch {
    return null;
  }
}

export async function deleteSession(env, token) {
  if (token) await env.SESSIONS.delete(token);
}
