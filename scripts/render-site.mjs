import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { Marked } from "marked";
import pug from "pug";
import { createHighlighter } from "shiki";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const LANG_ALIAS = {
  js: "javascript",
  mjs: "javascript",
  javascript: "javascript",
  json: "json",
  jsonc: "jsonc",
  sql: "sql",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  html: "html",
  css: "css",
  scss: "scss",
  toml: "toml",
  http: "http",
  text: "plaintext",
  txt: "plaintext",
  plaintext: "plaintext",
};

const LANG_LABEL = {
  javascript: "JavaScript",
  json: "JSON",
  jsonc: "JSON",
  sql: "SQL",
  bash: "終端機",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  toml: "TOML",
  http: "HTTP",
  plaintext: "文字",
};

let highlighterPromise;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [
        "javascript",
        "json",
        "jsonc",
        "sql",
        "bash",
        "html",
        "css",
        "scss",
        "toml",
        "http",
        "plaintext",
      ],
    });
  }
  return highlighterPromise;
}

function parseFenceInfo(info) {
  const raw = (info || "").trim();
  if (!raw) return { lang: "plaintext", title: "" };
  const [langRaw, ...rest] = raw.split(/\s+/);
  const lang = LANG_ALIAS[langRaw.toLowerCase()] || "plaintext";
  const joined = rest.join(" ");
  const titled = joined.match(/title=(?:"([^"]+)"|'([^']+)'|(\S+))/);
  const title = titled ? (titled[1] || titled[2] || titled[3] || "") : joined;
  return { lang, title };
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function fenceToFigure(info, code) {
  const highlighter = await getHighlighter();
  const { lang, title } = parseFenceInfo(info);
  const loaded = highlighter.getLoadedLanguages();
  const useLang = loaded.includes(lang) ? lang : "plaintext";
  const highlighted = highlighter.codeToHtml(code.replace(/\n$/, ""), {
    lang: useLang,
    themes: { light: "github-light", dark: "github-dark" },
  });
  const label = LANG_LABEL[useLang] || useLang;
  const fileLabel = title
    ? `<span class="codeblock__file">${escapeHtml(title)}</span>`
    : `<span class="codeblock__file">範例</span>`;
  return `<figure class="codeblock codeblock--cursor">
  <figcaption class="codeblock__bar">
    ${fileLabel}
    <span class="codeblock__lang">${escapeHtml(label)}</span>
    <button type="button" class="codeblock__copy">複製</button>
  </figcaption>
  <div class="codeblock__body">${highlighted}</div>
</figure>`;
}

function slugify(text) {
  const plain = text.replace(/<[^>]+>/g, "").trim();
  const slug = plain
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "");
  return slug || "section";
}

async function renderMarkdown(source) {
  const blocks = [];
  const stripped = source.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, info, code) => {
    const token = `CODEBLOCKTOKEN${blocks.length}END`;
    blocks.push({ info, code });
    return `\n\n${token}\n\n`;
  });

  const toc = [];
  const used = new Map();
  const marked = new Marked();
  marked.use({
    gfm: true,
    renderer: {
      heading({ text, depth }) {
        const base = slugify(text);
        const count = used.get(base) || 0;
        used.set(base, count + 1);
        const id = count === 0 ? base : `${base}-${count + 1}`;
        if (depth === 2) toc.push({ id, text: text.replace(/<[^>]+>/g, "") });
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      link({ href, title, text }) {
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
        const external = /^https?:\/\//.test(href || "");
        const rel = external ? ` rel="noopener noreferrer" target="_blank"` : "";
        return `<a href="${escapeHtml(href || "")}"${titleAttr}${rel}>${text}</a>`;
      },
    },
  });

  let html = await marked.parse(stripped);
  for (let index = 0; index < blocks.length; index += 1) {
    const figure = await fenceToFigure(blocks[index].info, blocks[index].code);
    const token = `CODEBLOCKTOKEN${index}END`;
    html = html.replace(`<p>${token}</p>`, figure).replace(token, figure);
  }
  return { html, toc };
}

function compile(name) {
  return pug.compileFile(path.join(root, "src", "templates", name), {
    filename: path.join(root, "src", "templates", name),
  });
}

async function readLessons() {
  const dir = path.join(root, "data", "lessons");
  const files = (await readdir(dir)).filter((file) => file.endsWith(".md")).sort();
  const lessons = [];
  for (const file of files) {
    const raw = await readFile(path.join(dir, file), "utf8");
    const parsed = matter(raw);
    const data = parsed.data;
    lessons.push({
      id: data.id,
      week: Number(data.week),
      order: Number(data.order),
      title: data.title,
      date: asDateString(data.date),
      weekday: data.weekday,
      minutes: Number(data.minutes),
      summary: data.summary,
      goals: data.goals || [],
      exerciseMinutes: Number(data.exerciseMinutes || 20),
      body: parsed.content,
      file,
    });
  }
  lessons.sort((a, b) => a.week - b.week || a.order - b.order);
  return lessons;
}

