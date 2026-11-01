import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyProgress,
  isPassingScore,
  isWeekUnlocked,
  normalizeProgress,
  withQuizResult,
  withReviewMode,
} from "../src/scripts/progress-core.js";

test("第 1 週預設解鎖，後面的週次先鎖住", () => {
  const progress = emptyProgress();
  assert.equal(isWeekUnlocked(1, progress), true);
  assert.equal(isWeekUnlocked(2, progress), false);
  assert.equal(isWeekUnlocked(3, progress), false);
  assert.equal(isWeekUnlocked(4, progress), false);
});

test("通過測驗才打開下一週，80% 是門檻", () => {
  assert.equal(isPassingScore(8, 10), true);
  assert.equal(isPassingScore(7, 10), false);

  let progress = emptyProgress();
  progress = withQuizResult(progress, 1, 7, 10);
  assert.equal(isWeekUnlocked(2, progress), false);

  progress = withQuizResult(progress, 1, 8, 10);
  assert.equal(isWeekUnlocked(2, progress), true);
  assert.equal(isWeekUnlocked(3, progress), false);

  progress = withQuizResult(progress, 2, 10, 10);
  progress = withQuizResult(progress, 3, 9, 10);
  assert.equal(isWeekUnlocked(4, progress), true);
  assert.equal(progress.graduated, false);
});

test("第 4 週通過後結業，並自動打開複習模式", () => {
  let progress = emptyProgress();
  for (const week of [1, 2, 3]) {
    progress = withQuizResult(progress, week, 8, 10);
  }
  progress = withQuizResult(progress, 4, 8, 10);
  assert.equal(progress.graduated, true);
  assert.equal(progress.reviewMode, true);
  assert.equal(isWeekUnlocked(4, progress), true);
});

test("還沒結業不能硬開複習模式", () => {
  const progress = withReviewMode(withQuizResult(emptyProgress(), 1, 8, 10), true);
  assert.equal(progress.reviewMode, false);
  assert.equal(isWeekUnlocked(3, progress), false);
});

test("壞掉的存檔會被忽略", () => {
  const progress = normalizeProgress({
    passedQuizzes: ["1", 9, "nope"],
    completedLessons: ["w1-01", "<script>", "w9-99"],
    reviewMode: true,
  });
  assert.deepEqual(progress.passedQuizzes, [1]);
  assert.deepEqual(progress.completedLessons, ["w1-01"]);
  assert.equal(progress.reviewMode, false);
});
