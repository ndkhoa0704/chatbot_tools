import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for the current mode.
  const env = loadEnv(mode, process.cwd() + '/', '')
  // Provide a sensible default if the environment variable is missing. This prevents
  // `undefined` from being passed to the proxy which ultimately causes Node's URL
  // parser to attempt `protocol.split(':')`, leading to a runtime error.
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000'
  return {
    plugins: [vue()],
    build: {
      outDir: '../public',
      emptyOutDir: true
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true
        }
      },
    }
  };
}); 