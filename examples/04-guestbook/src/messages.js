import { readSession } from "./session.js";

function readBody(data) {
  if (!data || typeof data !== "object") return { error: "請傳送 JSON 物件" };
  const body = typeof data.body === "string" ? data.body.trim() : "";
  if (body.length < 1 || body.length > 500) return { error: "留言請介於 1 到 500 個字" };
  return { body };
}

export async function listMessages(env) {
  const { results } = await env.DB.prepare(
    `SELECT messages.id, messages.body, users.username, messages.created_at
     FROM messages
     JOIN users ON users.id = messages.user_id
     ORDER BY messages.created_at DESC, messages.id DESC`,
  ).all();
  return Response.json(results);
}

export async function createMessage(request, env) {
  const session = await readSession(env, request);
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });

  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "請傳送 JSON" }, { status: 400 });
  }
  const parsed = readBody(data);
  if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 });

  const inserted = await env.DB.prepare(
    "INSERT INTO messages (user_id, body) VALUES (?, ?)",
  ).bind(session.userId, parsed.body).run();

  const row = await env.DB.prepare(
    `SELECT messages.id, messages.body, users.username, messages.created_at
     FROM messages
     JOIN users ON users.id = messages.user_id
     WHERE messages.id = ?`,
  ).bind(inserted.meta.last_row_id).first();
  return Response.json(row, { status: 201 });
}

export async function deleteMessage(request, env, id) {
  const session = await readSession(env, request);
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });

  const row = await env.DB.prepare(
    "SELECT id, user_id FROM messages WHERE id = ?",
  ).bind(id).first();
  if (!row) return Response.json({ error: "找不到留言" }, { status: 404 });
  if (Number(row.user_id) !== session.userId) {
    return Response.json({ error: "只能刪除自己的留言" }, { status: 403 });
  }

  await env.DB.prepare(
    "DELETE FROM messages WHERE id = ? AND user_id = ?",
  ).bind(id, session.userId).run();
  return Response.json({ deleted: id });
}
