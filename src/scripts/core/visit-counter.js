/**
 * Universal Visit Counter
 * Tracks visits across all pages separately
 */

(() => {
  const getPageKey = () => {
    const path = window.location.pathname;
    return `visits-${path.replace(/\//g, "-") || "home"}`;
  };

  const COUNTER_KEY = getPageKey();
  const LAST_VISIT_KEY = `${COUNTER_KEY}-last`;

  const counterEl = document.getElementById("visitCounter");
  if (!counterEl) return;

  let visits = 0;
  let lastVisit = null;

  // Read data
  try {
    visits = parseInt(localStorage.getItem(COUNTER_KEY), 10) || 0;
    lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  } catch (error) {
    console.warn("Could not read visit data:", error);
  }

  // Increment and save
  visits++;
  try {
    localStorage.setItem(COUNTER_KEY, visits);
    const now = new Date();
    localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
  } catch (error) {
    console.warn("Could not save visit data:", error);
  }

  // Format last visit
  let lastVisitText = "First visit 🎉";
  if (lastVisit) {
    try {
      const date = new Date(lastVisit);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        lastVisitText = "Just now";
      } else if (diffMins < 60) {
        lastVisitText = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      } else if (diffHours < 24) {
        lastVisitText = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else if (diffDays < 7) {
        lastVisitText = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      } else {
        lastVisitText = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    } catch (error) {
      lastVisitText = "Recently";
    }
  }

  // Display
  const plural = visits === 1 ? "visit" : "visits";
  counterEl.textContent = `👋 ${visits} ${plural} • Last: ${lastVisitText}`;
  counterEl.title = `You've visited this page ${visits} time${
    visits > 1 ? "s" : ""
  }`;
})();