async function readQuizzes() {
  const dir = path.join(root, "data", "quizzes");
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  const quizzes = [];
  for (const file of files) {
    const quiz = JSON.parse(await readFile(path.join(dir, file), "utf8"));
    quizzes.push(quiz);
  }
  return quizzes;
}

function asDateString(value) {
  if (value instanceof Date) {
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${value.getUTCFullYear()}-${month}-${day}`;
  }
  return String(value);
}

function pagerFor(lesson, renderedLessons) {
  const prevHref = lesson.prev ? `/lessons/${lesson.prev.id}.html` : "/";
  const prevLabel = lesson.prev ? lesson.prev.title : "回到地圖";
  if (lesson.id === "w4-05") {
    const bonus = renderedLessons.find((item) => item.id === "bonus-01");
    if (bonus) {
      return {
        prevHref,
        prevLabel,
        nextHref: `/lessons/${bonus.id}.html`,
        nextLabel: bonus.title,
      };
    }
  }
  if (lesson.id === "bonus-01") {
    return {
      prevHref,
      prevLabel,
      nextHref: "/quizzes/week-4.html",
      nextLabel: "第 4 週通關測驗",
    };
  }
  if (lesson.next && lesson.next.week === lesson.week) {
    return {
      prevHref,
      prevLabel,
      nextHref: `/lessons/${lesson.next.id}.html`,
      nextLabel: lesson.next.title,
    };
  }
  return {
    prevHref,
    prevLabel,
    nextHref: `/quizzes/week-${lesson.week}.html`,
    nextLabel: "前往通關測驗",
  };
}

function dateLabel(lesson) {
  const [, month, day] = lesson.date.split("-");
  return `${Number(month)}/${Number(day)}（${lesson.weekday}）`;
}

async function writeIfChanged(file, contents) {
  try {
    const current = await readFile(file, "utf8");
    if (current === contents) return;
  } catch {
    // 檔案還不存在就直接寫。
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, contents);
}

export async function renderSite() {
  const [lessons, quizzes, weeks] = await Promise.all([
    readLessons(),
    readQuizzes(),
    readFile(path.join(root, "data", "weeks.json"), "utf8").then(JSON.parse),
  ]);

  const renderedLessons = [];
  for (const lesson of lessons) {
    const { html, toc } = await renderMarkdown(lesson.body);
    renderedLessons.push({
      ...lesson,
      dateLabel: dateLabel(lesson),
      handoutHtml: html,
      toc,
    });
  }

  const byId = new Map(renderedLessons.map((lesson) => [lesson.id, lesson]));
  for (let index = 0; index < renderedLessons.length; index += 1) {
    renderedLessons[index].prev = renderedLessons[index - 1] || null;
    renderedLessons[index].next = renderedLessons[index + 1] || null;
  }

  const weekCards = weeks.map((week) => ({
    ...week,
    lessons: renderedLessons.filter((lesson) => lesson.week === week.id),
    quiz: quizzes.find((quiz) => quiz.week === week.id),
  }));

  const curriculum = renderedLessons.map((lesson) => ({
    id: lesson.id,
    week: lesson.week,
    title: lesson.title,
    href: `/lessons/${lesson.id}.html`,
  }));

  const shared = {
    lessonCount: renderedLessons.length,
    curriculumJson: JSON.stringify(curriculum).replaceAll("<", "\\u003c"),
  };

  const home = compile("home.pug")({
    ...shared,
    title: "後端闖關：一個月學會 Worker 與資料庫",
    weeks: weekCards.filter((week) => !week.bonus),
    bonusWeeks: weekCards.filter((week) => week.bonus),
  });
  await writeIfChanged(path.join(root, "index.html"), home);

  const lessonTemplate = compile("lesson.pug");
  const quizTemplate = compile("quiz.pug");
  const input = { index: path.join(root, "index.html") };

  for (const lesson of renderedLessons) {
    const week = weeks.find((item) => item.id === lesson.week);
    const pager = pagerFor(lesson, renderedLessons);
    const html = lessonTemplate({
      ...shared,
      title: `${lesson.title} · 後端闖關`,
      lesson,
      week,
      prevHref: pager.prevHref,
      prevLabel: pager.prevLabel,
      nextHref: pager.nextHref,
      nextLabel: pager.nextLabel,
    });
    const file = path.join(root, "lessons", `${lesson.id}.html`);
    await writeIfChanged(file, html);
    input[`lessons/${lesson.id}`] = file;
    byId.set(lesson.id, lesson);
  }

  for (const quiz of quizzes) {
    const week = weeks.find((item) => item.id === quiz.week);
    const html = quizTemplate({
      ...shared,
      title: `${quiz.title} · 後端闖關`,
      quiz,
      week,
      quizJson: JSON.stringify(quiz).replaceAll("<", "\\u003c"),
      nextWeek: quiz.week < 4 ? weeks.find((item) => item.id === quiz.week + 1) : null,
      bonusHref: quiz.week === 4 ? "/lessons/bonus-01.html" : null,
    });
    const file = path.join(root, "quizzes", `week-${quiz.week}.html`);
    await writeIfChanged(file, html);
    input[`quizzes/week-${quiz.week}`] = file;
  }

  return input;
}
