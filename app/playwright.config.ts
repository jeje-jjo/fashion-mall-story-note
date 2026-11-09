import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:4173/fashion-mall-story-note/",
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npx vite preview --outDir preview-dist --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/fashion-mall-story-note/",
    reuseExistingServer: false,
  },
});
