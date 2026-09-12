import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub Pages path: https://<user>.github.io/BiblioZuri/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Dev server serves from the root; the Pages build lives under /BiblioZuri/.
  base: mode === 'development' ? '/' : '/BiblioZuri/',
}))
