import { start } from 'alemonjs';
import { createServer } from 'jsxp';

if (process.argv.includes('--jsxp')) {
  void createServer();
} else {
  start('src/index.ts');
}
