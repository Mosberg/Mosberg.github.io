// jsonLoader.js
// Dynamic JSON loader supporting local, server, online, and mixed sources.

export const JSONLoader = {
    sources: [],          // Array of URLs
    data: {},             // Merged JSON data
    raw: {},              // Raw per-file JSON
    ready: false,         // Flag for completion
    onReadyCallbacks: [], // Callbacks to run when data is ready

    /**
     * Initialize loader with an array of JSON URLs
     */
    init(sources = []) {
        this.sources = sources;
        this.loadAll();
    },

    /**
     * Load all JSON files in parallel
     */
    async loadAll() {
        const fetches = this.sources.map(async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed: ${url}`);
                const json = await response.json();

                this.raw[url] = json;
                this.merge(json);
            } catch (err) {
                console.error("JSONLoader error:", err);
            }
        });

        await Promise.all(fetches);

        this.ready = true;
        this.onReadyCallbacks.forEach(cb => cb(this.data));
    },

    /**
     * Merge JSON objects into unified dataset
     */
    merge(json) {
        if (Array.isArray(json)) {
            // Merge arrays
            if (!Array.isArray(this.data)) this.data = [];
            this.data.push(...json);
        } else if (typeof json === "object") {
            // Merge objects
            this.data = { ...this.data, ...json };
        }
    },

    /**
     * Register callback to run when data is ready
     */
    onReady(callback) {
        if (this.ready) callback(this.data);
        else this.onReadyCallbacks.push(callback);
    }
};