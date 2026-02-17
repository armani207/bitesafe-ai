import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL || "https://mbidjukamsjjmapcmgmr.supabase.co";

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
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
