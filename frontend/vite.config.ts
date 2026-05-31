import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://127.0.0.1:8000",
      "/ingredients": "http://127.0.0.1:8000",
      "/recipes": "http://127.0.0.1:8000",
      "/recommendations": "http://127.0.0.1:8000",
      "/admin": "http://127.0.0.1:8000",
      "/users": "http://127.0.0.1:8000",
      "/uploads": "http://127.0.0.1:8000"
    }
  }
});

