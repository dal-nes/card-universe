
window.SL = window.SL || {};

(function (SL) {
  "use strict";

  const KEY = "student-life-settings";
  const DEFAULTS = { theme: "dark", palette: "pastel", fontScale: 100, lang: "en" };
  const PALETTES = [
    { id: "classic", labelKey: "settings.paletteClassic", swatches: ["#e76f51", "#e9c46a", "#264653"] },
    { id: "pastel", labelKey: "settings.palettePastel", swatches: ["#e08dac", "#b5a8e0", "#fbf4f0"] },
    { id: "rose", labelKey: "settings.paletteRose", swatches: ["#b45ad0", "#e0679a", "#3c2a4a"] },
    { id: "cold", labelKey: "settings.paletteCold", swatches: ["#3e7cb1", "#7fb8c9", "#eef3f6"] }
  ];
  const FONT_MIN = 85;
  const FONT_MAX = 120;

  const state = Object.assign({}, DEFAULTS, SL.utils.storage.get(KEY, {}));

  function persist() {
    SL.utils.storage.set(KEY, {
      theme: state.theme,
      palette: state.palette,
      fontScale: state.fontScale,
      lang: state.lang
    });
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
  }
  function applyPalette() {
    document.documentElement.dataset.palette = state.palette;
  }
  function applyFontScale() {
    document.documentElement.style.setProperty("--fs-scale", state.fontScale / 100);
  }

  function setTheme(theme) {
    state.theme = theme === "dark" ? "dark" : "light";
    applyTheme();
    persist();
    syncPanel();
  }
  function setPalette(palette) {
    if (!PALETTES.some((item) => item.id === palette)) return;
    state.palette = palette;
    applyPalette();
    persist();
    syncPanel();
  }
  function setFontScale(value) {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return;
    state.fontScale = Math.min(FONT_MAX, Math.max(FONT_MIN, num));
    applyFontScale();
    persist();
    syncPanel();
  }
  async function setLang(lang) {
    state.lang = lang;
    persist();
    await SL.i18n.setLanguage(lang);
    syncPanel();
  }

  
  let panelRefs = null;

  function buildPanel() {
    const { el, icon } = SL.utils;

    const overlay = el("div", { class: "settings-overlay", attrs: { id: "settings-overlay", hidden: true } });
    const panel = el("aside", {
      class: "settings-panel",
      attrs: { id: "settings-panel", "aria-label": SL.i18n.t("settings.title"), hidden: true }
    });

    const head = el("div", { class: "settings-panel__head" }, [
      el("h2", { text: SL.i18n.t("settings.title") }),
      el("button", {
        class: "icon-btn",
        attrs: { type: "button", "aria-label": SL.i18n.t("actions.close") },
        on: { click: closePanel }
      }, [icon("close")])
    ]);

    
    const themeLight = el("button", { attrs: { type: "button", "aria-pressed": "false" }, on: { click: () => setTheme("light") } });
    const themeDark = el("button", { attrs: { type: "button", "aria-pressed": "false" }, on: { click: () => setTheme("dark") } });
    const themeGroup = el("div", { class: "settings-group" }, [
      el("span", { text: SL.i18n.t("settings.theme") }),
      el("div", { class: "segmented", attrs: { role: "group" } }, [themeLight, themeDark])
    ]);

    
    const paletteList = el("div", { class: "palette-list" });
    const paletteButtons = PALETTES.map((palette) => {
      const swatches = el("span", { class: "palette-option__swatches", attrs: { "aria-hidden": "true" } },
        palette.swatches.map((color) => {
          const dot = el("i");
          dot.style.background = color;
          return dot;
        })
      );
      const btn = el("button", {
        class: "palette-option",
        attrs: { type: "button", "aria-pressed": "false" },
        dataset: { palette: palette.id },
        on: { click: () => setPalette(palette.id) }
      }, [swatches, el("span", { text: SL.i18n.t(palette.labelKey) })]);
      paletteList.append(btn);
      return btn;
    });
    const paletteGroup = el("div", { class: "settings-group" }, [
      el("span", { text: SL.i18n.t("settings.palette") }),
      paletteList
    ]);

    
    const fontOutput = el("output", { attrs: { for: "font-scale" } });
    const fontRange = el("input", {
      attrs: { type: "range", id: "font-scale", min: FONT_MIN, max: FONT_MAX, step: 5, "aria-label": SL.i18n.t("settings.fontSize") },
      on: { input: (event) => setFontScale(event.target.value) }
    });
    const fontGroup = el("div", { class: "settings-group" }, [
      el("span", { text: SL.i18n.t("settings.fontSize") }),
      el("div", { class: "slider-row" }, [fontRange, fontOutput])
    ]);

    
    const langBtn = el("button", {
      class: "select dropdown-toggle",
      attrs: { type: "button", "aria-expanded": "false" }
    });
    const langMenu = el("ul", { class: "dropdown-menu" });
    const langSelect = el("div", { class: "custom-dropdown" }, [langBtn, langMenu]);

    langBtn.addEventListener("click", () => {
      const isOpen = langMenu.classList.contains("is-open");
      langMenu.classList.toggle("is-open");
      langBtn.setAttribute("aria-expanded", String(!isOpen));
    });
    
    
    document.addEventListener("click", (event) => {
      if (!langSelect.contains(event.target)) {
        langMenu.classList.remove("is-open");
        langBtn.setAttribute("aria-expanded", "false");
      }
    });

    const langGroup = el("div", { class: "settings-group" }, [
      el("span", { text: SL.i18n.t("settings.language") }),
      langSelect
    ]);

    const resetBtn = el("button", {
      class: "btn btn--ghost",
      attrs: { type: "button" },
      text: SL.i18n.t("settings.reset"),
      on: {
        click: async () => {
          setTheme(DEFAULTS.theme);
          setPalette(DEFAULTS.palette);
          setFontScale(DEFAULTS.fontScale);
          await setLang(DEFAULTS.lang);
        }
      }
    });

    panel.append(head, themeGroup, paletteGroup, fontGroup, langGroup, resetBtn);
    document.body.append(overlay, panel);

    overlay.addEventListener("click", closePanel);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && panel.classList.contains("is-open")) closePanel();
    });

    panelRefs = { overlay, panel, themeLight, themeDark, paletteButtons, fontRange, fontOutput, langSelect, langBtn, langMenu, head, themeGroup, paletteGroup, fontGroup, langGroup, resetBtn };
    refreshPanelTexts();
    syncPanel();
  }

  function refreshPanelTexts() {
    if (!panelRefs) return;
    const t = SL.i18n.t;
    panelRefs.panel.setAttribute("aria-label", t("settings.title"));
    panelRefs.head.querySelector("h2").textContent = t("settings.title");
    panelRefs.head.querySelector("button").setAttribute("aria-label", t("actions.close"));
    panelRefs.themeLight.textContent = t("settings.themeLight");
    panelRefs.themeDark.textContent = t("settings.themeDark");
    panelRefs.themeGroup.querySelector("span").textContent = t("settings.theme");
    panelRefs.paletteGroup.querySelector("span").textContent = t("settings.palette");
    panelRefs.paletteButtons.forEach((btn, index) => {
      btn.querySelector("span:last-child").textContent = t(PALETTES[index].labelKey);
    });
    panelRefs.fontGroup.querySelector("span").textContent = t("settings.fontSize");
    panelRefs.langGroup.querySelector("span").textContent = t("settings.language");
    panelRefs.resetBtn.textContent = t("settings.reset");
    rebuildLangOptions();
  }

  function rebuildLangOptions() {
    const menu = panelRefs.langMenu;
    menu.textContent = "";
    
    SL.i18n.locales.forEach((locale) => {
      const li = SL.utils.el("li", { text: locale.label });
      li.addEventListener("click", () => {
        setLang(locale.code);
        menu.classList.remove("is-open");
        panelRefs.langBtn.setAttribute("aria-expanded", "false");
      });
      menu.append(li);
    });
    
    const current = SL.i18n.locales.find(l => l.code === SL.i18n.lang);
    panelRefs.langBtn.textContent = current ? current.label : SL.i18n.lang;
  }

  function syncPanel() {
    if (!panelRefs) return;
    panelRefs.themeLight.setAttribute("aria-pressed", String(state.theme === "light"));
    panelRefs.themeDark.setAttribute("aria-pressed", String(state.theme === "dark"));
    panelRefs.paletteButtons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.palette === state.palette));
    });
    panelRefs.fontRange.value = String(state.fontScale);
    panelRefs.fontRange.style.setProperty("--fill", ((state.fontScale - FONT_MIN) / (FONT_MAX - FONT_MIN)) * 100 + "%");
    panelRefs.fontOutput.value = state.fontScale + "%";
    
    const current = SL.i18n.locales.find(l => l.code === state.lang);
    if (current) panelRefs.langBtn.textContent = current.label;
  }

  function openPanel() {
    if (!panelRefs) buildPanel();
    panelRefs.overlay.hidden = false;
    panelRefs.panel.hidden = false;
    requestAnimationFrame(() => {
      panelRefs.overlay.classList.add("is-open");
      panelRefs.panel.classList.add("is-open");
    });
    document.body.classList.add("no-scroll");
  }

  function closePanel() {
    if (!panelRefs) return;
    panelRefs.overlay.classList.remove("is-open");
    panelRefs.panel.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => {
      if (!panelRefs.panel.classList.contains("is-open")) {
        panelRefs.overlay.hidden = true;
        panelRefs.panel.hidden = true;
      }
    }, 500);
  }

  function applyAll() {
    applyTheme();
    applyPalette();
    applyFontScale();
  }

  document.addEventListener("sl:langchange", refreshPanelTexts);

  SL.settings = {
    init() {
      applyAll();
    },
    openPanel,
    closePanel,
    setTheme,
    setPalette,
    setFontScale,
    setLang,
    get theme() { return state.theme; },
    get palette() { return state.palette; },
    get fontScale() { return state.fontScale; },
    get lang() { return state.lang; }
  };
})(window.SL);