import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

// 개발용: VITE_MOCK=1이면 로그인 없이 ../data/tables/*.json을 /__tables/ 로 읽는다(배포 빌드에는 안 들어감)
function mockTables(): Plugin {
  const dir = path.resolve(__dirname, "../data/tables");
  return {
    name: "mock-tables",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__tables/", (req, res) => {
        const f = path.join(dir, path.basename(req.url ?? ""));
        if (!fs.existsSync(f)) { res.statusCode = 404; res.end(); return; }
        res.setHeader("Content-Type", "application/json");
        fs.createReadStream(f).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: "/fashion-mall-story-note/",
  plugins: [react(), mockTables()],
});
