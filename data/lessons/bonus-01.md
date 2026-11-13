---
id: bonus-01
week: 5
order: 1
title: Headless CMS 入門
date: "2026-11-30"
weekday: 一
minutes: 50
exerciseMinutes: 30
summary: 客戶要自己改最新消息時，用 Headless CMS 餵給靜態網站，並分清唯讀 token 與管理 token。
goals:
  - 說出 Headless CMS、傳統 CMS、自己寫的 Worker API 各自適合什麼
  - 用 fetch 把一份內容清單渲染到頁面上
  - 分辨建置時抓資料與瀏覽器抓資料，並知道發布後如何觸發 Pages 重新佈署
---

主線四週你做出了留言板：規則在 Worker，資料在 D1，頁面用 `fetch` 跟自己的 API 說話。接案時還有另一種常見需求。企業官網、活動網站的「最新消息」幾乎沒有權限規則，客戶只是想自己改標題與日期，又不想請你每次打開 Pug。

這一課談 **Headless CMS**。它是給內容用的後台。網站仍然是你熟悉的 Pug、Scss、Vite，佈署在 Cloudflare Pages。

## 用生活例子理解

沿用第 1 週的餐廳。

- **傳統 CMS**（例如 WordPress）把餐廳整棟交給你：菜單版面、外掛、資料庫、後台都在同一套裡。客戶會改字，但版面也容易被主題牽著走。
- **Headless CMS** 只開廚房的出菜口。後台負責內容，端出來的是 JSON。用餐區（你的靜態頁）要自己擺盤。Headless 的字面意思是「沒有頭」：它不負責網站長什麼樣子。
- **自己寫的 API**（本課程的 Worker 加 D1）是你自建的廚房。留言要認得是誰、能不能刪，這種規則適合放在這裡。

> 生活比喻：最新消息像每日特餐看板。你不需要為了換一行字，就再開一間會記帳、會發手環的廚房。看板後面有人換紙就好。留言板才需要手環。

可以放在一起：官網文案走 CMS，留言或報名走 Worker。不要因為 CMS 也有 API，就把密碼與權限塞進 CMS。

什麼時候用哪一種：

| 情況 | 比較合適的做法 |
| --- | --- |
| 關於我們一年改兩次 | 直接改 Pug，不必加系統 |
| 客戶每週改最新消息、作品、活動日期 | Headless CMS，或 Decap 這種寫回 Git 的後台 |
| 要登入、要檢查是不是本人、要和 D1 的表對起來 | Worker 加 D1 |

## 接案時可以怎麼比

下面五套都有人拿來做設計工作室的官網。每套都用同一四個面向來看：要不要自架、費用怎麼看、客戶好不好上手、能不能配 Cloudflare Pages 上的靜態網站。金額與額度常常改，**這裡不寫價格數字**。要報價時打開官方方案頁，看當天的寫法。

### Strapi

