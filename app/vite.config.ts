import { defineConfig, type Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

// 개발용: VITE_MOCK=1이면 로그인 없이 ../data/tables/*.json을 /__tables/ 로 읽는다(배포 빌드에는 안 들어감)
function mockTables(): Plugin {
  const dir = path.resolve(__dirname, "../data/tables");
  return {
    name: "mock-tables",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/fashion-mall-story-note/__tables/", (req, res) => {
        const f = path.join(dir, path.basename(req.url ?? ""));
        if (!fs.existsSync(f)) { res.statusCode = 404; res.end(); return; }
        res.setHeader("Content-Type", "application/json");
        fs.createReadStream(f).pipe(res);
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: "/fashion-mall-story-note/",
  build: mode === "preview" ? { rollupOptions: { input: { main: path.resolve(__dirname, "index.html"), workbench: path.resolve(__dirname, "workbench.html") } } } : {},
  plugins: [mockTables()],
  define: { __BUILD__: JSON.stringify(Date.now().toString(36)) },
  server: { fs: { allow: [".."] } },
}));
