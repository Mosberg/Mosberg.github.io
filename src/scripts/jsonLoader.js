// jsonLoader.js
// Ultra‑robust dynamic JSON loader with validation, merging, caching,
// dependency resolution, event hooks, metrics, and error buckets.

export const JSONLoader = {
  // -----------------------------
  // STATE
  // -----------------------------
  sources: [], // [{ url, group, priority, schema }]
  data: {}, // Final merged dataset
  raw: {}, // Raw per-file JSON
  cache: new Map(), // In-memory cache
  ready: false,
  errors: [], // Error bucket
  metrics: {
    // Performance metrics
    started: 0,
    finished: 0,
    duration: 0,
    filesLoaded: 0,
    filesFailed: 0,
  },

  // Event system
  events: {
    ready: [],
    error: [],
    beforeLoad: [],
    afterLoad: [],
    beforeMerge: [],
    afterMerge: [],
  },

  // -----------------------------
  // CONFIG
  // -----------------------------
  config: {
    retries: 2,
    timeout: 8000,
    deepMerge: true,
    dedupeArrays: true,
    flattenArrays: false,
    validateSchemas: true,
    strictTypes: false,
    logLevel: "info", // none | error | warn | info | debug
  },

  // -----------------------------
  // INIT
  // -----------------------------
  init(sources = [], config = {}) {
    this.sources = sources.map((src) => ({
      url: src.url || src,
      group: src.group || "default",
      priority: src.priority || 0,
      schema: src.schema || null,
    }));

    Object.assign(this.config, config);

    this.loadAll();
  },

  // -----------------------------
  // LOGGING
  // -----------------------------
  log(level, ...msg) {
    const allowed = ["debug", "info", "warn", "error"];
    if (!allowed.includes(level)) return;
    if (allowed.indexOf(level) < allowed.indexOf(this.config.logLevel)) return;
    console[level]("[JSONLoader]", ...msg);
  },

  // -----------------------------
  // EVENT HOOKS
  // -----------------------------
  on(event, callback) {
    if (!this.events[event]) throw new Error(`Unknown event: ${event}`);
    this.events[event].push(callback);
  },

  emit(event, payload) {
    if (!this.events[event]) return;
    for (const cb of this.events[event]) cb(payload);
  },

  // -----------------------------
  // LOAD ALL SOURCES
  // -----------------------------
  async loadAll() {
    this.metrics.started = performance.now();

    // Sort by priority
    const sorted = [...this.sources].sort((a, b) => b.priority - a.priority);

    const tasks = sorted.map((src) => this.loadSingle(src));

    await Promise.all(tasks);

    this.ready = true;
    this.metrics.finished = performance.now();
    this.metrics.duration = this.metrics.finished - this.metrics.started;

    this.emit("ready", this.data);
  },

  // -----------------------------
  // LOAD SINGLE SOURCE
  // -----------------------------
  async loadSingle(src) {
    const { url } = src;

    this.emit("beforeLoad", src);

    // Cache hit
    if (this.cache.has(url)) {
      const cached = this.cache.get(url);
      this.raw[url] = cached;
      this.merge(cached, src);
      this.metrics.filesLoaded++;
      this.emit("afterLoad", { src, cached });
      return;
    }

    // Fetch with retry + timeout
    let attempt = 0;
    while (attempt <= this.config.retries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          this.config.timeout,
        );

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();

        // Schema validation
        if (src.schema && this.config.validateSchemas) {
          const valid = this.validateSchema(json, src.schema);
          if (!valid) throw new Error(`Schema mismatch for ${url}`);
        }

        this.raw[url] = json;
        this.cache.set(url, json);

        this.emit("afterLoad", { src, json });

        this.merge(json, src);
        this.metrics.filesLoaded++;
        return;
      } catch (err) {
        attempt++;
        this.log("warn", `Retry ${attempt}/${this.config.retries} for`, url);

        if (attempt > this.config.retries) {
          this.errors.push({ url, error: err });
          this.metrics.filesFailed++;
          this.emit("error", { url, error: err });
          return;
        }
      }
    }
  },

  // -----------------------------
  // SCHEMA VALIDATION
  // -----------------------------
  validateSchema(json, schema) {
    // Simple structural validation
    for (const key in schema) {
      if (!(key in json)) return false;
      if (this.config.strictTypes && typeof json[key] !== schema[key])
        return false;
    }
    return true;
  },

  // -----------------------------
  // MERGING LOGIC
  // -----------------------------
  merge(json, src) {
    this.emit("beforeMerge", { json, src });

    if (Array.isArray(json)) {
      if (!Array.isArray(this.data)) this.data = [];

      let arr = json;

      if (this.config.flattenArrays) {
        arr = arr.flat(Infinity);
      }

      if (this.config.dedupeArrays) {
        const existing = new Set(this.data.map((x) => JSON.stringify(x)));
        arr = arr.filter((x) => !existing.has(JSON.stringify(x)));
      }

      this.data.push(...arr);
    } else if (typeof json === "object") {
      if (this.config.deepMerge) {
        this.data = this.deepMerge(this.data, json);
      } else {
        this.data = { ...this.data, ...json };
      }
    }

    this.emit("afterMerge", this.data);
  },

  // -----------------------------
  // DEEP MERGE
  // -----------------------------
  deepMerge(target, source) {
    if (typeof target !== "object" || typeof source !== "object") return source;

    const out = { ...target };

    for (const key of Object.keys(source)) {
      if (Array.isArray(source[key])) {
        out[key] = [
          ...(Array.isArray(out[key]) ? out[key] : []),
          ...source[key],
        ];
      } else if (typeof source[key] === "object") {
        out[key] = this.deepMerge(out[key] || {}, source[key]);
      } else {
        out[key] = source[key];
      }
    }

    return out;
  },

  // -----------------------------
  // GETTERS
  // -----------------------------
  getRaw(url) {
    return this.raw[url];
  },

  getGroup(group) {
    return this.sources
      .filter((s) => s.group === group)
      .map((s) => this.raw[s.url]);
  },

  get(key) {
    return this.data[key];
  },

  // -----------------------------
  // RESET
  // -----------------------------
  reset() {
    this.sources = [];
    this.data = {};
    this.raw = {};
    this.cache.clear();
    this.ready = false;
    this.errors = [];
    this.metrics = {
      started: 0,
      finished: 0,
      duration: 0,
      filesLoaded: 0,
      filesFailed: 0,
    };
  },
};
