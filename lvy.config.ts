import { defineConfig } from 'lvyjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  watch: ['src/**/*.{ts,tsx,js,jsx,json,html}'],
  alias: {
    entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
  },
  assets: {
    filter: /\.(png|jpg|jpeg|gif|svg|webp|ico|yaml|txt|ttf|md)$/
  },
  build: {
    typescript: {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      outDir: 'lib',
      removeComments: true,
      declaration: true
    }
  }
});
