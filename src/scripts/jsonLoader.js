// jsonLoader.js
// Ultra‑robust dynamic JSON loader supporting JSON, JSONC, JSON5,
// schema auto‑detection, validation, deep merging, caching, events,
// metrics, priorities, groups, and error buckets.

export const JSONLoader = {
  // -----------------------------
  // STATE
  // -----------------------------
  sources: [], // [{ url, group, priority, schema }]
  data: {}, // Final merged dataset
  raw: {}, // Raw per-file JSON
  cache: new Map(), // In-memory cache
  ready: false,
  errors: [],
  metrics: {
    started: 0,
    finished: 0,
    duration: 0,
    filesLoaded: 0,
    filesFailed: 0,
  },

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
    autoDetectSchemas: true,
    strictTypes: false,
    logLevel: "info",
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
  // EVENTS
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
  // LOAD ALL
  // -----------------------------
  async loadAll() {
    this.metrics.started = performance.now();

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

        const rawText = await response.text();
        const json = await this.parseByType(url, rawText);

        // Auto-detect schema if enabled
        if (this.config.autoDetectSchemas && !src.schema) {
          src.schema = this.detectSchema(json);
          this.log("info", "Auto-detected schema for", url, src.schema);
        }

        // Validate schema if enabled
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
  // JSON FORMAT PARSERS
  // -----------------------------
  stripJsonComments(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
  },

  parseJSON5(text) {
    try {
      let t = text;

      t = t.replace(/'/g, '"');
      t = t.replace(/(\w+)\s*:/g, '"$1":');
      t = t.replace(/,\s*([}\]])/g, "$1");

      return JSON.parse(t);
    } catch (err) {
      throw new Error("JSON5 parse error: " + err.message);
    }
  },

  async parseByType(url, text) {
    const lower = url.toLowerCase();

    try {
      if (lower.endsWith(".json")) {
        return JSON.parse(text);
      }

      if (lower.endsWith(".jsonc")) {
        return JSON.parse(this.stripJsonComments(text));
      }

      if (lower.endsWith(".json5")) {
        return this.parseJSON5(text);
      }

      // fallback chain
      try {
        return JSON.parse(text);
      } catch (_) {}
      try {
        return JSON.parse(this.stripJsonComments(text));
      } catch (_) {}
      try {
        return this.parseJSON5(text);
      } catch (_) {}

      throw new Error("Unsupported JSON format: " + url);
    } catch (err) {
      throw new Error(`Failed parsing ${url}: ${err.message}`);
    }
  },

  // -----------------------------
  // SCHEMA AUTO-DETECTION
  // -----------------------------
  detectSchema(json) {
    const schema = {};

    if (Array.isArray(json)) {
      schema.type = "array";
      schema.items = json.length ? this.detectSchema(json[0]) : {};
      return schema;
    }

    if (typeof json === "object" && json !== null) {
      schema.type = "object";
      schema.properties = {};

      for (const key in json) {
        const val = json[key];

        if (Array.isArray(val)) {
          schema.properties[key] = {
            type: "array",
            items: val.length ? this.detectSchema(val[0]) : {},
          };
        } else if (typeof val === "object" && val !== null) {
          schema.properties[key] = this.detectSchema(val);
        } else {
          schema.properties[key] = { type: typeof val };
        }
      }

      return schema;
    }

    return { type: typeof json };
  },

  // -----------------------------
  // SCHEMA VALIDATION
  // -----------------------------
  validateSchema(json, schema) {
    if (!schema) return true;

    if (schema.type === "array") {
      if (!Array.isArray(json)) return false;
      if (schema.items) {
        return json.every((item) => this.validateSchema(item, schema.items));
      }
      return true;
    }

    if (schema.type === "object") {
      if (typeof json !== "object" || json === null || Array.isArray(json))
        return false;

      for (const key in schema.properties) {
        if (!(key in json)) return false;
        if (!this.validateSchema(json[key], schema.properties[key]))
          return false;
      }

      return true;
    }

    if (schema.type !== typeof json) return false;

    return true;
  },

  // -----------------------------
  // MERGING
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
