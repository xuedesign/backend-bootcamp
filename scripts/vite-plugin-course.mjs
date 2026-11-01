import path from "node:path";
import { renderSite } from "./render-site.mjs";

const root = process.cwd();

function isSourceContent(file) {
  const relative = path.relative(root, file);
  return relative.startsWith(`data${path.sep}`)
    || relative.startsWith(`src${path.sep}templates${path.sep}`);
}

/** 開發與建置前，把 Pug 與 Markdown 編成 Vite 能吃的 HTML。 */
export function courseSite() {
  return {
    name: "course-site",
    async config() {
      const input = await renderSite();
      return {
        build: {
          rollupOptions: { input },
        },
      };
    },
    configureServer(server) {
      const reload = async (file) => {
        if (!isSourceContent(file)) return;
        await renderSite();
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.add([
        path.join(root, "data"),
        path.join(root, "src", "templates"),
      ]);
      server.watcher.on("change", reload);
      server.watcher.on("add", reload);
    },
  };
}
