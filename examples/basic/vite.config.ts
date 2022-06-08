import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import pagefiles from 'vite-plugin-pagefiles';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pagefiles()]
})
