const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

module.exports = defineConfig({
  plugins: [react()],
  root: "client",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/flowledger.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: asset => asset.name && asset.name.endsWith(".css") ? "assets/flowledger.css" : "assets/[name][extname]"
      }
    }
  },
  server: {
    proxy: { "/api": "http://localhost:3000" }
  }
});
