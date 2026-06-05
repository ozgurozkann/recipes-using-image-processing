import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth":            { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/ingredients":     { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/recipes":         { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/recommendations": { target: "http://127.0.0.1:8000", changeOrigin: true, timeout: 300000, proxyTimeout: 300000 },
      "/admin":           { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/users":           { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/uploads":         { target: "http://127.0.0.1:8000", changeOrigin: true },
    }
  }
});

