import { initCodeCopy } from "./codeblock.js";
import { showCelebration } from "./celebrate.js";
import { initLessonPage, initQuizPage } from "./lesson-page.js";
import {
  initProgressControls,
  initTheme,
  loadProgress,
  saveProgress,
  withQuizResult,
} from "./storage.js";

// 先把解鎖後的內容放進畫面，再依存檔勾選「完成」與進度條。
initLessonPage();
initQuizPage(handleQuizResult);
initProgressControls();
initTheme();
initCodeCopy();

function handleQuizResult(result) {
  const before = loadProgress();
  const already = before.passedQuizzes.includes(result.week);
  saveProgress(withQuizResult(before, result.week, result.correct, result.total));
  if (!result.passed) return;

  const nextLink = document.querySelector("[data-quiz-next]");
  if (nextLink) nextLink.hidden = false;

  if (already) {
    showCelebration({
      title: result.week === 4 ? "結業徽章還在" : "這一週你已經通過了",
      message: "成績有留著。已解鎖的關卡會維持打開。",
      actions: [{ href: "/", label: "回到地圖" }],
    });
    return;
  }

  if (result.week === 4) {
    showCelebration({
      title: "結業徽章到手",
      message: "四週都通過了。複習模式已打開，加碼關卡也可以讀了。",
      actions: [
        { href: "/lessons/bonus-01.html", label: "前往加碼關卡" },
        { href: "/", label: "回地圖看徽章" },
      ],
    });
    return;
  }

  showCelebration({
    title: `第 ${result.week + 1} 週解鎖了`,
    message: "下一週的講義現在可以讀了。答錯的題目，解析留在這一頁。",
    actions: [
      { href: `/lessons/w${result.week + 1}-01.html`, label: `開始第 ${result.week + 1} 週` },
      { href: "/", label: "回到地圖" },
    ],
  });
}
