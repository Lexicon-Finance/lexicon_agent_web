import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Load env file based on mode
  envDir: '.',
  // Optional: You can add other configuration here
}))
