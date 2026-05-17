import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getIoRedis } from '@alemonjs/db';

const APP_KEY_PREFIX = 'data:alemonjs-xiangling';
const createStoreKey = (...parts) => {
    return [APP_KEY_PREFIX, ...parts.map(part => part.replace(/^:+|:+$/g, ''))].join(':');
};
const getRedis = () => getIoRedis();
const getDataPath = (...parts) => {
    return join(process.cwd(), '.data', 'alemonjs-xiangling', ...parts);
};
const ensureDataPath = async (...parts) => {
    const dir = getDataPath(...parts);
    await mkdir(dir, { recursive: true });
    return dir;
};

export { APP_KEY_PREFIX, createStoreKey, ensureDataPath, getDataPath, getRedis };
