# 後端闖關

給已經會 HTML、CSS、JavaScript，但還沒寫過後端的人。平日 20 課，從 2026-11-02 到 2026-11-27。每天大約 30 到 60 分鐘，最後做出可以佈署的留言板。

網站是靜態的。進度存在瀏覽器的 `localStorage`，沒有帳號，也沒有外部追蹤。第 1 週一開始就開著。每週測驗答對 80% 才打開下一週。四週都通過會得到結業徽章，並打開複習模式。

## 本機開發

需要 Node.js 22。

```bash
npm install
npm run dev
```

瀏覽器打開終端機印出的網址（預設 `http://localhost:5173`）。

```bash
npm test
npm run build
npm run preview
```

`npm test` 會檢查 20 課、4 份測驗，以及關卡解鎖的規則。`npm run build` 的靜態檔在 `dist/`。

## 改講義

| 你想改的 | 檔案 |
| --- | --- |
| 某一課的內文 | `data/lessons/w1-01.md` 這類 Markdown |
| 一週的標題 | `data/weeks.json` |
| 通關測驗 | `data/quizzes/week-1.json` |
| 版面 | `src/templates/*.pug` |
| 外觀 | `src/styles/main.scss` |
| 關卡規則 | `src/scripts/progress-core.js` |

存檔後，開發伺服器會重編頁面。請用台灣用語：專案、資料、佈署、環境、模組、程式、變數。

可執行的 Worker 里程碑在 `examples/`。那裡要各自 `npm install`，不會被這個網站的建置帶進去。

## Cloudflare Pages

這個倉庫用 GitHub 接到 Cloudflare Pages 即可。請用 **Build system v3**（預設就是 Node.js 22）。

| 設定 | 值 |
| --- | --- |
| 框架預設 | None |
| 建置指令 | `npm run build` |
| 建置輸出目錄 | `dist` |
| 正式分支 | `main` |
| Node.js | `22` |

Pages 會先自動安裝套件，再執行建置指令，因此 GitHub 上的完整流程是：

```bash
npm install && npm run build
```

產物在 `dist`。若你把安裝與建置寫在同一個建置指令欄位，請填 `npm install && npm run build`，並加上環境變數 `SKIP_DEPENDENCY_INSTALL=1`，避免裝兩次。一般情況維持建置指令 `npm run build` 即可。

Node.js 版本釘在倉庫根目錄：

- `.nvmrc` 與 `.node-version` 的內容都是 `22`。Pages 會讀這兩個檔（環境變數名稱是 `NODE_VERSION`）。
- `package.json` 的 `engines.node` 是 `22.x`，給本機的 npm 看。Pages v3 **不會**從 `engines` 判斷 Node 版本，所以不要只寫 `engines`。

建置工具放在 `dependencies`，避免 Pages 以 production 安裝時漏掉 Vite。

不需要環境變數才能建置這個靜態站。留言板範例的秘密不要放到這個 Pages 專案。

## 進度存在哪

鍵名是 `backend-bootcamp-progress-v1`。重設按鈕會清掉這台瀏覽器的完成勾選、測驗成績與複習模式。上鎖的講義不會先畫進畫面；通過測驗或開啟複習模式之後，瀏覽器才把講義從 `<template>` 放進來。這是學習用的關卡，不是權限系統。
