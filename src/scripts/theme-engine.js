export function createThemeEngine({ root, themeSelect, accentSlider, motionToggle, onChange }) {
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeSelect) {
      themeSelect.value = theme;
    }
  }

  function applyAccentHue(hue) {
    const safeHue = Number.isFinite(hue) ? Math.max(0, Math.min(360, hue)) : 42;
    root.style.setProperty("--accent-h", String(safeHue));
    root.style.setProperty("--accent", `hsl(${safeHue} 94% 62%)`);
    root.style.setProperty("--accent-soft", `hsl(${safeHue} 94% 62% / 0.18)`);

    if (accentSlider) {
      accentSlider.value = String(safeHue);
    }
  }

  function applyMotion(motion) {
    root.setAttribute("data-motion", motion);
    if (motionToggle) {
      motionToggle.checked = motion === "on";
    }
  }

  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      onChange({ theme: themeSelect.value });
    });
  }

  if (accentSlider) {
    accentSlider.addEventListener("input", () => {
      onChange({ accentHue: Number(accentSlider.value) });
    });
  }

  if (motionToggle) {
    motionToggle.addEventListener("change", () => {
      onChange({ motion: motionToggle.checked ? "on" : "off" });
    });
  }

  return {
    applyTheme,
    applyAccentHue,
    applyMotion,
  };
}
