import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "https://api-spotinize.sytes.net",
        changeOrigin: true,
        secure: false,
      },
      "/cache": {
        target: "https://api-spotinize.sytes.net",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "https://api-spotinize.sytes.net",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
