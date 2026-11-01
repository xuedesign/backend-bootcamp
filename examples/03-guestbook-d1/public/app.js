const list = document.querySelector("#list");
const status = document.querySelector("#status");
const form = document.querySelector("#composer");

function showError(response, data) {
  status.textContent = data.error || `失敗 ${response.status}`;
}

async function load() {
  const response = await fetch("/api/messages");
  const data = await response.json();
  if (!response.ok) {
    showError(response, data);
    return;
  }
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
      const payload = await deleted.json();
      if (!deleted.ok) {
        showError(deleted, payload);
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
  const formData = new FormData(form);
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      author: formData.get("author"),
      body: formData.get("body"),
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    showError(response, data);
    return;
  }
  status.textContent = "已送出";
  form.reset();
  await load();
});

load();
