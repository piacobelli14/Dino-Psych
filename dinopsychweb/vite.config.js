import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  rollupOptions: {
    // Make sure to add 'jspdf' to the list of external modules
    external: ['jspdf']
  }
})
