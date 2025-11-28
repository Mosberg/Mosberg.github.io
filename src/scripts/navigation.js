// src/scripts/navigation.js
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector("nav[role='navigation']");
  if (!nav || typeof minecraft === "undefined") return;

  // Controls: search + expand/collapse all
  const controls = document.createElement("div");
  controls.className = "nav-controls";

  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search minecraft, mods, docs, files...";
  search.id = "siteSearch";
  controls.appendChild(search);

  const expandBtn = document.createElement("button");
  expandBtn.type = "button";
  expandBtn.textContent = "Expand all";
  expandBtn.dataset.action = "expand";
  controls.appendChild(expandBtn);

  const collapseBtn = document.createElement("button");
  collapseBtn.type = "button";
  collapseBtn.textContent = "Collapse all";
  collapseBtn.dataset.action = "collapse";
  controls.appendChild(collapseBtn);

  nav.appendChild(controls);

  // Primary nav
  const ul = document.createElement("ul");
  ul.className = "primary-nav";

  minecraft.forEach((mod) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${mod.id}`;
    a.textContent = mod.title;
    a.dataset.target = mod.id;
    li.appendChild(a);
    ul.appendChild(li);
  });

  nav.appendChild(ul);

  // Active link highlighting via IntersectionObserver
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        const link = ul.querySelector(`a[data-target="${id}"]`);
        if (link) {
          if (entry.isIntersecting) {
            ul.querySelectorAll("a").forEach((el) =>
              el.classList.remove("active")
            );
            link.classList.add("active");
            history.replaceState(null, "", `#${id}`);
          }
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0.1 }
  );

  function setCollapsed(collapsed, el) {
    el.open = !collapsed;
    el.classList.toggle("is-collapsed", collapsed);
  }

  window.__navHelpers = {
    observer,
    expandAll: () =>
      document
        .querySelectorAll(".collapsible")
        .forEach(setCollapsed.bind(null, false)),
    collapseAll: () =>
      document
        .querySelectorAll(".collapsible")
        .forEach(setCollapsed.bind(null, true)),
  };

  expandBtn.addEventListener("click", () => window.__navHelpers.expandAll());
  collapseBtn.addEventListener("click", () =>
    window.__navHelpers.collapseAll()
  );

  // Search filtering (handled in main_content via event)
  search.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    window.dispatchEvent(
      new CustomEvent("site:search", { detail: { query: q } })
    );
  });
});
