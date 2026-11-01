const me = document.querySelector("#me");
const status = document.querySelector("#status");
const list = document.querySelector("#list");
const auth = document.querySelector("#auth");
const composer = document.querySelector("#composer");

let current = null;

async function send(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function note(response, data, okText) {
  status.textContent = response.ok ? okText : (data.error || `失敗 ${response.status}`);
}

async function refreshMe() {
  const { response, data } = await send("/api/me");
  current = response.ok ? data.username : null;
  me.textContent = current ? `已登入：${current}` : "尚未登入";
}

async function load() {
  const { response, data } = await send("/api/messages");
  if (!response.ok) {
    note(response, data, "");
    return;
  }
  list.replaceChildren();
  for (const message of data) {
    const item = document.createElement("li");
    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = message.username;
    const body = document.createElement("p");
    body.textContent = message.body;
    const time = document.createElement("time");
    time.dateTime = message.created_at;
    time.textContent = message.created_at;
    text.append(title, body, time);
    item.append(text);
    if (current && message.username === current) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "刪除";
      button.addEventListener("click", async () => {
        const deleted = await send(`/api/messages/${message.id}`, { method: "DELETE" });
        note(deleted.response, deleted.data, "已刪除");
        await load();
      });
      item.append(button);
    }
    list.append(item);
  }
}

async function authenticate(url) {
  const formData = new FormData(auth);
  const result = await send(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: formData.get("username"),
      password: formData.get("password"),
    }),
  });
  note(result.response, result.data, "已登入");
  await refreshMe();
  await load();
}

document.querySelector("#register").addEventListener("click", () => authenticate("/api/register"));
document.querySelector("#login").addEventListener("click", () => authenticate("/api/login"));
document.querySelector("#logout").addEventListener("click", async () => {
  const result = await send("/api/logout", { method: "POST" });
  note(result.response, result.data, "已登出");
  await refreshMe();
  await load();
});
document.querySelector("#backup").addEventListener("click", async () => {
  const result = await send("/api/admin/backup", { method: "POST" });
  note(result.response, result.data, result.data.key ? `已備份 ${result.data.key}` : "已備份");
});

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const result = await send("/api/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body: new FormData(composer).get("body") }),
  });
  note(result.response, result.data, "已送出");
  if (result.response.ok) composer.reset();
  await load();
});

await refreshMe();
await load();
