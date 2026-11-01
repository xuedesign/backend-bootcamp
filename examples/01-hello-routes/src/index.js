export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return Response.json({ error: "這個練習只接受 GET" }, { status: 405 });
    }

    if (url.pathname === "/api/hello") {
      return Response.json({ message: "哈囉，第 1 週", path: url.pathname });
    }

    if (url.pathname === "/api/time") {
      return Response.json({ now: new Date().toISOString() });
    }

    return Response.json({ error: "找不到這個路徑" }, { status: 404 });
  },
};
