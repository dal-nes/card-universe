
window.SL = window.SL || {};

(function (SL) {
  "use strict";

  const cache = new Map();

  async function loadJSON(url) {
    if (cache.has(url)) return cache.get(url);
    let response;
    try {
      response = await fetch(url, { cache: "no-cache" });
    } catch (err) {
      throw new SL.utils.DataError("network", url, err);
    }
    if (!response.ok) throw new SL.utils.DataError("http-" + response.status, url);
    try {
      const data = await response.json();
      cache.set(url, data);
      return data;
    } catch (err) {
      throw new SL.utils.DataError("parse", url, err);
    }
  }

  class DataError extends Error {
    constructor(kind, url, cause) {
      super("Data load failed [" + kind + "]: " + url);
      this.kind = kind;
      this.url = url;
      this.cause = cause;
    }
  }
  SL.utils.DataError = DataError;

  async function loadManifest() {
    return loadJSON("data/manifest.json");
  }

  async function loadCharacter(entryOrId) {
    const manifest = await loadManifest();
    let entry = null;
    if (typeof entryOrId === "string") {
      entry = (manifest.characters || []).find((item) => item.id === entryOrId) || null;
    } else {
      entry = entryOrId;
    }
    if (!entry || !entry.file) return null;
    return loadJSON(entry.file);
  }

  async function loadAllCharacters() {
    const manifest = await loadManifest();
    const entries = manifest.characters || [];
    const results = await Promise.allSettled(entries.map((entry) => loadCharacter(entry)));
    return results
      .map((result) => (result.status === "fulfilled" ? result.value : null))
      .filter(Boolean);
  }

  async function loadGroup() {
    const manifest = await loadManifest();
    if (!manifest.group) return null;
    return loadJSON(manifest.group);
  }

  async function loadLocale(code) {
    return loadJSON("data/locales/" + encodeURIComponent(code) + ".json");
  }

  SL.data = { loadJSON, loadManifest, loadCharacter, loadAllCharacters, loadGroup, loadLocale };
})(window.SL);