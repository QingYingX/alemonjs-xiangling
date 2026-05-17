import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getIoRedis } from '@alemonjs/db';

export const APP_KEY_PREFIX = 'data:alemonjs-xiangling';

export const createStoreKey = (...parts: string[]): string => {
  return [APP_KEY_PREFIX, ...parts.map(part => part.replace(/^:+|:+$/g, ''))].join(':');
};

export const getRedis = () => getIoRedis();

export const getDataPath = (...parts: string[]): string => {
  return join(process.cwd(), '.data', 'alemonjs-xiangling', ...parts);
};

export const ensureDataPath = async (...parts: string[]): Promise<string> => {
  const dir = getDataPath(...parts);
  await mkdir(dir, { recursive: true });
  return dir;
};
