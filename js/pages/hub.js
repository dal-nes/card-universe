
window.SL = window.SL || {};
SL.pages = SL.pages || {};

(function (SL) {
  "use strict";
  const { el, icon } = SL.utils;

  let mainEl = null;

  async function init() {
    mainEl = document.getElementById("hub-main");
    if (!mainEl) return;
    mainEl.append(SL.components.pageLoading());

    try {
      const data = await SL.data.loadJSON("data/hub.json");
      render(data);
    } catch (err) {
      console.error(err);
      mainEl.textContent = "";
      mainEl.append(SL.components.pageError("Failed to load series.", "#"));
    }
    
    document.addEventListener("sl:langchange", async () => {
      try {
        const data = await SL.data.loadJSON("data/hub.json");
        render(data);
      } catch (e) {}
    });
  }

  function render(data) {
    const t = SL.i18n.t;
    mainEl.textContent = "";

    const grid = el("div", { class: "hub-grid" });

    (data.series || []).forEach((series) => {
      const card = el("a", { class: "hub-card", attrs: { href: series.url } });
      
      const coverBox = el("div", { class: "hub-card__cover-box" });
      if (series.cover) {
        coverBox.append(el("img", { class: "hub-card__cover", attrs: { src: series.cover, alt: "" } }));
      }
      
      const body = el("div", { class: "hub-card__body" }, [
        el("h2", { class: "hub-card__title", text: t("content.hub.title") }),
        el("div", { class: "hub-card__subtitle", text: t("content.hub.subtitle") }),
        el("p", { class: "hub-card__desc", text: t("content.hub.description") }),
        el("span", { class: "btn btn--primary", attrs: { style: "align-self: flex-start; margin-top: 1rem;" } }, [
          el("span", { text: t("actions.openPage") }),
          icon("arrowRight")
        ])
      ]);
      
      card.append(coverBox, body);
      grid.append(card);
    });

    mainEl.append(grid);
    SL.i18n.applyStatic(mainEl);
  }

  SL.pages.hub = { init };
})(window.SL);