/**
 * Theme selector with system preference detection,
 * saved preference, error handling, and accessibility improvements.
 */
(() => {
  const select = document.getElementById("themeSelectEl");
  // Add aria-label for accessibility
  select.setAttribute("aria-label", "Select website color theme");

  const defaultTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  function applyTheme(theme) {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("homepageTheme", theme);
      select.value = theme;
    } catch (e) {
      // Fallback: just apply theme attribute without localStorage
      document.documentElement.setAttribute("data-theme", theme);
      console.warn("Could not save theme preference:", e);
    }
  }

  let saved;
  try {
    saved = localStorage.getItem("homepageTheme");
  } catch (e) {
    saved = null;
    console.warn("Could not read theme preference:", e);
  }

  const themeToApply = saved || defaultTheme;
  applyTheme(themeToApply);

  select.addEventListener("change", () => applyTheme(select.value));
})();
