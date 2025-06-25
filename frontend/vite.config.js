import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for the current mode.
  const env = loadEnv(mode, process.cwd() + '/../', '')
  return {
    plugins: [vue()],
    build: {
      outDir: '../public',
      emptyOutDir: true
    },
    server: {
      proxy: {
        '/api': {
          target: 'https://chatbot.koanguyn.org',
          changeOrigin: true
        }
      },
    }
  };
}); 