import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.cjs',
        vite: {
          build: {
            rollupOptions: {
              input: {
                main: 'electron/main.cjs',
                stressWorker: 'electron/stressWorker.cjs',
              },
              output: {
                // CORREÇÃO: Força a extensão .cjs na saída
                entryFileNames: '[name].cjs',
                format: 'cjs',
              },
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.cjs'),
      },
      renderer: {},
    }),
  ],
})