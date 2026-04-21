/**
 * Universal Theme Selector
 * Works across all GitHub Pages
 */

(() => {
  const STORAGE_KEY = "mosberg-theme";
  const select = document.getElementById("themeSelect");

  if (!select) return;

  // Detect system preference
  const getSystemTheme = () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // Apply theme
  function applyTheme(theme) {
    try {
      const effectiveTheme = theme === "auto" ? getSystemTheme() : theme;
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(STORAGE_KEY, theme);
      select.value = theme;

      // Dispatch event for other scripts
      window.dispatchEvent(
        new CustomEvent("themeChanged", {
          detail: { theme, effectiveTheme },
        })
      );
    } catch (error) {
      console.warn("Theme application error:", error);
      document.documentElement.setAttribute("data-theme", theme);
    }
  }

  // Load saved theme
  let savedTheme = "auto";
  try {
    savedTheme = localStorage.getItem(STORAGE_KEY) || "auto";
  } catch (error) {
    console.warn("Could not read saved theme:", error);
  }

  // Initialize
  applyTheme(savedTheme);

  // Listen for changes
  select.addEventListener("change", () => applyTheme(select.value));

  // Listen for system theme changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (select.value === "auto") {
        applyTheme("auto");
      }
    });
})();
