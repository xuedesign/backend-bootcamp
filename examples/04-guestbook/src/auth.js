import { hashPassword, randomHex, safeEqual } from "./password.js";
import { clearCookie, deleteSession, readSession, saveSession, sessionCookie } from "./session.js";

const USERNAME = /^[A-Za-z0-9_]{3,20}$/;

function isSecure(request) {
  return new URL(request.url).protocol === "https:";
}

async function readJson(request) {
  try {
    const value = await request.json();
    if (!value || typeof value !== "object") {
      return { error: Response.json({ error: "請傳送 JSON 物件" }, { status: 400 }) };
    }
    return { value };
  } catch {
    return { error: Response.json({ error: "請傳送 JSON" }, { status: 400 }) };
  }
}

function missingPepper() {
  return Response.json({ error: "伺服器還沒設定胡椒" }, { status: 500 });
}

async function startSession(request, env, user) {
  const token = randomHex(32);
  await saveSession(env, token, { userId: user.id, username: user.username });
  return new Response(JSON.stringify({ username: user.username }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": sessionCookie(token, isSecure(request)),
    },
  });
}

export async function register(request, env) {
  if (!env.PEPPER) return missingPepper();
  const data = await readJson(request);
  if (data.error) return data.error;

  const username = typeof data.value.username === "string" ? data.value.username.trim() : "";
  const password = typeof data.value.password === "string" ? data.value.password : "";
  if (!USERNAME.test(username)) {
    return Response.json({ error: "帳號請用 3 到 20 個英數或底線" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 72) {
    return Response.json({ error: "密碼請介於 8 到 72 個字" }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE username = ?",
  ).bind(username).first();
  if (existing) return Response.json({ error: "這個帳號已經有人用了" }, { status: 409 });

  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt, env.PEPPER);
  try {
    const inserted = await env.DB.prepare(
      "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
    ).bind(username, passwordHash, salt).run();
    return startSession(request, env, { id: inserted.meta.last_row_id, username });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE")) {
      return Response.json({ error: "這個帳號已經有人用了" }, { status: 409 });
    }
    throw error;
  }
}

export async function login(request, env) {
  if (!env.PEPPER) return missingPepper();
  const data = await readJson(request);
  if (data.error) return data.error;
  const username = typeof data.value.username === "string" ? data.value.username.trim() : "";
  const password = typeof data.value.password === "string" ? data.value.password : "";

  const user = await env.DB.prepare(
    "SELECT id, username, password_hash, salt FROM users WHERE username = ?",
  ).bind(username).first();
  const hash = user ? await hashPassword(password, user.salt, env.PEPPER) : "";
  if (!user || !safeEqual(hash, user.password_hash)) {
    return Response.json({ error: "帳號或密碼不正確" }, { status: 401 });
  }
  return startSession(request, env, { id: user.id, username: user.username });
}

export async function logout(request, env) {
  const session = await readSession(env, request);
  if (session) await deleteSession(env, session.token);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": clearCookie(isSecure(request)),
    },
  });
}

export async function me(request, env) {
  const session = await readSession(env, request);
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  return Response.json({ username: session.username });
}
