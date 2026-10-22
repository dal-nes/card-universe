
window.SL = window.SL || {};
SL.pages = SL.pages || {};

(function (SL) {
  "use strict";
  const { el, icon, formatDate } = SL.utils;

  let characters = [];
  let groupData = null;

  async function init() {
    try {
      characters = await SL.data.loadAllCharacters();
    } catch (err) {
      console.error(err);
      characters = [];
    }
    groupData = SL.groupData || null;
    render();
    document.addEventListener("sl:langchange", render);
  }

  function render() {
    renderHero();
    renderCatalog();
    renderTimeline();
    renderGroupTeaser();
    SL.i18n.applyStatic(document);
    SL.initReveal();
  }

  function renderHero() {
    const t = SL.i18n.t;
    const lang = SL.i18n.lang;
    const mount = document.getElementById("hero");
    if (!mount) return;
    mount.textContent = "";

    const available = characters.filter((c) => c.status === "available");

    const wordmark = el("h1", { class: "hero__wordmark" });
    wordmark.append(el("span", { text: "STUDENT" }), document.createTextNode(" "), el("span", { class: "accent", text: "LIFE" }));

    const left = el("div", {}, [
      el("span", { class: "kicker", text: t("home.heroKicker") }),
      wordmark,
      el("p", { class: "hero__subtitle", text: t("home.heroSubtitle") }),
      el("p", { class: "hero__text lead", text: t("home.heroText") }),
      el("span", { class: "hero__dates" }, [
        icon("calendar"),
        el("span", { text: t("site.seriesDates") })
      ]),
      el("div", { class: "hero__cta" }, [
        el("a", { class: "btn btn--primary btn--lg", attrs: { href: "#catalog" } }, [
          el("span", { text: t("actions.toCatalog") }),
          icon("arrowRight")
        ]),
        el("a", { class: "btn btn--ghost btn--lg", attrs: { href: "#about" } }, [
          el("span", { text: t("actions.aboutSeries") })
        ])
      ])
    ]);

    const stats = el("div", { class: "series-stats" }, [
      stat(String(characters.length + 1), t("home.charactersCount")),
      stat(String(available.length), t("home.availableCount")),
      stat(formatDate((SL.manifest.series || {}).endDate, lang), t("status.releaseOn") + " · " + t("navigation.group"))
    ]);
    left.append(stats);

    const visual = el("div", { class: "hero__visual", attrs: { "aria-hidden": "true" } });
    const featured = characters.filter((c) => c.cover).slice(0, 2);
    featured.forEach((character, index) => {
      const fig = el("figure", { class: "hero-card hero-card--" + (index === 0 ? "a" : "b") });
      const img = el("img", { attrs: { src: character.cover, alt: "", loading: "eager" } });
      img.addEventListener("error", () => fig.remove());
      const prefix = `content.characters.${character.id}.`;
      fig.append(img, el("figcaption", { text: "№" + character.number + " · " + t(prefix + "name") }));
      visual.append(fig);
    });
    visual.append(el("div", { class: "hero__sticker", text: t("footer.scheduleItems").split("·")[0].trim() + " ✎" }));

    mount.append(el("div", { class: "hero__grid" }, [left, visual]));
  }

  function stat(value, label) {
    return el("div", { class: "series-stat" }, [
      el("div", { class: "series-stat__value", text: value }),
      el("div", { class: "series-stat__label", text: label })
    ]);
  }

  function renderCatalog() {
    const t = SL.i18n.t;
    const mount = document.getElementById("catalog-grid");
    if (!mount) return;
    mount.textContent = "";

    if (!characters.length) {
      mount.append(SL.components.emptyState("image", t("errors.dataLoad")));
      return;
    }

    const grid = el("div", { class: "char-grid" });
    characters
      .slice()
      .sort((a, b) => (a.number || 99) - (b.number || 99))
      .forEach((character) => {
        const card = SL.components.characterCard(character);
        card.setAttribute("data-tilt", "");
        grid.append(card);
      });

    if (groupData && groupData.status !== "available") {
      grid.append(groupComingCard());
    }
    mount.append(grid);
  }

  function groupComingCard() {
    const t = SL.i18n.t;
    const lang = SL.i18n.lang;
    const card = el("article", { class: "char-card char-card--soon" });
    const cover = el("div", { class: "char-card__cover" }, [
      el("div", { class: "char-card__cover-placeholder" }, [
        icon("users"),
        el("span", { text: t("content.group.subtitle") })
      ]),
      el("span", { class: "char-card__number", text: "∞" }),
      el("span", { class: "char-card__status" }, [SL.components.statusBadge("coming-soon")])
    ]);
    const body = el("div", { class: "char-card__body" }, [
      el("h3", { class: "char-card__name", text: t("content.group.title") }),
      el("p", { class: "char-card__slogan", text: t("status.releaseOn") + ": " + formatDate(groupData.releaseDate, lang) })
    ]);
    const overlay = el("div", { class: "char-card__overlay" }, [
      el("p", { class: "char-card__overlay-text", text: t("content.group.description") }),
      el("a", { class: "btn btn--ghost", attrs: { href: "group.html" } }, [
        el("span", { text: t("actions.openPage") }),
        icon("arrowRight")
      ])
    ]);
    card.append(cover, body, overlay);
    return card;
  }

  function renderTimeline() {
    const t = SL.i18n.t;
    const lang = SL.i18n.lang;
    const mount = document.getElementById("timeline");
    const toggleBtn = document.getElementById("timeline-toggle");
    if (!mount) return;

    const wasExpanded = toggleBtn && toggleBtn.getAttribute("aria-expanded") === "true";
    mount.textContent = "";
    mount.style.maxHeight = "0px";

    const wrap = el("div", { class: "timeline" });
    characters
      .slice()
      .sort((a, b) => String(a.releaseDate).localeCompare(String(b.releaseDate)))
      .forEach((character) => {
        const prefix = `content.characters.${character.id}.`;
        wrap.append(
          el("div", { class: "timeline-item" }, [
            el("span", { class: "timeline-item__date", text: formatDate(character.releaseDate, lang) }),
            el("span", { class: "timeline-item__title", text: t(prefix + "cardTitle") }),
            el("span", { class: "timeline-item__note", text: t(prefix + "slogan") })
          ])
        );
      });
    if (groupData) {
      wrap.append(
        el("div", { class: "timeline-item" }, [
          el("span", { class: "timeline-item__date", text: formatDate(groupData.releaseDate, lang) }),
          el("span", { class: "timeline-item__title", text: t("content.group.title") }),
          el("span", { class: "timeline-item__note", text: t("home.groupTeaserText") })
        ])
      );
    }
    mount.append(wrap);

    if (toggleBtn) {
      const textSpan = toggleBtn.querySelector("span");
      if (wasExpanded) {
        toggleBtn.setAttribute("aria-expanded", "true");
        mount.classList.add("is-expanded");
        requestAnimationFrame(() => { mount.style.maxHeight = mount.scrollHeight + "px"; });
        if (textSpan) textSpan.textContent = t("home.timelineCollapse");
      } else {
        toggleBtn.setAttribute("aria-expanded", "false");
        mount.classList.remove("is-expanded");
        if (textSpan) textSpan.textContent = t("home.timelineExpand");
      }
      toggleBtn.onclick = () => {
        const isExp = toggleBtn.getAttribute("aria-expanded") === "true";
        if (isExp) {
          toggleBtn.setAttribute("aria-expanded", "false");
          mount.style.maxHeight = "0px";
          mount.classList.remove("is-expanded");
          if (textSpan) textSpan.textContent = t("home.timelineExpand");
        } else {
          toggleBtn.setAttribute("aria-expanded", "true");
          mount.classList.add("is-expanded");
          mount.style.maxHeight = mount.scrollHeight + "px";
          if (textSpan) textSpan.textContent = t("home.timelineCollapse");
        }
      };
    }
  }

  function renderGroupTeaser() {
    const t = SL.i18n.t;
    const lang = SL.i18n.lang;
    const mount = document.getElementById("group-teaser");
    if (!mount) return;
    mount.textContent = "";
    if (!groupData) return;

    const cover = el("div", { class: "group-teaser__cover" });
    if (groupData.cover) {
      const img = el("img", { attrs: { src: groupData.cover, alt: t("content.group.coverAlt"), loading: "lazy" } });
      img.addEventListener("error", () => cover.remove());
      cover.append(img);
    }

    const content = el("div", { class: "group-teaser__content" }, [
      SL.components.statusBadge(groupData.status),
      el("h2", { class: "h-section", text: t("home.groupTeaserTitle") }),
      el("p", { class: "lead", text: t("home.groupTeaserText") }),
      el("span", { class: "group-teaser__date", text: t("status.releaseOn") + ": " + formatDate(groupData.releaseDate, lang) }),
      el("a", { class: "btn btn--primary", attrs: { href: "group.html" } }, [
        el("span", { text: t("home.groupTeaserButton") }),
        icon("arrowRight")
      ])
    ]);

    mount.append(el("div", { class: "group-teaser reveal" }, [cover, content]));
  }

  SL.pages.home = { init };
})(window.SL);