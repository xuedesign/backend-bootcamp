function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function launchConfetti() {
  if (reducedMotion()) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const context = canvas.getContext("2d");
  const colors = ["#0f6e6b", "#c4552a", "#e3b341", "#f4efe6", "#1d7a46"];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random(),
    y: Math.random() * -0.4,
    r: 4 + Math.random() * 5,
    s: 0.004 + Math.random() * 0.008,
    c: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * Math.PI,
  }));

  let frame = 0;
  const draw = () => {
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;
    context.clearRect(0, 0, width, height);
    for (const piece of pieces) {
      piece.y += piece.s;
      piece.tilt += 0.05;
      context.save();
      context.translate(piece.x * width, piece.y * height);
      context.rotate(piece.tilt);
      context.fillStyle = piece.c;
      context.fillRect(-piece.r, -piece.r / 2, piece.r * 2, piece.r);
      context.restore();
    }
    frame += 1;
    if (frame < 160) requestAnimationFrame(draw);
    else canvas.remove();
  };
  requestAnimationFrame(draw);
}

export function showCelebration({ title, message, actions }) {
  const dialog = document.createElement("dialog");
  dialog.className = "celebrate";
  const headingId = "celebrate-title";
  const actionsHtml = actions.map((action, index) => {
    const className = index === 0 ? "button button--primary" : "button";
    return `<a class="${className}" href="${action.href}">${action.label}</a>`;
  }).join("");
  dialog.innerHTML = `
    <p class="celebrate__kicker">通關</p>
    <h2 id="${headingId}">${title}</h2>
    <p>${message}</p>
    <div class="modal__actions">${actionsHtml}</div>
    <form method="dialog"><button class="button button--ghost" type="submit">先留在這一頁</button></form>
  `;
  dialog.setAttribute("aria-labelledby", headingId);
  document.body.append(dialog);
  dialog.showModal();
  launchConfetti();
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
}
