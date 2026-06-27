export function readJson(key, fallback, storage = window.localStorage) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function safeSetItem(key, value, {
  storage = window.localStorage,
  onError = () => {},
} = {}) {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`本地存储写入失败：${key}`, error);
    onError(error, key);
    return false;
  }
}
