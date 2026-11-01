import { login, logout, me, register } from "./auth.js";
import { backupMessages } from "./backup.js";
import { createMessage, deleteMessage, listMessages } from "./messages.js";

async function handleApi(request, env, url) {
  if (url.pathname === "/api/register" && request.method === "POST") return register(request, env);
  if (url.pathname === "/api/login" && request.method === "POST") return login(request, env);
  if (url.pathname === "/api/logout" && request.method === "POST") return logout(request, env);
  if (url.pathname === "/api/me" && request.method === "GET") return me(request, env);
  if (url.pathname === "/api/messages" && request.method === "GET") return listMessages(env);
  if (url.pathname === "/api/messages" && request.method === "POST") return createMessage(request, env);
  if (url.pathname === "/api/admin/backup" && request.method === "POST") return backupMessages(request, env);

  const one = url.pathname.match(/^\/api\/messages\/(\d+)$/);
  if (one && request.method === "DELETE") return deleteMessage(request, env, Number(one[1]));

  return Response.json({ error: "找不到這個路徑" }, { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env, url);
      return await env.ASSETS.fetch(request);
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
