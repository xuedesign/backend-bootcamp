function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.append(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export function initCodeCopy() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest?.(".codeblock__copy");
    if (!button) return;
    const code = button.closest(".codeblock")?.querySelector("pre")?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      fallbackCopy(code);
    }
    const previous = button.textContent;
    button.textContent = "已複製";
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1600);
  });
}
