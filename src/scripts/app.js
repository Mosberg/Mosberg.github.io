import { APP_CONFIG, COMMANDS } from "https://mosberg.github.io/src/scripts/config.js";
import { readJson, readSet, writeJson, writeSet } from "https://mosberg.github.io/src/scripts/storage.js";
import { createThemeEngine } from "https://mosberg.github.io/src/scripts/theme-engine.js";
import { createProjectEngine } from "https://mosberg.github.io/src/scripts/project-engine.js";
import { createCommandPalette } from "https://mosberg.github.io/src/scripts/command-palette.js";

(() => {
  const root = document.documentElement;

  const elements = {
    themeSelect: document.getElementById("themeSelect"),
    accentSlider: document.getElementById("accentSlider"),
    motionToggle: document.getElementById("motionToggle"),
    layoutToggle: document.getElementById("layoutToggle"),
    sortSelect: document.getElementById("sortSelect"),
    searchInput: document.getElementById("searchInput"),
    favoritesOnly: document.getElementById("favoritesOnly"),
    categoryFilters: Array.from(document.querySelectorAll(".filter-chip")),
    randomButton: document.getElementById("spotlightBtn"),
    settingsPanel: document.getElementById("settingsPanel"),
    settingsToggle: document.getElementById("settingsToggle"),
    settingsClose: document.getElementById("settingsClose"),
    projectGrid: document.getElementById("projectGrid"),
    cards: Array.from(document.querySelectorAll(".project-card")),
    totalCount: document.getElementById("totalCount"),
    visibleCount: document.getElementById("visibleCount"),
    favoriteCount: document.getElementById("favoriteCount"),
    commandOpen: document.getElementById("commandOpen"),
    commandDialog: document.getElementById("commandPalette"),
    commandClose: document.getElementById("commandClose"),
    commandInput: document.getElementById("commandInput"),
    commandList: document.getElementById("commandList"),
    currentYear: document.getElementById("currentYear"),
    visitCounter: document.getElementById("visitCounter"),
  };

  if (!elements.projectGrid || !elements.cards.length) {
    return;
  }

  const storedSettings = readJson(APP_CONFIG.storageKey, APP_CONFIG.defaultSettings);
  const settings = {
    ...APP_CONFIG.defaultSettings,
    ...storedSettings,
  };

  const favorites = readSet(APP_CONFIG.favoritesKey);

  function persistSettings() {
    writeJson(APP_CONFIG.storageKey, settings);
  }

  const themeEngine = createThemeEngine({
    root,
    themeSelect: elements.themeSelect,
    accentSlider: elements.accentSlider,
    motionToggle: elements.motionToggle,
    onChange: (patch) => {
      Object.assign(settings, patch);
      applyUi();
      persistSettings();
    },
  });

  const projectEngine = createProjectEngine({
    gridEl: elements.projectGrid,
    cards: elements.cards,
    favorites,
    onStats: (stats) => {
      if (elements.totalCount) elements.totalCount.textContent = String(stats.total);
      if (elements.visibleCount) elements.visibleCount.textContent = String(stats.visible);
      if (elements.favoriteCount) elements.favoriteCount.textContent = String(stats.favorites);
    },
  });

  const palette = createCommandPalette({
    openButton: elements.commandOpen,
    dialog: elements.commandDialog,
    closeButton: elements.commandClose,
    input: elements.commandInput,
    list: elements.commandList,
    commands: COMMANDS,
    onRun: (id) => runCommand(id),
  });

  function runCommand(id) {
    if (id === "focus-search") {
      elements.searchInput?.focus();
      return;
    }

    if (id === "toggle-layout") {
      settings.layout = settings.layout === "grid" ? "list" : "grid";
      applyUi();
      persistSettings();
      return;
    }

    if (id === "toggle-favorites") {
      settings.favoritesOnly = !settings.favoritesOnly;
      applyUi();
      persistSettings();
      return;
    }

    if (id === "spotlight") {
      projectEngine.spotlightVisible();
      return;
    }

    if (id === "open-settings") {
      openSettings();
      return;
    }

    if (id === "theme-auto" || id === "theme-dark" || id === "theme-light") {
      settings.theme = id.replace("theme-", "");
      applyUi();
      persistSettings();
    }
  }

  function updateVisitCounter() {
    const key = "mosberg--visit-count";
    const count = Number(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(count));

    if (elements.visitCounter) {
      elements.visitCounter.textContent = `${count.toLocaleString()} visits`;
    }
  }

  function applyUi() {
    themeEngine.applyTheme(settings.theme);
    themeEngine.applyAccentHue(Number(settings.accentHue));
    themeEngine.applyMotion(settings.motion);

    projectEngine.applyView(settings.layout);
    projectEngine.applyFilters(settings);
    projectEngine.syncFavoriteUi();

    if (elements.layoutToggle) {
      elements.layoutToggle.textContent = settings.layout === "grid" ? "List View" : "Grid View";
    }

    if (elements.sortSelect) {
      elements.sortSelect.value = settings.sortBy;
    }

    if (elements.searchInput) {
      elements.searchInput.value = settings.query;
    }

    if (elements.favoritesOnly) {
      elements.favoritesOnly.checked = Boolean(settings.favoritesOnly);
    }

    elements.categoryFilters.forEach((button) => {
      const active = button.dataset.filter === settings.category;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("active", active);
    });
  }

  function openSettings() {
    if (!elements.settingsPanel) {
      return;
    }
    elements.settingsPanel.hidden = false;
    elements.settingsPanel.setAttribute("aria-hidden", "false");
  }

  function closeSettings() {
    if (!elements.settingsPanel) {
      return;
    }
    elements.settingsPanel.hidden = true;
    elements.settingsPanel.setAttribute("aria-hidden", "true");
  }

  projectEngine.bindFavoriteClicks(() => {
    writeSet(APP_CONFIG.favoritesKey, favorites);
    applyUi();
  });

  elements.searchInput?.addEventListener("input", () => {
    settings.query = elements.searchInput.value;
    applyUi();
    persistSettings();
  });

  elements.sortSelect?.addEventListener("change", () => {
    settings.sortBy = elements.sortSelect.value;
    applyUi();
    persistSettings();
  });

  elements.layoutToggle?.addEventListener("click", () => {
    settings.layout = settings.layout === "grid" ? "list" : "grid";
    applyUi();
    persistSettings();
  });

  elements.favoritesOnly?.addEventListener("change", () => {
    settings.favoritesOnly = elements.favoritesOnly.checked;
    applyUi();
    persistSettings();
  });

  elements.categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      settings.category = button.dataset.filter || "all";
      applyUi();
      persistSettings();
    });
  });

  elements.randomButton?.addEventListener("click", () => {
    projectEngine.spotlightVisible();
  });

  elements.settingsToggle?.addEventListener("click", () => openSettings());
  elements.settingsClose?.addEventListener("click", () => closeSettings());

  elements.settingsPanel?.addEventListener("click", (event) => {
    if (event.target === elements.settingsPanel) {
      closeSettings();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "?") {
      event.preventDefault();
      palette.toggle();
      return;
    }

    if (event.key === "Escape") {
      closeSettings();
    }

    if (event.key === "/" && document.activeElement !== elements.searchInput) {
      event.preventDefault();
      elements.searchInput?.focus();
    }
  });

  if (elements.currentYear) {
    elements.currentYear.textContent = String(new Date().getFullYear());
  }

  updateVisitCounter();
  applyUi();
})();
