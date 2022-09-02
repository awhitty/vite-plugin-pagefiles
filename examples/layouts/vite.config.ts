import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import pagefiles from "vite-plugin-pagefiles";

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    pagefiles({
      pages: "src/pages/**/*.page.tsx",
      layouts: "src/pages/**/*.layout.tsx",
      moduleId: "virtual:pagefiles/pages"
    }),
  ],
});
