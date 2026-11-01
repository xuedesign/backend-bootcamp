# 里程碑範例

這四個資料夾是課程裡可以分開執行的 Worker。它們不是闖關網站本身。闖關網站用根目錄的 `npm run dev`。

| 資料夾 | 對應課程 | 你會看到 |
| --- | --- | --- |
| `01-hello-routes` | 第 1 週第 5 課 | `/api/hello` 與 `/api/time` |
| `02-guestbook-memory` | 第 2 週第 5 課 | 記在記憶體的留言板 |
| `03-guestbook-d1` | 第 3 週第 5 課 | 用 D1 留下的留言 |
| `04-guestbook` | 第 4 週期末 | 登入、D1、KV、R2 備份 |

每個資料夾都要先 `npm install`，再 `npm run dev`。設定檔的 `compatibility_date` 是 `2026-10-30`。資料庫與 KV 的編號若仍是練習用的占位值，請只加 `--local`，佈署前換成你帳號裡的資源。
