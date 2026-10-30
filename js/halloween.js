/* ============================================================
   HALLOWEEN OVERLAY — STUDENT LIFE
   Добавляет на все страницы праздничный слой: паутины по углам,
   пауков на нитях, светящиеся тыквы, летучих мышей, призрака
   и луну. Режим можно выключить кнопкой-тыквой (запоминается).
   ============================================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "sl-halloween-mode";

  /* ---------- SVG-спрайты ---------- */

  // Паутина для угла (рисуется из левого верхнего угла,
  // для остальных углов зеркалится через CSS transform)
  var WEB_SVG =
    '<svg class="hw-web__svg" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M0 0 L118 12"/>' +
      '<path d="M0 0 L108 62"/>' +
      '<path d="M0 0 L62 108"/>' +
      '<path d="M0 0 L12 118"/>' +
      '<path d="M26 3 Q20 20 3 26"/>' +
      '<path d="M52 6 Q42 42 6 52"/>' +
      '<path d="M79 9 Q64 64 9 79"/>' +
      '<path d="M106 12 Q86 86 12 106"/>' +
    "</svg>";

  // Паук
  var SPIDER_SVG =
    '<svg viewBox="0 0 64 72" fill="none" aria-hidden="true">' +
      '<g stroke="currentColor" stroke-width="3.4" stroke-linecap="round">' +
        '<path d="M28 34 C20 28 14 24 6 12"/>' +
        '<path d="M27 40 C18 38 10 38 3 32"/>' +
        '<path d="M27 46 C18 48 12 52 6 62"/>' +
        '<path d="M29 51 C23 56 20 60 17 69"/>' +
        '<path d="M36 34 C44 28 50 24 58 12"/>' +
        '<path d="M37 40 C46 38 54 38 61 32"/>' +
        '<path d="M37 46 C46 48 52 52 58 62"/>' +
        '<path d="M35 51 C41 56 44 60 47 69"/>' +
      "</g>" +
      '<ellipse cx="32" cy="46" rx="10.5" ry="13" fill="currentColor"/>' +
      '<circle cx="32" cy="30" r="7" fill="currentColor"/>' +
      '<circle cx="29.4" cy="28.6" r="1.9" fill="#ff5d5d"/>' +
      '<circle cx="34.6" cy="28.6" r="1.9" fill="#ff5d5d"/>' +
    "</svg>";

  // Тыква (классическая мордашка)
  function pumpkinSvg(variant) {
    var face;
    if (variant === "happy") {
      face =
        '<path d="M36 52 L50 52 L43 38 Z"/>' +
        '<path d="M70 52 L84 52 L77 38 Z"/>' +
        '<path d="M28 70 Q60 98 92 70 L84 66 L76 76 L66 68 L58 80 L50 68 L40 76 L34 66 Z"/>';
    } else if (variant === "spooky") {
      face =
        '<path d="M34 56 L52 48 L48 62 Z"/>' +
        '<path d="M86 56 L68 48 L72 62 Z"/>' +
        '<path d="M56 58 L60 68 L64 58 Z"/>' +
        '<path d="M30 74 Q60 62 90 74 L82 86 L72 74 L62 88 L52 74 L42 86 L36 74 Z"/>';
    } else {
      face =
        '<circle cx="43" cy="50" r="7"/>' +
        '<circle cx="77" cy="50" r="7"/>' +
        '<circle cx="43" cy="50" r="2.4" fill="#7a3c00" opacity="0.6"/>' +
        '<circle cx="77" cy="50" r="2.4" fill="#7a3c00" opacity="0.6"/>' +
        '<ellipse cx="60" cy="76" rx="12" ry="9"/>';
    }
    return (
      '<svg viewBox="0 0 120 112" aria-hidden="true">' +
        '<path d="M58 16 C58 8 64 3 72 4 C66 7 65 12 66 17 Z" fill="#5c7a3a"/>' +
        '<ellipse cx="60" cy="64" rx="48" ry="44" fill="#e8731a"/>' +
        '<ellipse cx="60" cy="64" rx="48" ry="44" fill="url(#hwPumpkinShade)"/>' +
        '<ellipse cx="34" cy="64" rx="15" ry="42" fill="#d9640f" opacity="0.55"/>' +
        '<ellipse cx="86" cy="64" rx="15" ry="42" fill="#d9640f" opacity="0.55"/>' +
        '<ellipse cx="60" cy="64" rx="13" ry="43" fill="#f08323"/>' +
        '<g class="hw-face">' + face + "</g>" +
        '<defs><radialGradient id="hwPumpkinShade" cx="0.5" cy="0.38" r="0.75">' +
          '<stop offset="0%" stop-color="#ffb35c" stop-opacity="0.55"/>' +
          '<stop offset="60%" stop-color="#ffb35c" stop-opacity="0"/>' +
        "</radialGradient></defs>" +
      "</svg>"
    );
  }

  // Летучая мышь
  var BAT_SVG =
    '<svg viewBox="0 0 110 60" aria-hidden="true">' +
      '<g fill="currentColor">' +
        '<path class="hw-wing-l" d="M52 30 C40 12 20 6 4 18 C11 21 13 27 9 33 C18 31 24 37 21 44 C32 40 44 38 52 40 Z"/>' +
        '<path class="hw-wing-r" d="M58 30 C70 12 90 6 106 18 C99 21 97 27 101 33 C92 31 86 37 89 44 C78 40 66 38 58 40 Z"/>' +
        '<ellipse cx="55" cy="36" rx="7.5" ry="10"/>' +
        '<circle cx="55" cy="26" r="6"/>' +
        '<path d="M50 22 L48 14 L54 20 Z"/>' +
        '<path d="M60 22 L62 14 L56 20 Z"/>' +
      "</g>" +
      '<circle cx="52.6" cy="25" r="1.4" fill="#ffb84d"/>' +
      '<circle cx="57.4" cy="25" r="1.4" fill="#ffb84d"/>' +
    "</svg>";

  // Призрак
  var GHOST_SVG =
    '<svg viewBox="0 0 70 84" aria-hidden="true">' +
      '<path d="M35 6 C17 6 8 22 8 40 L8 74 L16 66 L23 76 L30 66 L37 76 L44 66 L51 76 L58 66 L62 72 L62 40 C62 22 53 6 35 6 Z" fill="#f4f0ff" opacity="0.92"/>' +
      '<ellipse cx="26" cy="36" rx="4.6" ry="6.4" fill="#2c2140"/>' +
      '<ellipse cx="44" cy="36" rx="4.6" ry="6.4" fill="#2c2140"/>' +
      '<ellipse cx="35" cy="52" rx="5" ry="7" fill="#2c2140" opacity="0.85"/>' +
    "</svg>";

  /* ---------- Сборка слоя ---------- */

  function buildLayer() {
    var layer = document.createElement("div");
    layer.className = "hw-layer";
    layer.setAttribute("aria-hidden", "true");

    layer.innerHTML =
      '<div class="hw-vignette"></div>' +
      '<div class="hw-moon"></div>' +
      '<div class="hw-web hw-web--tl">' + WEB_SVG + "</div>" +
      '<div class="hw-web hw-web--tr">' + WEB_SVG + "</div>" +
      '<div class="hw-web hw-web--bl">' + WEB_SVG + "</div>" +
      '<div class="hw-web hw-web--br">' + WEB_SVG + "</div>" +
      '<div class="hw-spider hw-spider--left" style="--hw-thread: 120px">' +
        '<span class="hw-spider__thread"></span>' + SPIDER_SVG +
      "</div>" +
      '<div class="hw-spider hw-spider--right" style="--hw-thread: 84px">' +
        '<span class="hw-spider__thread"></span>' + SPIDER_SVG +
      "</div>" +
      '<div class="hw-pumpkin hw-pumpkin--left">' + pumpkinSvg("spooky") + "</div>" +
      '<div class="hw-pumpkin hw-pumpkin--left-small">' + pumpkinSvg("happy") + "</div>" +
      '<div class="hw-pumpkin hw-pumpkin--right">' + pumpkinSvg("surprised") + "</div>" +
      '<div class="hw-bat hw-bat--1">' + BAT_SVG + "</div>" +
      '<div class="hw-bat hw-bat--2">' + BAT_SVG + "</div>" +
      '<div class="hw-bat hw-bat--3">' + BAT_SVG + "</div>" +
      '<div class="hw-ghost">' + GHOST_SVG + "</div>";

    document.body.appendChild(layer);
    return layer;
  }

  /* ---------- Переключатель ---------- */

  function isEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "off";
    } catch (err) {
      return true;
    }
  }

  function saveState(on) {
    try {
      localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch (err) {
      /* приватный режим — просто не запоминаем */
    }
  }

  function init() {
    var layer = buildLayer();

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "hw-toggle";
    toggle.textContent = "🎃";
    toggle.title = "Хэллоуин-режим / Halloween mode";
    toggle.setAttribute("aria-label", "Переключить хэллоуинское оформление");

    function apply(on) {
      layer.hidden = !on;
      toggle.setAttribute("aria-pressed", on ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      var next = layer.hidden;
      apply(next);
      saveState(next);
    });

    apply(isEnabled());
    document.body.appendChild(toggle);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
