function readMessage(data) {
  if (!data || typeof data !== "object") return { error: "請傳送 JSON 物件" };
  const author = typeof data.author === "string" ? data.author.trim() : "";
  const body = typeof data.body === "string" ? data.body.trim() : "";
  if (author.length < 1 || author.length > 20) return { error: "作者請介於 1 到 20 個字" };
  if (body.length < 1 || body.length > 500) return { error: "留言請介於 1 到 500 個字" };
  return { author, body };
}

async function handleApi(request, env, url) {
  const one = url.pathname.match(/^\/api\/messages\/(\d+)$/);

  if (url.pathname === "/api/messages" && request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT id, author, body, created_at FROM messages ORDER BY id DESC",
    ).all();
    return Response.json(results);
  }

  if (url.pathname === "/api/messages" && request.method === "POST") {
    let data;
    try {
      data = await request.json();
    } catch {
      return Response.json({ error: "請傳送 JSON" }, { status: 400 });
    }
    const parsed = readMessage(data);
    if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 });

    const inserted = await env.DB.prepare(
      "INSERT INTO messages (author, body) VALUES (?, ?)",
    ).bind(parsed.author, parsed.body).run();

    const row = await env.DB.prepare(
      "SELECT id, author, body, created_at FROM messages WHERE id = ?",
    ).bind(inserted.meta.last_row_id).first();
    return Response.json(row, { status: 201 });
  }

  if (one && request.method === "DELETE") {
    const id = Number(one[1]);
    const existing = await env.DB.prepare("SELECT id FROM messages WHERE id = ?").bind(id).first();
    if (!existing) return Response.json({ error: "找不到留言" }, { status: 404 });
    await env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(id).run();
    return Response.json({ deleted: id });
  }

  return Response.json({ error: "找不到這個路徑" }, { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env, url);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(JSON.stringify({
        level: "error",
        path: url.pathname,
        message: error instanceof Error ? error.message : "unknown",
      }));
      return Response.json({ error: "伺服器暫時無法完成這件事" }, { status: 500 });
    }
  },
};
