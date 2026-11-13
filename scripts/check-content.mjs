import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const root = path.resolve(import.meta.dirname, "..");
const banned = ["項目", "數據", "部署", "模塊", "代碼", "變量", "变量", "代码", "数据", "项目", "模块", "默認", "默认", "網絡", "服務器", "服务器", "軟件", "用戶", "視頻", "鏈接"];
const expectedDates = {
  "w1-01": "2026-11-02",
  "w1-02": "2026-11-03",
  "w1-03": "2026-11-04",
  "w1-04": "2026-11-05",
  "w1-05": "2026-11-06",
  "w2-01": "2026-11-09",
  "w2-02": "2026-11-10",
  "w2-03": "2026-11-11",
  "w2-04": "2026-11-12",
  "w2-05": "2026-11-13",
  "w3-01": "2026-11-16",
  "w3-02": "2026-11-17",
  "w3-03": "2026-11-18",
  "w3-04": "2026-11-19",
  "w3-05": "2026-11-20",
  "w4-01": "2026-11-23",
  "w4-02": "2026-11-24",
  "w4-03": "2026-11-25",
  "w4-04": "2026-11-26",
  "w4-05": "2026-11-27",
  "bonus-01": "2026-11-30",
};
const requiredHeadings = ["動手做", "案例", "常見錯誤", "自我檢查"];

function asDate(value) {
  if (value instanceof Date) {
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${value.getUTCFullYear()}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

const errors = [];

function fail(message) {
  errors.push(message);
}

const lessonDir = path.join(root, "data", "lessons");
const lessonFiles = (await readdir(lessonDir)).filter((file) => file.endsWith(".md")).sort();
if (lessonFiles.length !== 21) fail(`講義應有 21 份，目前 ${lessonFiles.length} 份`);

const seen = new Set();
for (const file of lessonFiles) {
  const raw = await readFile(path.join(lessonDir, file), "utf8");
  const parsed = matter(raw);
  const id = parsed.data.id;
  if (seen.has(id)) fail(`重複的課號 ${id}`);
  seen.add(id);
  if (expectedDates[id] !== asDate(parsed.data.date)) {
    fail(`${id} 日期應為 ${expectedDates[id]}，目前是 ${asDate(parsed.data.date)}`);
  }
  const minutes = Number(parsed.data.minutes);
  if (minutes < 30 || minutes > 60) fail(`${id} 的 minutes 應介於 30 到 60`);
  if (!Array.isArray(parsed.data.goals) || parsed.data.goals.length < 2) fail(`${id} 至少要兩個學習目標`);
  for (const heading of requiredHeadings) {
    if (!parsed.content.includes(`## ${heading}`)) fail(`${id} 缺少「${heading}」`);
  }
  if (!parsed.content.includes("```")) fail(`${id} 缺少程式案例`);
}

for (const id of Object.keys(expectedDates)) {
  if (!seen.has(id)) fail(`缺少講義 ${id}`);
}

const quizDir = path.join(root, "data", "quizzes");
const quizFiles = (await readdir(quizDir)).filter((file) => file.endsWith(".json")).sort();
if (quizFiles.length !== 4) fail(`測驗應有 4 份，目前 ${quizFiles.length} 份`);
for (const file of quizFiles) {
  const quiz = JSON.parse(await readFile(path.join(quizDir, file), "utf8"));
  const count = quiz.questions?.length ?? 0;
  if (count < 8 || count > 10) fail(`${file} 題數應為 8 到 10，目前 ${count}`);
  quiz.questions?.forEach((question, index) => {
    if (!Array.isArray(question.choices) || question.choices.length < 3) {
      fail(`${file} 第 ${index + 1} 題選項不足`);
    }
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.choices.length) {
      fail(`${file} 第 ${index + 1} 題答案索引不正確`);
    }
    if (!question.explain) fail(`${file} 第 ${index + 1} 題缺少解析`);
  });
}

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (["node_modules", "dist", ".git", ".wrangler", "package-lock.json", "check-content.mjs"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (/\.(md|json|js|mjs|pug|scss|html|css|sql|svg)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const files = await walk(root);
for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const word of banned) {
    if (text.includes(word)) fail(`${path.relative(root, file)} 含有禁用詞「${word}」`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`內容檢查通過：${seen.size} 課、${quizFiles.length} 份測驗。`);
