
window.SL = window.SL || {};

(function (SL) {
  "use strict";

  
  function initReveal() {
    const nodes = SL.utils.$$(".reveal:not(.is-visible)");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    let fired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        fired = true;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    nodes.forEach((node) => {
      
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
        node.classList.add("is-visible");
      } else {
        observer.observe(node);
      }
    });
    
    setTimeout(() => {
      if (!fired) nodes.forEach((node) => node.classList.add("is-visible"));
    }, 1500);
  }
  SL.initReveal = initReveal;

  
  function initTilt() {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    document.addEventListener("pointermove", (event) => {
      const card = event.target.closest && event.target.closest("[data-tilt]");
      SL.utils.$$("[data-tilt].is-tilting").forEach((node) => {
        if (node !== card) {
          node.classList.remove("is-tilting");
          node.style.transform = "";
        }
      });
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.classList.add("is-tilting");
      card.style.transform =
        "perspective(900px) rotateY(" + (x * 4).toFixed(2) + "deg) rotateX(" + (-y * 4).toFixed(2) + "deg) translateY(-8px)";
    });
    document.addEventListener("pointerleave", () => {
      SL.utils.$$("[data-tilt].is-tilting").forEach((node) => {
        node.classList.remove("is-tilting");
        node.style.transform = "";
      });
    }, true);
  }

  async function boot(pageName) {
    SL.settings.init();

    let manifest;
    try {
      manifest = await SL.data.loadManifest();
    } catch (err) {
      console.error(err);
      showFatalError();
      return;
    }
    SL.manifest = manifest;

    try {
      await SL.i18n.init(manifest, SL.settings.lang);
    } catch (err) {
      console.error(err);
    }

    
    let groupStatus = null;
    try {
      const group = await SL.data.loadGroup();
      groupStatus = group && group.status;
      SL.groupData = group;
    } catch (err) {
      console.warn("[STUDENT LIFE] Данные общей карточки не загружены.", err);
    }

    const activeMap = { hub: "hub", home: "home", character: "characters", group: "group" };
    document.body.prepend(SL.components.renderHeader(activeMap[pageName] || "home", groupStatus));
    document.body.append(SL.components.renderFooter());
    SL.i18n.applyStatic(document);

    initTilt();

    
    const page = SL.pages && SL.pages[pageName];
    if (page && typeof page.init === "function") {
      try {
        await page.init({ manifest });
      } catch (err) {
        console.error("[STUDENT LIFE] Ошибка инициализации страницы:", err);
      }
    }

    initReveal();
  }

  function showFatalError() {
    const box = SL.components.pageError(
      "Не удалось загрузить данные сайта. Убедитесь, что сайт открыт через локальный HTTP-сервер (см. README), а не двойным щелчком по файлу.",
      "#"
    );
    document.body.append(box);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const pageName = document.body.dataset.page || "home";
    boot(pageName);
  });
})(window.SL);
