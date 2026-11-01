// 這份陣列是白板。重啟或換一個執行環境，留言就不會還在。
const messages = [];
let nextId = 1;

function readMessage(data) {
  if (!data || typeof data !== "object") return { error: "請傳送 JSON 物件" };
  const author = typeof data.author === "string" ? data.author.trim() : "";
  const body = typeof data.body === "string" ? data.body.trim() : "";
  if (author.length < 1 || author.length > 20) return { error: "作者請介於 1 到 20 個字" };
  if (body.length < 1 || body.length > 500) return { error: "留言請介於 1 到 500 個字" };
  return { author, body };
}

async function handleApi(request) {
  const url = new URL(request.url);
  const one = url.pathname.match(/^\/api\/messages\/(\d+)$/);

  if (url.pathname === "/api/messages" && request.method === "GET") {
    return Response.json(messages);
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

    const message = {
      id: nextId,
      author: parsed.author,
      body: parsed.body,
      createdAt: new Date().toISOString(),
    };
    nextId += 1;
    messages.push(message);
    return Response.json(message, { status: 201 });
  }

  if (one && request.method === "DELETE") {
    const id = Number(one[1]);
    const index = messages.findIndex((item) => item.id === id);
    if (index === -1) return Response.json({ error: "找不到留言" }, { status: 404 });
    messages.splice(index, 1);
    return Response.json({ deleted: id });
  }

  return Response.json({ error: "找不到這個路徑" }, { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request);
    return env.ASSETS.fetch(request);
  },
};
