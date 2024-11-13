import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 1600, // 청크 사이즈 경고 제한 증가
  },
  preview: {
    host: true, // 또는 '0.0.0.0'
    port: 3000, // 3000 포트로 변경
    strictPort: true,
  }
})
