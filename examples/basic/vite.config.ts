/// <reference types="./pagefiles" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import pagefiles from "vite-plugin-pagefiles";

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    pagefiles(),
  ],
});
