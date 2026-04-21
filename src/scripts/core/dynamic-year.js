/**
 * Universal Dynamic Year
 * Automatically updates copyright year
 */

(() => {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Also update any elements with class 'dynamic-year'
  document.querySelectorAll(".dynamic-year").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
