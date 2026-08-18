import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const isServe = mode === 'development'
  const isProduction = mode === 'production'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Build / production optimization settings
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Vite uses its bundled esbuild minifier by default; strip
      // console/debugger statements in production builds.
      esbuild: {
        drop: isProduction ? ['console', 'debugger'] : [],
      },
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Content-hashed filenames for long-term caching.
          // (Route-level lazy loading already provides code splitting.)
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    // In production, bake the build target into the bundle
    define: {
      __APP_ENV__: isProduction ? '"production"' : '"development"',
    },
  }
})