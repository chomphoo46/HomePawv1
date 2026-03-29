import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom', // จำลอง Browser environment สำหรับ Next.js APIs
    globals: true,        // ทำให้ใช้คำสั่ง expect, it, describe ได้โดยไม่ต้อง import
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'), // แปลง @ ให้ชี้มาที่ root
    },
  },
})