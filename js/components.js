
window.SL = window.SL || {};

(function (SL) {
  "use strict";
  const { el, icon, loc, locList, formatDate, safeUrl } = SL.utils;

  
  function renderHeader(activePage, groupStatus) {
    const t = SL.i18n.t;
    const isHub = activePage === "hub";
    
    const header = el("header", { class: "site-header" });
    const inner = el("div", { class: "container site-header__inner" });

    const logoLabel = isHub ? "UNIVERSE" : "STUDENT LIFE";
    const logoMark = isHub ? "U" : "SL";
    
    const logo = el("a", { class: "logo", attrs: { href: "hub.html", "aria-label": logoLabel } }, [
      el("span", { class: "logo__mark", text: logoMark, attrs: { "aria-hidden": "true" } }),
      el("span", { class: "logo__text", text: logoLabel })
    ]);

    const nav = el("nav", { class: "main-nav", attrs: { "aria-label": "Main" } });
    let links = [];
    
    if (!isHub) {
      links = [
        { page: "hub", href: "hub.html", label: t("navigation.hub") },
        { page: "home", href: "index.html", label: t("navigation.home") },
        { page: "characters", href: "index.html#catalog", label: t("navigation.characters") },
        { page: "about", href: "index.html#about", label: t("navigation.about") },
        { page: "group", href: "group.html", label: t("navigation.group"), badge: groupStatus === "coming-soon" ? t("status.coming-soon") : null }
      ];
    }
    
    links.push({ page: "discord", href: "https://discord.gg/vDgBmFQyg", label: t("navigation.discord"), external: true });

    links.forEach((link) => {
      const a = el("a", { attrs: { href: link.href } });
      
      if (link.page === "discord") {
        a.style.display = "inline-flex";
        a.style.alignItems = "center";
        a.style.gap = "0.4em";
        a.append(icon("discord"));
      }
      
      a.append(el("span", { text: link.label }));
      
      if (link.external) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
      if (link.page === activePage) a.setAttribute("aria-current", "page");
      if (link.badge) a.append(el("span", { class: "nav-badge", text: link.badge }));
      nav.append(a);
    });

    const actions = el("div", { class: "header-actions" }, [
      el("button", {
        class: "icon-btn",
        attrs: { type: "button", "aria-label": t("navigation.settings"), title: t("navigation.settings") },
        on: { click: () => SL.settings.openPanel() }
      }, [icon("settings")]),
      el("button", {
        class: "icon-btn burger",
        attrs: { type: "button", "aria-label": t("navigation.openMenu"), "aria-expanded": "false" },
        on: { click: () => openMobileNav(isHub) }
      }, [icon("menu")])
    ]);

    inner.append(logo, nav, actions);
    header.append(inner);
    return header;
  }

  let mobileNav = null;
  function openMobileNav(isHub) {
    const t = SL.i18n.t;
    if (mobileNav) {
      mobileNav.remove();
      mobileNav = null;
    }
    
    if (!mobileNav) {
      mobileNav = el("nav", { class: "mobile-nav", attrs: { "aria-label": "Mobile" } });
      const closeBtn = el("button", {
        class: "icon-btn mobile-nav__close",
        attrs: { type: "button", "aria-label": t("navigation.closeMenu") },
        on: { click: closeMobileNav }
      }, [icon("close")]);
      mobileNav.append(closeBtn);
      
      let links = [];
      if (!isHub) {
        links = [
          { href: "hub.html", key: "navigation.hub" },
          { href: "index.html", key: "navigation.home" },
          { href: "index.html#catalog", key: "navigation.characters" },
          { href: "index.html#about", key: "navigation.about" },
          { href: "group.html", key: "navigation.group" }
        ];
      }
      links.push({ href: "https://discord.gg/vDgBmFQyg", key: "navigation.discord", external: true });
      
      links.forEach((link) => {
        const a = el("a", { attrs: { href: link.href } });
        
        if (link.key === "navigation.discord") {
          a.style.display = "flex";
          a.style.alignItems = "center";
          a.style.gap = "0.5rem";
          a.append(icon("discord"));
        }
        
        a.append(el("span", { dataset: { i18nKey: link.key }, text: t(link.key) }));
        
        if (link.external) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
        a.addEventListener("click", closeMobileNav);
        mobileNav.append(a);
      });
      
      const settingsBtn = el("button", {
        class: "btn btn--primary",
        attrs: { type: "button" },
        dataset: { i18nKey: "navigation.settings" },
        text: t("navigation.settings"),
        on: { click: () => { closeMobileNav(); SL.settings.openPanel(); } }
      });
      settingsBtn.style.marginTop = "1.6rem";
      mobileNav.append(settingsBtn);
      document.body.append(mobileNav);
    }
    mobileNav.classList.add("is-open");
    document.body.classList.add("no-scroll");
  }
  
  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
  }
  
  document.addEventListener("sl:langchange", () => {
    if (!mobileNav) return;
    SL.utils.$$("[data-i18n-key]", mobileNav).forEach((node) => {
      node.textContent = SL.i18n.t(node.dataset.i18nKey);
    });
  });

  
  function renderFooter() {
    const t = SL.i18n.t;
    const isHub = document.body.dataset.page === "hub";
    const footer = el("footer", { class: "site-footer" });
    
    const inner = el("div", { 
      class: "container site-footer__inner", 
      attrs: isHub ? { style: "grid-template-columns: 1fr;" } : {} 
    });

    let logo;
    if (isHub) {
      logo = el("a", { class: "logo site-footer__logo", attrs: { href: "hub.html" } }, [
        el("span", { class: "logo__mark", text: "U", attrs: { "aria-hidden": "true" } }),
        el("span", { class: "logo__text", text: "UNIVERSE" })
      ]);
    } else {
      logo = el("a", { class: "logo site-footer__logo", attrs: { href: "hub.html" } }, [
        el("span", { class: "logo__mark", text: "SL", attrs: { "aria-hidden": "true" } }),
        (() => {
          const text = el("span", { class: "logo__text", text: "STUDENT " });
          text.append(el("span", { text: "LIFE" }));
          return text;
        })()
      ]);
    }

    const left = el("div", {}, [
      logo,
      el("p", { 
        class: "site-footer__note", 
        dataset: { i18n: isHub ? "footer.hubNote" : "footer.note" }, 
        text: t(isHub ? "footer.hubNote" : "footer.note") 
      })
    ]);

    inner.append(left);

    if (!isHub) {
      const rightCol = el("aside", { class: "footer-note-card" }, [
        el("strong", { dataset: { i18n: "footer.scheduleTitle" }, text: t("footer.scheduleTitle") }),
        el("span", { dataset: { i18n: "footer.scheduleItems" }, text: t("footer.scheduleItems") })
      ]);
      inner.append(rightCol);
    }

    const bottomLeftText = isHub ? "STUDENT LIFE UNIVERSE · 2026" : "STUDENT LIFE · 2026";
    const bottom = el("div", { class: "container site-footer__bottom" }, [
      el("span", { text: bottomLeftText })
    ]);

    if (!isHub) {
      bottom.append(el("span", { dataset: { i18n: "site.seriesDates" }, text: t("site.seriesDates") }));
    }

    footer.append(inner, bottom);
    return footer;
  }

  
  function statusBadge(status) {
    const t = SL.i18n.t;
    if (status === "available") {
      return el("span", { class: "badge badge--available", text: t("status.available") });
    }
    if (status === "under-review") {
      return el("span", { class: "badge badge--review", text: t("status.under-review") });
    }
    return el("span", { class: "badge badge--coming", text: t("status.coming-soon") });
  }

  
  function characterCard(character) {
    const t = SL.i18n.t;
    const isAvailable = character.status === "available";
    const pageUrl = "character.html?id=" + encodeURIComponent(character.id);
    const prefix = `content.characters.${character.id}.`;

    const card = el("article", {
      class: "char-card" + (isAvailable ? "" : " char-card--soon"),
      dataset: { id: character.id }
    });
    if (character.accent) card.style.setProperty("--card-accent", character.accent);

    
    const cover = el("div", { class: "char-card__cover" });
    if (character.cover) {
      const img = el("img", {
        attrs: {
          src: character.cover,
          alt: t(prefix + "coverAlt") || t(prefix + "name"),
          loading: "lazy"
        }
      });
      img.addEventListener("error", () => {
        img.remove();
        cover.append(coverPlaceholder());
      });
      cover.append(img);
    } else {
      cover.append(coverPlaceholder());
    }

    
    const tags = t(prefix + "tags") || [];
    const is18Plus = tags.includes("18+");
    
    cover.append(
      el("div", { class: "char-card__top-badges" }, [
        el("span", { class: "char-card__number", text: "№" + (character.number || "?") }),
        is18Plus ? el("span", { class: "badge--18", text: "18+" }) : null
      ]),
      el("span", { class: "char-card__status" }, [statusBadge(character.status)])
    );

    
    const cleanTags = tags.filter(tag => tag !== "18+");
    const body = el("div", { class: "char-card__body" }, [
      el("h3", { class: "char-card__name", text: t(prefix + "name") }),
      el("p", { class: "char-card__slogan", text: t(prefix + "slogan") }),
      el("div", { class: "char-card__tags" },
        cleanTags.slice(0, 4).map((tag) => el("span", { class: "tag", text: tag }))
      )
    ]);

    
    const overlayChildren = [
      el("p", { class: "char-card__overlay-text", text: t(prefix + "shortDescription") })
    ];
    if (isAvailable) {
      overlayChildren.push(
        el("a", { class: "btn btn--primary", attrs: { href: pageUrl } }, [
          el("span", { text: t("actions.discover") }),
          icon("arrowRight")
        ])
      );
    } else if (character.status === "under-review") {
       overlayChildren.push(
        el("span", { class: "badge badge--review", text: t("status.under-review") })
      );
    } else {
      const date = formatDate(character.releaseDate, SL.i18n.lang);
      overlayChildren.push(
        el("span", { class: "badge badge--coming", text: t("status.releaseOn") + (date ? ": " + date : "") })
      );
    }
    const overlay = el("div", { class: "char-card__overlay" }, overlayChildren);

    card.append(cover, body, overlay);

    if (isAvailable) {
      card.style.cursor = "pointer";
      card.addEventListener("click", (event) => {
        if (event.target.closest("a, button")) return;
        window.location.href = pageUrl;
      });
      card.tabIndex = 0;
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", t(prefix + "name") + " — " + t("actions.openPage"));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && event.target === card) window.location.href = pageUrl;
      });
    }
    return card;
  }

  function coverPlaceholder() {
    const wrap = el("div", { class: "char-card__cover-placeholder" }, [
      icon("image"),
      el("span", { text: SL.i18n.t("errors.imageMissing") })
    ]);
    wrap.style.display = "grid";
    wrap.style.placeItems = "center";
    wrap.style.height = "100%";
    return wrap;
  }

  
  function relationCard(relation, charactersById) {
    const target = charactersById[relation.characterId];
    if (!target) return null;
    const href = "character.html?id=" + encodeURIComponent(target.id);

    const avatar = el("span", { class: "relation-card__avatar" });
    if (target.cover) {
      const img = el("img", { attrs: { src: target.cover, alt: "", loading: "lazy" } });
      img.addEventListener("error", () => img.remove());
      avatar.append(img);
    }
    const a = el("a", { class: "relation-card", attrs: { href } }, [
      avatar,
      el("span", {}, [
        el("span", { class: "relation-card__type", text: relation.type }),
        el("div", { class: "relation-card__name", text: SL.i18n.t(`content.characters.${target.id}.name`) }),
        el("p", { class: "relation-card__desc", text: relation.description })
      ])
    ]);
    return a;
  }

  
  function chatButton(url, labelKey, large) {
    const t = SL.i18n.t;
    const valid = safeUrl(url);
    const cls = "btn btn--primary" + (large ? " btn--lg" : "");
    if (!valid) {
      return el("span", {
        class: cls + " btn--disabled",
        attrs: { role: "button", "aria-disabled": "true", title: t("actions.chatUnavailable") }
      }, [icon("chat"), el("span", { text: t("actions.chatUnavailable") })]);
    }
    return el("a", { class: cls, attrs: { href: valid, target: "_blank", rel: "noopener noreferrer" } }, [
      icon("chat"),
      el("span", { text: t(labelKey || "actions.startChat") })
    ]);
  }

  
  function emptyState(iconName, text) {
    return el("div", { class: "empty-state" }, [icon(iconName), el("p", { text })]);
  }

  
  function pageLoading() {
    return el("div", { class: "page-state" }, [
      el("div", { class: "page-state__box" }, [
        el("div", { class: "loader", attrs: { role: "status", "aria-label": "Loading" } })
      ])
    ]);
  }
  
  function pageError(message, backHref) {
    const t = SL.i18n.t;
    return el("div", { class: "page-state" }, [
      el("div", { class: "page-state__box" }, [
        icon("image"),
        el("p", { class: "lead", text: message }),
        el("a", { class: "btn btn--ghost", attrs: { href: backHref || "index.html" } }, [
          icon("arrowLeft"),
          el("span", { text: t("actions.backHome") })
        ])
      ])
    ]);
  }

  SL.components = {
    renderHeader,
    renderFooter,
    statusBadge,
    characterCard,
    relationCard,
    chatButton,
    emptyState,
    pageLoading,
    pageError
  };
})(window.SL);