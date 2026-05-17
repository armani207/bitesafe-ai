import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL || "https://oomswpsscdfyfoxpwgbj.supabase.co";

  return {
  server: {
    host: "localhost",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/supabase-proxy/auth": {
        target: supabaseUrl,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/supabase-proxy/, ""),
      },
      "/supabase-proxy/rest": {
        target: supabaseUrl,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/supabase-proxy/, ""),
      },
      "/supabase-proxy/storage": {
        target: supabaseUrl,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/supabase-proxy/, ""),
      },
      "/supabase-proxy/functions": {
        target: supabaseUrl,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/supabase-proxy/, ""),
      },
      "/supabase-proxy/realtime": {
        target: supabaseUrl.replace("https://", "wss://"),
        changeOrigin: true,
        ws: true,
        rewrite: (p) => p.replace(/^\/supabase-proxy/, ""),
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "og-image.svg"],
      manifest: false, // we supply our own public/manifest.json
      workbox: {
        mode: "development", // workaround: workbox+terser race; main bundle still minified by esbuild
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode !== "production",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          "tanstack-query": ["@tanstack/react-query"],
          charts: ["recharts"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
};
});
