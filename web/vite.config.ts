import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

const apiProxyTarget = process.env.VITE_API_BASE_URL ?? "https://test.api.nosko.app"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The nosko_at/nosko_rt session cookies are SameSite=Strict (deliberate — no separate CSRF
    // token scheme), so the browser won't send them cross-site from localhost to the deployed
    // API. Proxying makes the browser see same-origin requests instead; apiClient.ts/httpApi.ts
    // call relative "/api/..." paths in dev so they actually hit this proxy.
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
