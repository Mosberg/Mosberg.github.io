export function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_error) {
    return false;
  }
}

export function readSet(key) {
  const value = readJson(key, []);
  return new Set(Array.isArray(value) ? value : []);
}

export function writeSet(key, value) {
  return writeJson(key, Array.from(value));
}
