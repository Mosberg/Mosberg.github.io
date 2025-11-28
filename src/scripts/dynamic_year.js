/**
 * Dynamic year display for footer.
 * The startYear defaults to the site launch year.
 * If the current year is before startYear, only currentYear is shown.
 * Otherwise, a range from startYear to currentYear is shown.
 */
(() => {
  const startYear = 2024; // approximate site launch year, update as needed
  const currentYear = new Date().getFullYear();
  if (currentYear < startYear) {
    document.getElementById("year").textContent = `${currentYear}`;
  } else {
    document.getElementById("year").textContent =
      startYear === currentYear
        ? `${currentYear}`
        : `${startYear}–${currentYear}`;
  }
})();
