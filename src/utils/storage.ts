export const safeGetItem = (key: string, storage: Storage = localStorage): string | null => {
  try {
    return storage.getItem(key);
  } catch (e) {
    return null;
  }
};

export const safeSetItem = (key: string, value: string, storage: Storage = localStorage): void => {
  try {
    storage.setItem(key, value);
  } catch (e) {
    // ignore
  }
};
