# D1 留言板

`database_id` 目前是練習用的占位編號。本機可以先跑；佈署前請用 `npx wrangler d1 create guestbook-db` 換成你的資料庫。

```bash
npm install
npm run db:apply
npm run dev
```

`db:apply` 會執行 `wrangler d1 migrations apply guestbook-db --local`。
