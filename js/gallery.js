
window.SL = window.SL || {};

(function (SL) {
  "use strict";
  const { el, icon, loc } = SL.utils;

  let lightbox = null;
  let lightboxState = { items: [], index: 0 };

  function ensureLightbox() {
    if (lightbox) return lightbox;
    const t = SL.i18n.t;

    const img = el("img", { attrs: { alt: "" } });
    const caption = el("figcaption", { class: "lightbox__caption" });
    const counter = el("span", { class: "lightbox__counter" });

    const btnClose = el("button", { class: "lightbox__btn lightbox__btn--close", attrs: { type: "button", "aria-label": t("actions.close") }, on: { click: close } }, [icon("close")]);
    const btnPrev = el("button", { class: "lightbox__btn lightbox__btn--prev", attrs: { type: "button", "aria-label": t("gallery.prev") }, on: { click: () => step(-1) } }, [icon("chevronLeft")]);
    const btnNext = el("button", { class: "lightbox__btn lightbox__btn--next", attrs: { type: "button", "aria-label": t("gallery.next") }, on: { click: () => step(1) } }, [icon("chevronRight")]);

    const figure = el("figure", { class: "lightbox__figure" }, [img, caption]);
    const box = el("div", {
      class: "lightbox",
      attrs: { role: "dialog", "aria-modal": "true", "aria-label": t("gallery.open"), hidden: true }
    }, [counter, btnClose, btnPrev, figure, btnNext]);

    box.addEventListener("click", (event) => {
      if (event.target === box) close();
    });
    document.addEventListener("keydown", (event) => {
      if (!box.classList.contains("is-open")) return;
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
    });

    document.body.append(box);
    lightbox = { box, img, caption, counter, btnPrev, btnNext, btnClose };
    return lightbox;
  }

  function update() {
    const t = SL.i18n.t;
    const lang = SL.i18n.lang;
    const lb = ensureLightbox();
    const item = lightboxState.items[lightboxState.index];
    if (!item) return;
    lb.img.src = item.src;
    lb.img.alt = loc(item.alt, lang) || "";
    lb.caption.textContent = loc(item.caption, lang) || "";
    lb.counter.textContent = t("gallery.counter", {
      current: lightboxState.index + 1,
      total: lightboxState.items.length
    });
    const single = lightboxState.items.length < 2;
    lb.btnPrev.style.display = single ? "none" : "";
    lb.btnNext.style.display = single ? "none" : "";
  }

  function step(delta) {
    const total = lightboxState.items.length;
    if (!total) return;
    lightboxState.index = (lightboxState.index + delta + total) % total;
    update();
  }

  function open(items, index) {
    lightboxState = { items, index: index || 0 };
    const lb = ensureLightbox();
    update();
    lb.box.hidden = false;
    requestAnimationFrame(() => lb.box.classList.add("is-open"));
    document.body.classList.add("no-scroll");
    lb.btnClose.focus();
  }

  function close() {
    if (!lightbox) return;
    lightbox.box.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => {
      if (!lightbox.box.classList.contains("is-open")) lightbox.box.hidden = true;
    }, 400);
  }

  
  function buildGallery(items) {
    if (!Array.isArray(items) || !items.length) return null;
    const t = SL.i18n.t;
    const lang = SL.i18n.lang;

    const grid = el("div", { class: "gallery-grid" });
    items.forEach((item, index) => {
      if (!item || !item.src) return;
      const img = el("img", {
        attrs: { src: item.src, alt: loc(item.alt, lang) || "", loading: "lazy" }
      });
      img.addEventListener("error", () => {
        const figure = img.closest(".gallery-item");
        if (figure) figure.remove();
      });
      const figure = el("figure", {
        class: "gallery-item",
        attrs: { tabindex: "0", role: "button", "aria-label": t("gallery.open") },
        on: {
          click: () => open(items, index),
          keydown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              open(items, index);
            }
          }
        }
      }, [img]);
      const captionText = loc(item.caption, lang);
      if (captionText) figure.append(el("figcaption", { text: captionText }));
      grid.append(figure);
    });
    return grid.children.length ? grid : null;
  }

  SL.gallery = { buildGallery, open };
})(window.SL);
