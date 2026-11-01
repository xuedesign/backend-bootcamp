/** 闖關進度的純函式。不碰 localStorage，方便用 Node 測試。 */

export const STORAGE_KEY = "backend-bootcamp-progress-v1";
export const THEME_KEY = "backend-bootcamp-theme";
export const PASS_RATIO = 0.8;
export const TOTAL_WEEKS = 4;

export function emptyProgress() {
  return {
    passedQuizzes: [],
    completedLessons: [],
    quizScores: {},
    reviewMode: false,
    graduated: false,
  };
}

function uniqueWeeks(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map(Number)
      .filter((week) => Number.isInteger(week) && week >= 1 && week <= TOTAL_WEEKS),
  )].sort((a, b) => a - b);
}

export function isGraduated(passedQuizzes) {
  return [1, 2, 3, 4].every((week) => passedQuizzes.includes(week));
}

/**
 * 把存檔整理成固定形狀。
 * 複習模式只有結業（四次測驗都通過）之後才算數。
 */
export function normalizeProgress(raw) {
  if (!raw || typeof raw !== "object") return emptyProgress();

  const passedQuizzes = uniqueWeeks(raw.passedQuizzes);
  const completedLessons = [...new Set(
    (Array.isArray(raw.completedLessons) ? raw.completedLessons : [])
      .filter((id) => typeof id === "string" && /^w[1-4]-\d{2}$/.test(id)),
  )];

  const quizScores = {};
  if (raw.quizScores && typeof raw.quizScores === "object") {
    for (const [key, value] of Object.entries(raw.quizScores)) {
      const week = Number(key);
      if (!Number.isInteger(week) || week < 1 || week > TOTAL_WEEKS) continue;
      if (!value || typeof value !== "object") continue;
      const correct = Number(value.correct);
      const total = Number(value.total);
      if (!Number.isInteger(correct) || !Number.isInteger(total) || total < 1) continue;
      quizScores[String(week)] = { correct, total };
    }
  }

  const graduated = isGraduated(passedQuizzes);
  return {
    passedQuizzes,
    completedLessons,
    quizScores,
    reviewMode: graduated && raw.reviewMode === true,
    graduated,
  };
}

/** 第 1 週一開始就開。之後每一週要先通過前一週的測驗。結業且開啟複習模式時，全部打開。 */
export function isWeekUnlocked(week, progress) {
  const weekNumber = Number(week);
  if (weekNumber === 1) return true;
  if (progress.reviewMode && progress.graduated) return true;
  return progress.passedQuizzes.includes(weekNumber - 1);
}

export function isPassingScore(correct, total, ratio = PASS_RATIO) {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return false;
  return correct / total >= ratio;
}

export function withLessonCompletion(progress, lessonId, completed) {
  const next = normalizeProgress(progress);
  const ids = new Set(next.completedLessons);
  if (completed) ids.add(lessonId);
  else ids.delete(lessonId);
  next.completedLessons = [...ids];
  return next;
}

export function withQuizResult(progress, week, correct, total) {
  const next = normalizeProgress(progress);
  const wasGraduated = next.graduated;
  const weekNumber = Number(week);
  next.quizScores = {
    ...next.quizScores,
    [String(weekNumber)]: { correct, total },
  };
  if (isPassingScore(correct, total) && !next.passedQuizzes.includes(weekNumber)) {
    next.passedQuizzes = [...next.passedQuizzes, weekNumber].sort((a, b) => a - b);
  }
  next.graduated = isGraduated(next.passedQuizzes);
  if (!wasGraduated && next.graduated) next.reviewMode = true;
  if (!next.graduated) next.reviewMode = false;
  return next;
}

export function withReviewMode(progress, enabled) {
  const next = normalizeProgress(progress);
  next.reviewMode = next.graduated && enabled === true;
  return next;
}

export function countCompleted(progress, knownIds) {
  const known = new Set(knownIds);
  return progress.completedLessons.filter((id) => known.has(id)).length;
}
