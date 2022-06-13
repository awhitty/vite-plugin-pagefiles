/// <reference types="./pagefiles" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import pagefiles from "vite-plugin-pagefiles";

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    pagefiles({
      onRoutesGenerated: (pages) => {
        console.log(pages.map((p) => p.meta.key));
      },
    }),
    Inspect(),
  ],
});
