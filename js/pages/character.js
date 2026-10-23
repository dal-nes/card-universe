
window.SL = window.SL || {};
SL.pages = SL.pages || {};

(function (SL) {
  "use strict";
  const { el, icon, formatDate } = SL.utils;

  let character = null;
  let charactersById = {};
  let mainEl = null;

  async function init() {
    mainEl = document.getElementById("character-main");
    if (!mainEl) return;

    const id = new URLSearchParams(window.location.search).get("id");
    mainEl.append(SL.components.pageLoading());

    try {
      const all = await SL.data.loadAllCharacters();
      all.forEach((item) => (charactersById[item.id] = item));
      character = id ? charactersById[id] || null : null;
    } catch (err) {
      console.error(err);
      character = null;
    }

    render();
    document.addEventListener("sl:langchange", render);
  }

  function render() {
    const t = SL.i18n.t;
    mainEl.textContent = "";

    if (!character) {
      mainEl.append(SL.components.pageError(t("character.notFound"), "index.html#catalog"));
      return;
    }
    if (character.accent) document.body.style.setProperty("--card-accent", character.accent);

    const prefix = `content.characters.${character.id}.`;
    document.title = t(prefix + "cardTitle") + " — STUDENT LIFE";

    mainEl.append(
      renderHero(prefix),
      renderBio(prefix),
      renderGallery(prefix),
      renderMusic(),
      renderRelations(prefix),
      renderFinal(prefix)
    );
    SL.i18n.applyStatic(mainEl);
    SL.initReveal();
  }

  function renderHero(prefix) {
    const t = SL.i18n.t;
    const back = el("a", { class: "char-hero__back", attrs: { href: "index.html#catalog" } }, [
      icon("arrowLeft"),
      el("span", { text: t("actions.back") })
    ]);

    const coverBox = el("div", { class: "char-hero__cover reveal" });
    
    // --- ЛОГИКА КАРУСЕЛИ ОБЛОЖЕК ---
    if (character.covers && character.covers.length > 0) {
      const wrapper = el("div", { class: "cover-carousel-wrapper" });
      const carousel = el("div", { class: "cover-carousel" });
      
      character.covers.forEach((src) => {
        const img = el("img", { attrs: { src: src, alt: t(prefix + "coverAlt") } });
        img.addEventListener("error", () => {
           img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='3'/%3E%3Cpath d='m21 15-5-5L5 21'/%3E%3C/svg%3E";
        });
        carousel.append(img);
      });
      wrapper.append(carousel);

      // Добавляем точки-индикаторы, если обложек больше одной
      if (character.covers.length > 1) {
        const dotsContainer = el("div", { class: "cover-carousel-dots" });
        const dots = character.covers.map((_, i) => {
          const dot = el("button", { 
            attrs: { type: "button", "aria-label": "Перейти к обложке " + (i + 1) },
            class: i === 0 ? "is-active" : ""
          });
          dot.addEventListener("click", () => {
            const scrollAmount = carousel.clientWidth * i;
            carousel.scrollTo({ left: scrollAmount, behavior: "smooth" });
          });
          dotsContainer.append(dot);
          return dot;
        });

        // Обновляем активную точку при скролле
        carousel.addEventListener("scroll", () => {
          const index = Math.round(carousel.scrollLeft / carousel.clientWidth);
          dots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === index);
          });
        });
        wrapper.append(dotsContainer);
      }
      coverBox.append(wrapper);
    } else if (character.cover) {
      // Старый вариант для Юны и Рин (одна обложка)
      const img = el("img", { attrs: { src: character.cover, alt: t(prefix + "coverAlt") } });
      img.addEventListener("error", () => {
        coverBox.textContent = "";
        coverBox.append(SL.components.emptyState("image", t("errors.imageMissing")));
      });
      coverBox.append(img);
    }

    const tags = t(prefix + "tags") || [];
    const is18Plus = tags.includes("18+");
    
    const number = el("span", { class: "char-hero__number" }, [
      SL.components.statusBadge(character.status),
      el("span", { class: "badge badge--coming", text: t("character.cardNumber") + (character.number || "?") }),
      is18Plus ? el("span", { class: "badge--18", text: "18+" }) : null
    ]);

    const facts = el("dl", { class: "char-hero__facts" });
    const enFacts = t(prefix + "facts") || [];
    enFacts.forEach((fact) => {
      facts.append(
        el("div", { class: "fact" }, [
          el("dt", { text: fact.label }),
          el("dd", { text: fact.value })
        ])
      );
    });

    const cleanTags = tags.filter(tag => tag !== "18+");

    const content = el("div", { class: "char-hero__content reveal" }, [
      number,
      el("h1", { class: "char-hero__name", text: t(prefix + "name") }),
      el("p", { class: "char-hero__cardtitle", text: t(prefix + "cardTitle") }),
      el("p", { class: "char-hero__slogan", text: t(prefix + "slogan") }),
      el("div", { class: "char-hero__tags" },
        cleanTags.map((tag) => el("span", { class: "tag", text: tag }))
      ),
      el("div", { class: "char-hero__cta" }, [
        SL.components.chatButton(character.chatUrl, "actions.startChat", true)
      ]),
      facts
    ]);

    if (character.status === "under-review") {
      content.insertBefore(
        el("div", { 
          class: "alert--warning", 
          text: t("status.under-review") + ". " + (SL.i18n.lang === "ru" ? "Карточка временно недоступна для полного просмотра." : "The card is temporarily unavailable for full viewing.") 
        }),
        content.firstChild.nextSibling
      );
    }

    return el("section", { class: "char-hero container" }, [
      back,
      el("div", { class: "char-hero__grid" }, [coverBox, content])
    ]);
  }

  function renderBio(prefix) {
    const t = SL.i18n.t;
    if (character.status === "under-review") return el("span"); 

    const sections = t(prefix + "sections") || [];
    const quoteText = t(prefix + "quote.text");
    
    if (!sections.length && !quoteText) return el("span");

    const grid = el("div", { class: "bio-grid" });
    sections.forEach((section) => {
      const card = el("article", { class: "bio-card reveal" });
      card.style.setProperty("--card-accent", character.accent || "var(--accent)");
      card.append(el("h3", { text: section.title }));
      section.paragraphs.forEach((text) => card.append(el("p", { text })));
      grid.append(card);
    });

    const children = [
      el("div", { class: "section-head reveal" }, [
        el("div", {}, [
          el("span", { class: "kicker", text: t(prefix + "name") }),
          el("h2", { class: "h-section", text: t("character.aboutTitle") })
        ])
      ]),
      grid
    ];

    if (quoteText) {
      const quote = el("blockquote", { class: "char-quote reveal", text: quoteText });
      quote.style.setProperty("--card-accent", character.accent || "var(--accent)");
      children.push(quote);
    }

    return el("section", { class: "section container" }, children);
  }

  function renderGallery(prefix) {
    const t = SL.i18n.t;
    if (character.status === "under-review") return el("span");

    const section = el("section", { class: "section container" }, [
      el("div", { class: "section-head reveal" }, [
        el("div", {}, [
          el("span", { class: "kicker", text: "STUDENT LIFE" }),
          el("h2", { class: "h-section", text: t("character.galleryTitle") })
        ])
      ])
    ]);
    
    const enGallery = t(prefix + "gallery") || [];
    const galleryItems = character.gallery.map((item, i) => ({
      ...item,
      ...(enGallery[i] || {})
    }));

    const grid = SL.gallery.buildGallery(galleryItems);
    section.append(
      grid || SL.components.emptyState("image", t("character.galleryEmpty"))
    );
    return section;
  }

  function renderMusic() {
    const t = SL.i18n.t;
    if (character.status === "under-review") return el("span");
    
    const section = el("section", { class: "section container" }, [
      el("div", { class: "section-head reveal" }, [
        el("div", {}, [
          el("span", { class: "kicker", text: "STUDENT LIFE" }),
          el("h2", { class: "h-section", text: t("character.musicTitle") })
        ])
      ])
    ]);
    
    const enTracks = t("content.characters." + character.id + ".tracks") || [];
    const tracks = (character.tracks || []).map((track, i) => {
      const locTrack = (Array.isArray(enTracks) && enTracks[i]) ? enTracks[i] : {};
      return {
        ...track,
        title: locTrack.title || track.title,
        artist: locTrack.artist || track.artist,
        lyrics: locTrack.lyrics || "",
        description: locTrack.description || ""
      };
    });

    const player = SL.audioPlayer.createPlayer(tracks);
    section.append(
      player ? player.element : SL.components.emptyState("music", t("character.musicEmpty"))
    );
    return section;
  }

  function renderRelations(prefix) {
    const t = SL.i18n.t;
    if (character.status === "under-review") return el("span");
    
    const enRelations = t(prefix + "relationships") || [];
    const cards = enRelations
      .map((relation, i) => {
        const baseRel = character.relationships[i] || {};
        return SL.components.relationCard({
          characterId: baseRel.characterId,
          type: relation.type,
          description: relation.description,
          name: relation.name,
          psychotype: relation.psychotype
        }, charactersById);
      })
      .filter(Boolean);
    if (!cards.length) return el("span");

    return el("section", { class: "section container" }, [
      el("div", { class: "section-head reveal" }, [
        el("div", {}, [
          el("span", { class: "kicker", text: "STUDENT LIFE" }),
          el("h2", { class: "h-section", text: t("character.relationsTitle") })
        ])
      ]),
      el("div", { class: "relations-grid" }, cards)
    ]);
  }

  function renderFinal(prefix) {
    const t = SL.i18n.t;
    if (character.status === "under-review") return el("span");
    
    const actions = [SL.components.chatButton(character.chatUrl, "actions.startChat", true)];
    if (SL.groupData) {
      actions.push(
        el("a", { class: "btn btn--ghost btn--lg", attrs: { href: "group.html" } }, [
          icon("users"),
          el("span", { text: t("navigation.group") })
        ])
      );
    }

    return el("section", { class: "container" }, [
      el("div", { class: "char-final reveal" }, [
        el("h2", { text: t("character.finalTitle") }),
        el("p", { text: t(prefix + "shortDescription") || t("character.finalText") }),
        el("div", { class: "char-final__actions" }, actions)
      ])
    ]);
  }

  SL.pages.character = { init };
})(window.SL);