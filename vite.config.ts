import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import autoprefixer from 'autoprefixer'

export default defineConfig(({ mode }) => {
  // Charge les variables d'env pour ce mode (.env, .env.development, .env.production...)
  const env = loadEnv(mode, process.cwd(), '')

  // En dev  : base = VITE_ROUTER_BASENAME (/services/) pour que Vite et React Router
  //           soient alignés → http://localhost:3000/services/login fonctionne.
  // En prod : base = /app-cap-frontend/ (chemin réel des assets sur le serveur).
  const base = mode === 'development'
    ? (env.VITE_ROUTER_BASENAME || '/services/')
    : '/app-cap-frontend/'

  return {
    base,
    define: {
      __APP_BASE__: '"/"'
    },
    build: {
      outDir: 'build',
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer({}), 
        ],
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/views': path.resolve(__dirname, './src/views'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/config': path.resolve(__dirname, './src/config'),
        '@/contexts': path.resolve(__dirname, './src/contexts'),
        '@/store': path.resolve(__dirname, './src/store'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    },
    server: {
      port: 3000,
      proxy: {
        // https://vitejs.dev/config/server-options.html
      },
    },
  }
})
