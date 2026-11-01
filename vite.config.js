import { defineConfig } from "vite";
import { courseSite } from "./scripts/vite-plugin-course.mjs";

export default defineConfig({
  plugins: [courseSite()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
