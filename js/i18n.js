
window.SL = window.SL || {};

(function (SL) {
  "use strict";

  const FALLBACK_LANG = "ru";
  const state = {
    lang: FALLBACK_LANG,
    locales: [], 
    dict: {},
    fallback: {}
  };

  function getPath(obj, path) {
    return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  function t(path, params) {
    let value = getPath(state.dict, path);
    if (value === undefined) value = getPath(state.fallback, path);
    if (value === undefined) {
      console.warn("[STUDENT LIFE] Нет перевода для ключа:", path);
      return path;
    }
    return params ? SL.utils.interpolate(value, params) : value;
  }

  
  function applyStatic(root) {
    const scope = root || document;
    SL.utils.$$("[data-i18n]", scope).forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    SL.utils.$$("[data-i18n-aria]", scope).forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.i18nAria));
    });
    SL.utils.$$("[data-i18n-title]", scope).forEach((node) => {
      node.setAttribute("title", t(node.dataset.i18nTitle));
    });
    SL.utils.$$("[data-i18n-placeholder]", scope).forEach((node) => {
      node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
    });
  }

  async function setLanguage(code) {
    const exists = state.locales.some((item) => item.code === code);
    const next = exists ? code : FALLBACK_LANG;
    let dict = {};
    try {
      dict = next === FALLBACK_LANG && state.fallback.__loaded ? await SL.data.loadLocale(next) : await SL.data.loadLocale(next);
    } catch (err) {
      console.warn("[STUDENT LIFE] Ошибка загрузки локали " + next + ", используется резервная.", err);
      dict = {};
    }
    state.lang = next;
    state.dict = dict;
    document.documentElement.lang = next;
    applyStatic(document);
    document.dispatchEvent(new CustomEvent("sl:langchange", { detail: { lang: next } }));
    return next;
  }

  async function init(manifest, savedLang) {
    state.locales = Array.isArray(manifest.locales) && manifest.locales.length
      ? manifest.locales
      : [{ code: FALLBACK_LANG, label: "Русский" }];
    try {
      state.fallback = await SL.data.loadLocale(FALLBACK_LANG);
      state.fallback.__loaded = true;
    } catch (err) {
      console.error("[STUDENT LIFE] Не удалось загрузить резервную локаль.", err);
      state.fallback = {};
    }
    return setLanguage(savedLang || FALLBACK_LANG);
  }

  SL.i18n = {
    t,
    applyStatic,
    init,
    setLanguage,
    get lang() {
      return state.lang;
    },
    get locales() {
      return state.locales;
    },
    FALLBACK_LANG
  };
})(window.SL);
