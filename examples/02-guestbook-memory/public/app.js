const list = document.querySelector("#list");
const status = document.querySelector("#status");
const form = document.querySelector("#composer");

async function load() {
  const response = await fetch("/api/messages");
  const data = await response.json();
  list.replaceChildren();
  for (const message of data) {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = `${message.author}：${message.body}`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "刪除";
    button.addEventListener("click", async () => {
      const deleted = await fetch(`/api/messages/${message.id}`, { method: "DELETE" });
      if (!deleted.ok) {
        status.textContent = "刪除失敗";
        return;
      }
      await load();
    });
    item.append(text, button);
    list.append(item);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = {
    author: new FormData(form).get("author"),
    body: new FormData(form).get("body"),
  };
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  status.textContent = response.ok ? "已送出" : data.error || "失敗";
  if (response.ok) form.reset();
  await load();
});

load();
