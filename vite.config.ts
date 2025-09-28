
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import dotenv from 'dotenv';
dotenv.config();

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: './',
  server: {
    host: "::",
    port: 8081, // Using port 8081
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onError: (err: any, _req: any, res: any) => {
          console.error('Proxy error:', err);
          res.writeHead(500, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ 
            success: false, 
            message: 'Proxy error: ' + err.message 
          }));
        }
      }
    }
  },
  plugins: [
    react(),


  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['twilio']
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['twilio']
    }
  }
}));


