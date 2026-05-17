import { createStoreKey, getRedis } from '../../adapter/storage';
import { getXianglingConfig } from '../../config/xiangling';

export type FeedbackSettings = {
  enabled: boolean;
  groups: string[];
};

const key = (): string => createStoreKey('admin', 'feedback-settings.json');

const getDefaultSettings = (): FeedbackSettings => {
  const config = getXianglingConfig().feedback;
  return {
    enabled: config.enabled,
    groups: [...config.groups]
  };
};

const normalize = (value: Partial<FeedbackSettings> = {}, fallback = getDefaultSettings()): FeedbackSettings => ({
  enabled: value.enabled ?? fallback.enabled,
  groups: Array.isArray(value.groups) ? value.groups.map(String).filter(Boolean) : fallback.groups
});

export const getFeedbackSettings = async (): Promise<FeedbackSettings> => {
  const raw = await getRedis().get(key());
  if (!raw) return getDefaultSettings();
  try {
    return normalize(JSON.parse(raw) as Partial<FeedbackSettings>);
  } catch {
    return getDefaultSettings();
  }
};

export const setFeedbackSettings = async (value: Partial<FeedbackSettings>): Promise<FeedbackSettings> => {
  const settings = normalize(value, await getFeedbackSettings());
  await getRedis().set(key(), JSON.stringify(settings));
  return settings;
};
