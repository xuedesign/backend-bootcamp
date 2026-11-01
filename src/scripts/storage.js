import {
  STORAGE_KEY,
  THEME_KEY,
  countCompleted,
  isWeekUnlocked,
  normalizeProgress,
  withLessonCompletion,
  withQuizResult,
  withReviewMode,
} from "./progress-core.js";

export function loadProgress() {
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return normalizeProgress(null);
  }
}

export function knownLessonIds() {
  const node = document.querySelector("#curriculum");
  if (!node) return [];
  try {
    return JSON.parse(node.textContent).map((lesson) => lesson.id);
  } catch {
    return [];
  }
}

export function saveProgress(progress) {
  const clean = normalizeProgress(progress);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    passedQuizzes: clean.passedQuizzes,
    completedLessons: clean.completedLessons,
    quizScores: clean.quizScores,
    reviewMode: clean.reviewMode,
  }));
  applyProgress(clean);
  return clean;
}

export function applyProgress(progress) {
  const root = document.documentElement;
  for (let week = 1; week <= 4; week += 1) {
    root.classList.toggle(`week-open-${week}`, isWeekUnlocked(week, progress));
  }
  root.classList.toggle("is-graduated", progress.graduated);
  root.classList.toggle("review-mode", progress.reviewMode);

  const total = knownLessonIds().length || Number(document.body.dataset.lessonCount || 0);
  const done = countCompleted(progress, knownLessonIds());
  const label = `已完成 ${done} / ${total} 課`;
  document.querySelectorAll("[data-progress-label]").forEach((node) => {
    node.textContent = label;
  });
  document.querySelectorAll("[data-progress-bar]").forEach((bar) => {
    bar.setAttribute("aria-valuemax", String(total));
    bar.setAttribute("aria-valuenow", String(done));
    bar.setAttribute("aria-valuetext", label);
  });
  document.querySelectorAll("[data-progress-fill]").forEach((fill) => {
    const ratio = total === 0 ? 0 : done / total;
    fill.style.width = `${Math.round(ratio * 100)}%`;
  });

  document.querySelectorAll("[data-graduate-badge]").forEach((badge) => {
    badge.hidden = !progress.graduated;
  });

  document.querySelectorAll("[data-lesson-link]").forEach((link) => {
    link.classList.toggle("is-done", progress.completedLessons.includes(link.dataset.lessonLink));
  });

  document.querySelectorAll("[data-complete]").forEach((input) => {
    input.checked = progress.completedLessons.includes(input.dataset.complete);
  });

  const review = document.querySelector("[data-review-toggle]");
  const hint = document.querySelector("[data-review-hint]");
  if (review) {
    review.disabled = !progress.graduated;
    review.setAttribute("aria-pressed", String(progress.reviewMode));
    review.textContent = progress.reviewMode ? "複習模式：開" : "複習模式";
  }
  if (hint) {
    if (!progress.graduated) {
      hint.textContent = "四週測驗都通過以後，就可以開啟複習模式，隨時重看每一課。";
    } else if (progress.reviewMode) {
      hint.textContent = "複習模式已開啟。每一週都維持可讀，你可以照自己的順序重看。";
    } else {
      hint.textContent = "你已經結業。打開複習模式後，地圖會標成可自由複習。已通過的週次不會重新上鎖。";
    }
  }

  return progress;
}

export function initProgressControls() {
  applyProgress(loadProgress());

  document.addEventListener("change", (event) => {
    const input = event.target.closest?.("[data-complete]");
    if (!input) return;
    const next = withLessonCompletion(loadProgress(), input.dataset.complete, input.checked);
    saveProgress(next);
  });

  document.querySelector("[data-review-toggle]")?.addEventListener("click", () => {
    const current = loadProgress();
    if (!current.graduated) return;
    saveProgress(withReviewMode(current, !current.reviewMode));
  });

  document.querySelector("[data-reset]")?.addEventListener("click", async () => {
    const yes = await confirmReset();
    if (!yes) return;
    localStorage.removeItem(STORAGE_KEY);
    applyProgress(loadProgress());
    window.location.href = "/";
  });
}

function confirmReset() {
  const dialog = document.createElement("dialog");
  dialog.className = "modal";
  dialog.innerHTML = `
    <h2 id="reset-title">重設進度？</h2>
    <p>這會清掉這台瀏覽器裡的完成勾選、測驗成績與複習模式。講義還在，關卡會回到只開放第 1 週。</p>
    <div class="modal__actions">
      <button type="button" class="button" data-reset-choice="cancel">先不要</button>
      <button type="button" class="button button--primary" data-reset-choice="ok">確定重設</button>
    </div>
  `;
  dialog.setAttribute("aria-labelledby", "reset-title");
  document.body.append(dialog);
  const ok = dialog.querySelector("[data-reset-choice='ok']");
  dialog.showModal();
  ok.focus();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      dialog.close();
      dialog.remove();
      resolve(value);
    };
    dialog.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      finish(button.dataset.resetChoice === "ok");
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(false);
    });
  });
}

export function initTheme() {
  const toggle = document.querySelector("[data-theme-toggle]");
  toggle?.addEventListener("click", () => {
    const root = document.documentElement;
    const explicit = root.dataset.theme;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = explicit || (systemDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  });
}

export { withQuizResult };
