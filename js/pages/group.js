
window.SL = window.SL || {};
SL.pages = SL.pages || {};

(function (SL) {
  "use strict";
  const { el, icon, formatDate } = SL.utils;

  let groupData = null;
  let characters = [];
  let mainEl = null;

  async function init() {
    mainEl = document.getElementById("group-main");
    if (!mainEl) return;
    mainEl.append(SL.components.pageLoading());

    try {
      characters = await SL.data.loadAllCharacters();
      groupData = SL.groupData || (await SL.data.loadGroup());
    } catch (err) {
      console.error(err);
      groupData = null;
    }

    render();
    document.addEventListener("sl:langchange", render);
  }

  function render() {
    const t = SL.i18n.t;
    mainEl.textContent = "";

    if (!groupData) {
      mainEl.append(SL.components.pageError(t("errors.dataLoad"), "index.html"));
      return;
    }

    document.title = t("content.group.title") + " — STUDENT LIFE";

    mainEl.append(renderHero(), renderMembers(), renderFinal());
    SL.i18n.applyStatic(mainEl);
    SL.initReveal();
  }

  function renderHero() {
    const t = SL.i18n.t;
    const lang = SL.i18n.lang;
    const isAvailable = groupData.status === "available";

    const back = el("a", { class: "char-hero__back", attrs: { href: "index.html" } }, [
      icon("arrowLeft"),
      el("span", { text: t("actions.backHome") })
    ]);

    const head = el("div", { class: "reveal" }, [
      el("span", { class: "kicker", text: t("navigation.group") }),
      el("h1", { class: "h-display", text: t("content.group.title") }),
      el("p", { class: "lead", text: t("content.group.subtitle"), attrs: { style: "margin-top:.6rem" } }),
      el("p", { class: "lead", text: t("content.group.description"), attrs: { style: "margin-top:1rem" } })
    ]);

    const section = el("section", { class: "group-hero container" }, [back, head]);

    const cover = el("div", { class: "group-hero__cover reveal" });
    if (groupData.cover) {
      const img = el("img", { attrs: { src: groupData.cover, alt: t("content.group.coverAlt") || "" } });
      img.addEventListener("error", () => cover.remove());
      cover.append(img);
    }
    cover.append(
      el("div", { class: "group-hero__overlay" }, [
        SL.components.statusBadge(groupData.status),
        el("div", { class: "group-hero__overlay-title", text: t("group.releaseLabel") + ": " + formatDate(groupData.releaseDate, lang) })
      ])
    );
    section.append(cover);

    if (!isAvailable) {
      section.append(el("p", { class: "group-coming reveal", text: t("group.comingText") }));
    }
    return section;
  }

  function renderMembers() {
    const t = SL.i18n.t;

    const grid = el("div", { class: "char-grid" });
    
    // Убираем фильтр c.status === "available", выводим всех
    characters
      .slice()
      .sort((a, b) => (a.number || 99) - (b.number || 99))
      .forEach((character) => {
        if (character.id !== "group") {
          grid.append(SL.components.characterCard(character));
        }
      });

    return el("section", { class: "section container" }, [
      el("div", { class: "section-head reveal" }, [
        el("div", {}, [
          el("span", { class: "kicker", text: "STUDENT LIFE" }),
          el("h2", { class: "h-section", text: t("group.membersTitle") }),
          el("p", { text: t("group.membersText") })
        ])
      ]),
      grid
    ]);
  }

  function renderFinal() {
    const t = SL.i18n.t;
    return el("section", { class: "container" }, [
      el("div", { class: "char-final reveal" }, [
        el("h2", { text: t("content.group.subtitle") }),
        el("p", { text: t("content.group.description") }),
        el("div", { class: "char-final__actions" }, [
          SL.components.chatButton(groupData.chatUrl, "actions.startChatGroup", true),
          el("a", { class: "btn btn--ghost btn--lg", attrs: { href: "index.html#catalog" } }, [
            icon("arrowLeft"),
            el("span", { text: t("actions.back") })
          ])
        ])
      ])
    ]);
  }

  SL.pages.group = { init };
})(window.SL);