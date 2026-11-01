import { readSession } from "./session.js";

export async function backupMessages(request, env) {
  const session = await readSession(env, request);
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });

  const { results } = await env.DB.prepare(
    `SELECT messages.id, messages.body, users.username, messages.created_at
     FROM messages
     JOIN users ON users.id = messages.user_id
     ORDER BY messages.id`,
  ).all();

  const stamp = new Date().toISOString().replaceAll(":", "-");
  const key = `exports/${stamp}.json`;
  await env.BACKUPS.put(key, JSON.stringify({ exportedAt: stamp, messages: results }), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
  return Response.json({ key, count: results.length });
}
