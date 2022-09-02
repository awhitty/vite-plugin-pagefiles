import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import pagefiles from "vite-plugin-pagefiles";

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    pagefiles({
      pages: "src/routes/pages/**/*.page.tsx",
      moduleId: "virtual:pagefiles/pages",
    }),
    pagefiles({
      pages: "src/routes/sidebars/**/*.page.tsx",
      moduleId: "virtual:pagefiles/sidebars",
    }),
  ],
});