文件：[REST API](https://docs.strapi.io/cms/api/rest)。可以自架，官方也有 Strapi Cloud。自架要自己負擔伺服器；代管價格看官網。客戶登入後台填表。內容型別預設是私有的，要開放讀取才叫得到。網站可以是靜態的，Strapi 本身要一台一直開著的服務。

### Directus

文件：[自架說明](https://directus.com/docs/self-hosting/overview)。可以自架（官方用 Docker），也有 Directus Cloud。授權是 MSCL：核心額度不必另付授權費，較高額度才要，主機費用另計，數字看授權頁。客戶也是填表。沒登入的請求走 Public 角色，預設沒有權限。網站可靜態，Directus 要自己的伺服器。

### Sanity

文件：[Query API](https://www.sanity.io/docs/http-reference/query)。內容放在官方的 Content Lake。編輯用的 Studio 可放在 `*.sanity.studio`，也可自己佈署。有可以開始用的免費方案，用量與價格以官網為準。欄位由你用程式定義，客戶填那些欄位。瀏覽器讀取要在專案裡允許來源；建置時抓則沒有這道限制。

### Contentful

文件：[Content Delivery API](https://www.contentful.com/developers/docs/references/content-delivery-api/)。內容由官方代管，不放在你的機器。文件寫可從免費帳號開始，額度與付費方案以官網為準。客戶在網頁後台填欄位。讀取 API 允許瀏覽器直接讀，適合靜態網站。

### Decap CMS

文件：[簡介](https://decapcms.org/docs/intro/)。不另外架內容伺服器。編輯器是網站裡的一頁，存檔就是 Git 提交。軟體本身開源；Git 平台的限制看你用的那一家。表單直白，但客戶要登入 Git，審核流程會開一張請你合併的更新。這套最貼近你現在的 Pug 與 Pages：推上 `main` 就重建。

Strapi 5 的清單是 `GET /api/news-items?sort=publishedAt:desc`，欄位在 `data` 的第一層（`item.title`）。舊教學若寫 `item.attributes.title`，那是第 4 版。

Directus 的清單是 `GET /items/news?fields=title,summary,published_at&sort=-published_at`，結果在 `data`。

Decap 沒有另一支給網頁 `fetch` 的內容 API。內容就是專案裡的檔案，建置時直接讀檔。Pages 已經用 Git 整合時，客戶一發布，網站就會重建，不必再接 webhook。

## 動手做

大約 30 分鐘。不必先註冊 CMS。我們借 Contentful 文件裡的公開範例空間，把「請求、檢查狀態、畫上頁面」走完。那個空間裝的是示範條目，不是新聞；欄位對應的動作，和你以後接「最新消息」是同一件事。

1. 新建一個資料夾，放入下一節的 `index.html` 與 `news.js`。
2. 在該資料夾執行 `npx serve`，用終端機印出的 `http://` 網址打開。不要用 `file://`，否則 `fetch` 常常直接失敗。
3. 畫面上應出現清單。DevTools 的 Network 裡，那筆請求是 `GET`，狀態 `200`，主機是 `cdn.contentful.com`。
4. 打開 `news.js` 的 `toItem`，把 `summary` 改成讀 `entry.fields.color`，存檔並重新整理。清單第二行應出現顏色。這就是日後改讀 `title`、`summary` 的同一個動作。
5. 在筆記寫下兩行：若內容型別叫 `news`，`content_type` 改成什麼；若要依發布時間由新到舊，`order` 改成什麼。答案在案例的註解裡。
6. 看完 `news.js`，確認檔案裡只有文件公開的唯讀 token。沒有任何能新增或修改內容的 token。

## 案例

網頁只有一個標題、一句狀態、一個空的區塊。腳本用模組載入，所以可以寫頂層的 `await`。

```html title=index.html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>最新消息</title>
  </head>
  <body>
    <h1>最新消息</h1>
    <p id="status">正在讀取…</p>
    <div id="news"></div>
    <script type="module" src="./news.js"></script>
  </body>
</html>
```

`loadNews` 組出 Content Delivery API 的網址。文件規定清單路徑是：

`GET https://cdn.contentful.com/spaces/{空間}/environments/{環境}/entries`

token 放在 `Authorization` 標頭。文件也允許把它放在網址的 `access_token`，但網址容易進到紀錄，所以這裡用標頭。這組 `cfexampleapi` 與 token 寫在 [Contentful 的認證文件](https://www.contentful.com/developers/docs/references/authentication/)，只能讀那個公開空間。

換成你自己的最新消息時，改三處：空間編號、`content_type` 改成 `news`、`order` 改成 `-fields.publishedAt`。減號表示由新到舊，這是這個 API 的排序寫法。`toItem` 改讀 `entry.fields.title`、`entry.fields.summary`、`entry.fields.publishedAt`。

```js title=news.js
const endpoint = new URL(
  "https://cdn.contentful.com/spaces/cfexampleapi/environments/master/entries",
);
endpoint.searchParams.set("content_type", "cat");
endpoint.searchParams.set("order", "-sys.updatedAt");
endpoint.searchParams.set("limit", "10");

async function loadNews() {
  const response = await fetch(endpoint, {
    headers: {
      Authorization: "Bearer b4c0n73n7fu1",
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`讀取內容失敗：${response.status}`);
  }
  const payload = await response.json();
  const entries = Array.isArray(payload.items) ? payload.items : [];
  return entries.map(toItem);
}

function toItem(entry) {
  // 範例空間的欄位是 name、color。最新消息改成 title、summary、publishedAt。
  return {
    id: entry.sys.id,
    title: entry.fields.name,
    summary: "",
    publishedAt: entry.sys.updatedAt,
  };
}

function renderNews(items, container) {
  container.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "目前沒有最新消息。";
    container.append(empty);
    return;
  }

  const list = document.createElement("ul");
  items.forEach((item) => {
    const row = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = item.title;
    const time = document.createElement("time");
    time.dateTime = item.publishedAt;
    time.textContent = item.publishedAt.slice(0, 10);
    row.append(title, document.createTextNode(" "), time);
    if (item.summary) {
      const summary = document.createElement("p");
      summary.textContent = item.summary;
      row.append(summary);
    }
    list.append(row);
  });
  container.append(list);
}

const status = document.querySelector("#status");
const news = document.querySelector("#news");

try {
  const items = await loadNews();
  status.textContent = `共 ${items.length} 則`;
  renderNews(items, news);
} catch (error) {
  status.textContent = "讀取失敗。打開 Network 看狀態碼。";
  console.error(error);
}
```

標題用 `textContent`，不要用 `innerHTML`。內容來自別的系統，標題裡就算有 `<`，也只該是文字。

Sanity 用另一種查詢，叫 GROQ。下面這段在 Node 裡可執行，讀的是文件範例裡的公開電影資料，不是新聞。網址形狀來自 [Query API](https://www.sanity.io/docs/http-reference/query)：`https://{projectId}.apicdn.sanity.io/v{版本}/data/query/{dataset}`。版本用文件列出的 `v2025-02-19`。從這個版本起，沒另外指定時，查的是已發布內容，草稿不會混進來。CDN 網址也只接受已發布與 raw 這兩種視角。

換成最新消息時，把 `projectId` 改成你的，查詢改成 `*[_type == "news"] | order(publishedAt desc)[0...10]{ title, summary, publishedAt }`。結果在 JSON 的 `result`，不是 `items`。

```js title=在 Node 讀 Sanity
const endpoint = new URL(
  "https://zp7mbokg.apicdn.sanity.io/v2025-02-19/data/query/production",
);
endpoint.searchParams.set(
  "query",
  `*[_type == "movie"] | order(releaseDate desc)[0...3]{ title, releaseDate }`,
);

const response = await fetch(endpoint);
if (!response.ok) throw new Error(`讀取失敗：${response.status}`);
const payload = await response.json();
const movies = payload.result;
console.log(movies);
```

這組公開專案允許瀏覽器從 `http://localhost:3000` 讀，不允許這個闖關網站用的 `5173`。自己的 Sanity 專案要在 CORS 來源加入網站網址，否則瀏覽器會收到 `403`，訊息是來源不被允許。Node 建置時不送網頁來源，沒有這道限制。這是第 2 週 CORS 的同一條規則。

## 兩種更新節奏

**瀏覽器抓（runtime）。** 訪客每次打開頁面，瀏覽器才 `fetch`。客戶剛按發布，重新整理就看得到。代價是：畫面會先空一下、CMS 暫停時清單也暫停、token 出現在前端檔案裡、而且要過 CORS。

**建置時抓（build time）。** `npm run build` 時由 Node 去要資料，把 HTML 或 JSON 寫進產物。訪客打開的是靜態檔，不必等 CMS，也沒有 CORS。這個闖關網站就是這樣編成的。代價是：內容更新不會自動出現，要再佈署一次。

官網的最新消息一天改幾次、希望網址打開就是完整 HTML，偏建置時。活動進行中要立刻換一則公告、可以接受「讀取中」，偏瀏覽器。

建置時要在內容發布後自動重建，用 Cloudflare Pages 的 **Deploy Hook**（佈署掛勾）。官方文件：[Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/)。

1. 在 Pages 專案的 Settings、Builds 裡新增 deploy hook，分支選 `main`。
2. 畫面上會給一組網址，以及一段 `POST` 範例。
3. 把該網址貼到 CMS 的 webhook，並盡量只在「發布」時送出。Contentful 與 Sanity 的接法，同一份 Cloudflare 文件有寫。
4. CMS 對那個網址送出 `POST`。Pages 重新執行 `npm run build`。
5. 建置腳本再向 CMS 要一次內容，靜態頁就更新。

webhook 是「事情發生了，由系統主動打一筆請求」，不是人去按佈署。Decap 若已經把內容提交進 Git，Pages 的 Git 整合會自己建置，通常不必再掛這支 hook。

Deploy Hook 的網址沒有另外的密碼。知道網址的人就能觸發建置。把它當成秘密：不要寫進 Git，不要放進前端。外流了就刪掉、重建一組，舊網址會失效。

## 安全提醒

token 是一把鑰匙，不是「接 API 用的裝飾」。

- **唯讀 token** 只能讀已發布、你允許它看的內容。Contentful 的 Content Delivery API 就是唯讀。Sanity 的公開 dataset，已發布內容可以不帶 token；私人 dataset 才需要一把只能讀的 token。
- **管理 token** 可以新增、修改、刪除。Contentful 的 Content Management API 用的個人 token，權限跟那位使用者一樣大。Sanity 的文件寫明：不要把 access token 放進瀏覽器裡的 JavaScript；若那把鑰匙還能寫入，等於誰都能改你的內容。
- 唯讀 token 放進 `news.js`，仍然等於公開。任何人都能用它讀取這把鑰匙看得到的東西。所以它只能對準本來就想公開的最新消息。
- 有寫入權限的 token 不能出現在 Pug、前端腳本，也不能放進 Vite 會打包的環境變數。以 `VITE_` 開頭的變數會進到瀏覽器。建置用的秘密放在 Pages 的環境變數，給 Node 腳本讀，不要加 `VITE_`。
- Strapi 與 Directus 預設不對路人開放。若你打開 Public 的讀取，那份清單就和唯讀 token 一樣，是公開的。

## 常見錯誤

- 把管理 token 貼進 `news.js`，推上 Git。要立刻作廢那把鑰匙，再發一把新的。
- 用 Delivery API 的形狀去呼叫 Management API，或反過來。兩支 API 的網址與權限都不同。
- 瀏覽器 `fetch` 收到 `403`，卻去改查詢語法。先看是不是 CORS 來源沒加入。
- 建置時抓了資料，卻沒接 webhook，以為客戶按發布，Pages 上的頁面會自己變。
- 把 Deploy Hook 網址提交進專案。那組網址本身就是權限。
- 抄到 Strapi 第 4 版的 `attributes`，在第 5 版讀到 `undefined`。
- 用 `innerHTML` 貼上 CMS 的標題。標題是資料，不是網頁。

## 重點回顧

- Headless CMS 管內容，不管版面。版面仍是你的 Pug 與 Scss。
- 最新消息適合 CMS。要登入與權限的功能，繼續用 Worker 與 D1。
- 自架的 Strapi、Directus 要一台服務；Sanity、Contentful 的內容在官方那邊；Decap 把內容寫回 Git。
- 瀏覽器抓得到最新，但要處理 CORS，而且只能放唯讀鑰匙。建置時抓得到靜態頁，更新要靠 Deploy Hook 或 Git 提交。
- 能寫入的 token，以及 Deploy Hook 網址，都不進前端、不進 Git。

## 自我檢查

不用交卷，用自己的話回答就好。

1. 客戶每週要改三則最新消息。為什麼不一定要再寫一支帶 D1 的 Worker？
2. 建置時抓資料，訪客會少遇到哪一個第 2 週的問題？內容更新後又要多哪一步？
3. `news.js` 裡可以出現哪一種 token？哪一種絕對不行？
4. Decap 把 Markdown 提交進 `main` 之後，為什麼常常不必再 `fetch` 一次？
5. 你練習時把 `summary` 改成讀 `color`。若內容型別改叫 `news`，`order` 那一行你打算寫什麼？
