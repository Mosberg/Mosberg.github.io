export const APP_CONFIG = {
  storageKey: "mosberg--settings",
  favoritesKey: "mosberg--favorites",
  version: "2.0.0",
  themes: [
    "auto",
    "light",
    "dark",
    "retro",
    "cosmic",
    "sunset",
    "earth",
    "ocean",
    "solarized",
  ],
  defaultSettings: {
    theme: "auto",
    accentHue: 42,
    layout: "grid",
    sortBy: "rank",
    motion: "on",
    favoritesOnly: false,
    category: "all",
    query: "",
  },
};

export const COMMANDS = [
  { id: "focus-search", label: "Focus Search", keywords: ["search", "find", "query"] },
  { id: "toggle-layout", label: "Toggle Grid/List Layout", keywords: ["layout", "grid", "list"] },
  { id: "toggle-favorites", label: "Toggle Favorites-Only", keywords: ["favorites", "bookmarks"] },
  { id: "spotlight", label: "Spotlight Random Project", keywords: ["random", "spotlight", "surprise"] },
  { id: "open-settings", label: "Open Settings", keywords: ["settings", "panel", "config"] },
  { id: "theme-auto", label: "Theme: Auto", keywords: ["theme", "auto"] },
  { id: "theme-dark", label: "Theme: Dark", keywords: ["theme", "dark"] },
  { id: "theme-light", label: "Theme: Light", keywords: ["theme", "light"] },
];
