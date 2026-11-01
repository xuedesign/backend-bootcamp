# 期末留言板

同一支 Worker 提供頁面與 API。留言在 D1，登入手環在 KV，匯出的 JSON 在 R2。密碼只存 PBKDF2 雜湊。

## 本機

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:apply
npm run dev
```

`.dev.vars` 不要提交。`database_id`、KV `id`、R2 桶名目前是練習用的占位值，只適合 `--local` / `wrangler dev`。

打開終端機印出的網址後：

1. 註冊帳號（3 到 20 個英數或底線，密碼至少 8 個字）。
2. 留下留言。
3. 換另一個帳號，確認刪不掉別人的留言。
4. 登入狀態下按「匯出備份」。

## 佈署

1. `npx wrangler d1 create guestbook-db`，把真的 `database_id` 寫回 `wrangler.jsonc`。
2. `npx wrangler kv namespace create SESSIONS`，換上真的 `id`。
3. `npx wrangler r2 bucket create guestbook-backups`。
4. `npx wrangler d1 migrations apply guestbook-db --remote`。
5. `npx wrangler secret put PEPPER`（不要把值寫在指令後面）。
6. `npx wrangler deploy`。

`secret put` 與 `deploy` 都會更新線上版本。頁面與 API 同一個來源，HTTPS 時 cookie 會加上 `Secure`。
