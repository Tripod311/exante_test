import { resolve } from "path"
import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  root: "src",
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    outDir: '../../client',
    emptyOutDir: true,
    minify: false,
    sourceMap: true
  }
})