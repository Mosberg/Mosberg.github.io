// src/scripts/main_content.js
document.addEventListener("DOMContentLoaded", () => {
  if (typeof minecraft === "undefined") return;

  const main = document.getElementById("mainContent");
  if (!main) return;

  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
  });

  const cache = new Map();

  function normalizeBase(base) {
    if (!base) return location.href;
    try {
      const u = new URL(base);
      if (!u.pathname.endsWith("/")) u.pathname += "/";
      return u.toString();
    } catch {
      return base.endsWith("/") ? base : base + "/";
    }
  }

  function resolve(pathOrUrl, base) {
    const safeBase = normalizeBase(base);
    try {
      return new URL(pathOrUrl, safeBase).toString();
    } catch {
      return pathOrUrl;
    }
  }

  async function fetchText(url) {
    try {
      if (cache.has(url)) return cache.get(url);
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      const text = await res.text();
      cache.set(url, text);
      return text;
    } catch (err) {
      console.error("Fetch error:", url, err);
      throw err;
    }
  }

  function collapsible(title, contentEl, { open = false } = {}) {
    const details = document.createElement("details");
    details.className = "collapsible";
    details.open = open;
    const summary = document.createElement("summary");
    summary.textContent = title;
    details.appendChild(summary);
    details.appendChild(contentEl);
    return details;
  }

  function codeBlock(text, lang = "json", filename = "") {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = `language-${lang}`;
    code.innerHTML = hljs.highlight(lang, text).value;
    pre.appendChild(code);

    const tools = document.createElement("div");
    tools.className = "block-tools";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
    });

    const downloadBtn = document.createElement("a");
    downloadBtn.textContent = "Download";
    downloadBtn.href = URL.createObjectURL(
      new Blob([text], { type: "application/json" })
    );
    downloadBtn.download = filename || "file.json";

    const rawBtn = document.createElement("a");
    rawBtn.textContent = "Open raw";
    rawBtn.target = "_blank";
    rawBtn.rel = "noopener";

    tools.append(copyBtn, downloadBtn, rawBtn);

    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    wrap.append(tools, pre);
    return { wrap, rawBtn };
  }

  function textureItem(src, alt) {
    const fig = document.createElement("figure");
    fig.className = "texture-item";
    const img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.src = src;
    img.alt = alt || src.split("/").pop();
    img.addEventListener("click", () => openImageModal(src, alt));
    const figcap = document.createElement("figcaption");
    figcap.textContent = alt || img.alt;
    fig.append(img, figcap);
    return fig;
  }

  function openImageModal(src, alt) {
    let modal = document.getElementById("imageModal");
    if (!modal) {
      modal = document.createElement("dialog");
      modal.id = "imageModal";
      modal.className = "image-modal";
      const img = document.createElement("img");
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.textContent = "Close";
      closeBtn.className = "modal-close";
      closeBtn.addEventListener("click", () => modal.close());
      modal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") modal.close();
      });
      modal.append(img, closeBtn);
      document.body.appendChild(modal);
    }
    const img = modal.querySelector("img");
    img.src = src;
    img.alt = alt || src.split("/").pop();
    modal.showModal();
  }

  function addPermalink(h2, id) {
    const a = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = "¶";
    a.className = "permalink";
    a.setAttribute("aria-label", "Copy link to section");
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const url = new URL(`#${id}`, location.href).toString();
      navigator.clipboard.writeText(url);
    });
    h2.appendChild(a);
  }

  function rewriteLinks(container, baseUrl) {
    const base = new URL(baseUrl);
    container.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      const isAbsolute =
        /^(https?:)?\/\//i.test(href) ||
        href.startsWith("#") ||
        href.startsWith("mailto:");
      if (isAbsolute) return;
      const abs = new URL(href, base);
      a.href = abs.toString();
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  function lazyFetchOnOpen(detailsEl, fetcher) {
    let loaded = false;
    detailsEl.addEventListener("toggle", async () => {
      if (detailsEl.open && !loaded) {
        const summary = detailsEl.querySelector("summary");
        summary?.setAttribute("aria-busy", "true");
        loaded = true;
        try {
          await fetcher();
        } finally {
          summary?.removeAttribute("aria-busy");
        }
      }
    });
  }

  // Build sections dynamically from minecraft array
  minecraft.forEach((mod) => {
    const section = document.createElement("section");
    section.id = mod.id;

    const h2 = document.createElement("h2");
    h2.textContent = mod.title;
    addPermalink(h2, section.id);

    const desc = document.createElement("p");
    desc.textContent = mod.description;
    section.append(h2, desc);

    // README
    if (mod.readme) {
      const container = document.createElement("div");
      container.className = "readme";
      const details = collapsible("README", container, { open: false });

      lazyFetchOnOpen(details, async () => {
        const url = resolve(mod.readme, mod.base);
        try {
          const md = await fetchText(url);
          container.innerHTML = marked.parse(md);
          rewriteLinks(container, url);
        } catch {
          container.textContent = "Failed to load README.";
        }
      });

      section.appendChild(details);
    }

    // Docs
    if (Array.isArray(mod.docs) && mod.docs.length) {
      const docsWrap = document.createElement("div");
      docsWrap.className = "docs-wrap";
      const docsDetails = collapsible("Documentation", docsWrap, {
        open: false,
      });

      lazyFetchOnOpen(docsDetails, async () => {
        for (const docPath of mod.docs) {
          const docUrl = resolve(docPath, mod.base);
          const item = document.createElement("div");
          item.className = "doc-item";
          const name = docUrl.split("/").pop();
          const perItem = collapsible(name, document.createElement("div"), {
            open: false,
          });

          lazyFetchOnOpen(perItem, async () => {
            try {
              const text = await fetchText(docUrl);
              if (docUrl.endsWith(".md")) {
                perItem.lastChild.innerHTML = marked.parse(text);
                rewriteLinks(perItem.lastChild, docUrl);
              } else {
                const { wrap, rawBtn } = codeBlock(text, "json", name);
                rawBtn.href = docUrl;
                perItem.lastChild.appendChild(wrap);
              }
            } catch {
              perItem.lastChild.textContent = `Failed to load ${name}`;
            }
          });

          item.appendChild(perItem);
          docsWrap.appendChild(item);
        }
      });

      section.appendChild(docsDetails);
    }

    // Data files
    if (Array.isArray(mod.data) && mod.data.length) {
      const dataWrap = document.createElement("div");
      dataWrap.className = "data-wrap";
      const dataDetails = collapsible("Data files", dataWrap, { open: false });

      lazyFetchOnOpen(dataDetails, async () => {
        for (const dataPath of mod.data) {
          const dataUrl = resolve(dataPath, mod.base);
          const name = dataUrl.split("/").pop();
          const perItem = collapsible(name, document.createElement("div"), {
            open: false,
          });

          lazyFetchOnOpen(perItem, async () => {
            try {
              const text = await fetchText(dataUrl);
              const { wrap, rawBtn } = codeBlock(text, "json", name);
              rawBtn.href = dataUrl;
              perItem.lastChild.appendChild(wrap);
            } catch {
              perItem.lastChild.textContent = `Failed to load ${name}`;
            }
          });

          dataWrap.appendChild(perItem);
        }
      });

      section.appendChild(dataDetails);
    }

    // Models
    if (Array.isArray(mod.models) && mod.models.length) {
      const modelsWrap = document.createElement("div");
      modelsWrap.className = "models-wrap";
      const modelsDetails = collapsible("Models", modelsWrap, { open: false });

      lazyFetchOnOpen(modelsDetails, async () => {
        for (const modelPath of mod.models) {
          const modelUrl = resolve(modelPath, mod.base);
          const name = modelUrl.split("/").pop();
          const perItem = collapsible(name, document.createElement("div"), {
            open: false,
          });

          lazyFetchOnOpen(perItem, async () => {
            try {
              const text = await fetchText(modelUrl);
              const { wrap, rawBtn } = codeBlock(text, "json", name);
              rawBtn.href = modelUrl;
              perItem.lastChild.appendChild(wrap);
            } catch (err) {
              perItem.lastChild.innerHTML = `Failed to load <code>${dataUrl}</code>: ${err.message}`;
            }
          });

          modelsWrap.appendChild(perItem);
        }
      });

      section.appendChild(modelsDetails);
    }

    // Textures
    if (Array.isArray(mod.textures) && mod.textures.length) {
      const texturesWrap = document.createElement("div");
      texturesWrap.className = "textures-wrap";
      const texturesDetails = collapsible("Textures", texturesWrap, {
        open: false,
      });

      const grid = document.createElement("div");
      grid.className = "assets grid";

      const filter = document.createElement("input");
      filter.type = "search";
      filter.placeholder = "Filter textures...";
      filter.className = "texture-filter";
      filter.addEventListener("input", () => {
        const q = filter.value.toLowerCase();
        Array.from(grid.children).forEach((child) => {
          const name =
            child.querySelector("figcaption")?.textContent.toLowerCase() || "";
          child.style.display = name.includes(q) ? "" : "none";
        });
      });

      texturesWrap.append(filter, grid);

      mod.textures.forEach((path) => {
        const src = resolve(path, mod.base);
        grid.appendChild(textureItem(src, src.split("/").pop()));
      });

      section.appendChild(texturesDetails);
    }

    main.appendChild(section);
    window.__navHelpers?.observer.observe(section);
  });

  // Deep-link handling
  function scrollToHash() {
    const id = decodeURIComponent(location.hash.replace("#", ""));
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("highlight-section");
      el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
      setTimeout(() => el.classList.remove("highlight-section"), 1200);
    }
  }
  scrollToHash();
  window.addEventListener("hashchange", scrollToHash);

  // Site-wide search
  window.addEventListener("site:search", (e) => {
    const q = (e.detail?.query || "").toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);
    const sections = main.querySelectorAll("section");
    sections.forEach((sec) => {
      const text = [
        sec.querySelector("h2")?.textContent || "",
        ...Array.from(
          sec.querySelectorAll("p, h3, h4, figcaption, summary")
        ).map((el) => el.textContent || ""),
      ]
        .join(" ")
        .toLowerCase();
      const match =
        tokens.length === 0 || tokens.every((t) => text.includes(t));
      sec.style.display = match ? "" : "none";
    });
  });
});
