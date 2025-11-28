/**
 * Dynamic visit counter using localStorage with error handling and message improvements.
 */
(() => {
  const counterKey = "visitCount";
  const lastVisitKey = "lastVisit";

  let visits = 0;
  let lastVisit = null;

  try {
    visits = parseInt(localStorage.getItem(counterKey), 10) || 0;
    lastVisit = localStorage.getItem(lastVisitKey);
  } catch (e) {
    console.warn("Could not read visit data:", e);
  }

  visits++;
  try {
    localStorage.setItem(counterKey, visits);
    const now = new Date();
    localStorage.setItem(lastVisitKey, now.toISOString());
  } catch (e) {
    console.warn("Could not write visit data:", e);
  }

  let lastVisitText = "This is your first visit 🎉";
  if (lastVisit) {
    try {
      lastVisitText = new Date(lastVisit).toLocaleString([], {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.warn("Could not format last visit date:", e);
    }
  }

  // Improved pluralization message
  const visitPlural = visits === 1 ? "time" : "times";

  const visitEl = document.getElementById("visitCounter");
  if (visitEl) {
    visitEl.textContent = `👋 You’ve visited ${visits} ${visitPlural}. Last visit: ${lastVisitText}`;
  }
})();
