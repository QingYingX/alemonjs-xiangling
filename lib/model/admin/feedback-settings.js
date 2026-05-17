import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { getXianglingConfig } from '../../config/xiangling.js';

const key = () => createStoreKey('admin', 'feedback-settings.json');
const getDefaultSettings = () => {
    const config = getXianglingConfig().feedback;
    return {
        enabled: config.enabled,
        groups: [...config.groups]
    };
};
const normalize = (value = {}, fallback = getDefaultSettings()) => ({
    enabled: value.enabled ?? fallback.enabled,
    groups: Array.isArray(value.groups) ? value.groups.map(String).filter(Boolean) : fallback.groups
});
const getFeedbackSettings = async () => {
    const raw = await getRedis().get(key());
    if (!raw)
        return getDefaultSettings();
    try {
        return normalize(JSON.parse(raw));
    }
    catch {
        return getDefaultSettings();
    }
};
const setFeedbackSettings = async (value) => {
    const settings = normalize(value, await getFeedbackSettings());
    await getRedis().set(key(), JSON.stringify(settings));
    return settings;
};

export { getFeedbackSettings, setFeedbackSettings };
