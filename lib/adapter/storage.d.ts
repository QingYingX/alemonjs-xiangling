export declare const APP_KEY_PREFIX = "data:alemonjs-xiangling";
export declare const createStoreKey: (...parts: string[]) => string;
export declare const getRedis: () => import("ioredis").default;
export declare const getDataPath: (...parts: string[]) => string;
export declare const ensureDataPath: (...parts: string[]) => Promise<string>;
