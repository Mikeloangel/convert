import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const repoName = 'convert';

// https://vite.dev/config/
export default defineConfig({
  base: `/${repoName}/`,
  plugins: [react()],
})

