function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function scoreText(card, query) {
  if (!query) {
    return 0;
  }

  const title = normalize(card.dataset.title);
  const tags = normalize(card.dataset.tags);
  const category = normalize(card.dataset.category);

  let score = 0;
  if (title.includes(query)) {
    score += 4;
  }
  if (tags.includes(query)) {
    score += 2;
  }
  if (category.includes(query)) {
    score += 1;
  }
  return score;
}

export function createProjectEngine({ gridEl, cards, favorites, onStats }) {
  function sortCards(activeCards, sortBy, query) {
    const entries = activeCards.map((card) => ({
      card,
      title: normalize(card.dataset.title),
      category: normalize(card.dataset.category),
      rank: Number(card.dataset.rank || 999),
      updated: Number(card.dataset.updated || 0),
      score: scoreText(card, query),
    }));

    entries.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "updated") return b.updated - a.updated;
      if (sortBy === "category") return a.category.localeCompare(b.category);
      if (sortBy === "relevance") return b.score - a.score || a.rank - b.rank;
      return a.rank - b.rank;
    });

    for (const entry of entries) {
      gridEl.appendChild(entry.card);
    }
  }

  function applyView(layout) {
    gridEl.setAttribute("data-layout", layout);
  }

  function syncFavoriteUi() {
    cards.forEach((card) => {
      const id = card.dataset.id;
      const isFavorite = favorites.has(id);
      const button = card.querySelector(".favorite-btn");
      if (button) {
        button.setAttribute("aria-pressed", String(isFavorite));
        button.textContent = isFavorite ? "Saved" : "Save";
      }
      card.classList.toggle("is-favorite", isFavorite);
    });
  }

  function applyFilters(settings) {
    const query = normalize(settings.query);
    const category = normalize(settings.category);
    const favoritesOnly = Boolean(settings.favoritesOnly);

    let visible = 0;

    cards.forEach((card) => {
      const id = card.dataset.id;
      const cardCategory = normalize(card.dataset.category);
      const isFavorite = favorites.has(id);
      const textBlob = normalize(`${card.dataset.title} ${card.dataset.tags} ${card.textContent}`);

      const matchesQuery = !query || textBlob.includes(query);
      const matchesCategory = category === "all" || category === cardCategory;
      const matchesFavorites = !favoritesOnly || isFavorite;
      const isVisible = matchesQuery && matchesCategory && matchesFavorites;

      card.hidden = !isVisible;
      if (isVisible) {
        visible += 1;
      }
    });

    const visibleCards = cards.filter((card) => !card.hidden);
    sortCards(visibleCards, settings.sortBy, query);

    onStats({
      total: cards.length,
      visible,
      favorites: favorites.size,
    });
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) {
      favorites.delete(id);
    } else {
      favorites.add(id);
    }
    syncFavoriteUi();
  }

  function spotlightVisible() {
    const visibleCards = cards.filter((card) => !card.hidden);
    if (!visibleCards.length) {
      return false;
    }

    const selected = visibleCards[Math.floor(Math.random() * visibleCards.length)];
    selected.classList.add("spotlight");
    selected.scrollIntoView({ behavior: "smooth", block: "center" });

    window.setTimeout(() => {
      selected.classList.remove("spotlight");
    }, 1800);

    return true;
  }

  function bindFavoriteClicks(onFavoriteChange) {
    cards.forEach((card) => {
      const button = card.querySelector(".favorite-btn");
      if (!button) {
        return;
      }

      button.addEventListener("click", (event) => {
        event.preventDefault();
        const id = card.dataset.id;
        toggleFavorite(id);
        onFavoriteChange();
      });
    });
  }

  syncFavoriteUi();

  return {
    applyView,
    applyFilters,
    bindFavoriteClicks,
    spotlightVisible,
    syncFavoriteUi,
  };
}
