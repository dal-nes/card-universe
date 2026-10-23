window.SL = window.SL || {};
(function (SL) {
  "use strict";
  const { el, icon, loc, formatTime } = SL.utils;

  const activePlayers = new Set();
  function stopOthers(current) {
    activePlayers.forEach((player) => {
      if (player !== current) player.pause();
    });
  }

  function createPlayer(tracks) {
    const valid = (Array.isArray(tracks) ? tracks : []).filter((track) => track && track.src);
    if (!valid.length) return null;
    const t = SL.i18n.t;
    const lang = SL.i18n.lang;

    const audio = new Audio();
    audio.preload = "metadata";

    const state = { index: 0, playing: false, seeking: false };

    const coverBox = el("div", { class: "player__cover" }, [icon("music")]);
    const titleEl = el("div", { class: "player__title" });
    const artistEl = el("div", { class: "player__artist" });

    const btnPlay = el("button", { class: "player__btn player__btn--play", attrs: { type: "button", "aria-label": t("player.play") } }, [icon("play")]);
    const btnPrev = el("button", { class: "player__btn", attrs: { type: "button", "aria-label": t("player.prev") } }, [icon("prev")]);
    const btnNext = el("button", { class: "player__btn", attrs: { type: "button", "aria-label": t("player.next") } }, [icon("next")]);
    const btnLyrics = el("button", { class: "player__btn", attrs: { type: "button", "aria-label": t("player.lyrics") } }, [icon("bookmark")]);

    const timeCurrent = el("span", { class: "player__time", text: "0:00" });
    const timeTotal = el("span", { class: "player__time", text: "0:00" });
    const seek = el("input", { class: "player__seek", attrs: { type: "range", min: 0, max: 1000, value: 0, step: 1, "aria-label": t("player.play") } });

    const volume = el("input", { attrs: { type: "range", min: 0, max: 100, value: 80, "aria-label": t("player.volume") } });
    volume.style.setProperty("--fill", "80%");
    audio.volume = 0.8;

    const statusEl = el("div", { class: "player__status", attrs: { role: "status", "aria-live": "polite" } });

    const controls = el("div", { class: "player__controls" }, [btnPrev, btnPlay, btnNext, btnLyrics]);
    const info = el("div", { class: "player__info" }, [titleEl, artistEl, controls]);
    const main = el("div", { class: "player__main" }, [coverBox, info]);
    const progressRow = el("div", { class: "player__progress-row" }, [timeCurrent, seek, timeTotal]);
    const volumeRow = el("div", { class: "player__volume" }, [icon("volume"), volume]);

    const lyricsDesc = el("div", { class: "player__lyrics-desc" });
    const lyricsText = el("div", { class: "player__lyrics-text" });
    const lyricsBox = el("div", { class: "player__lyrics-box" }, [lyricsDesc, lyricsText]);

    // Классическая структура: всё в одной колонке
    const root = el("div", { class: "player" }, [main, progressRow, volumeRow, statusEl, lyricsBox]);

    btnLyrics.addEventListener("click", () => {
      lyricsBox.classList.toggle("is-open");
    });

    let playlistEl = null;
    if (valid.length > 1) {
      playlistEl = el("div", { class: "player__playlist" }, [
        el("div", { class: "player__playlist-title", text: t("player.playlist") })
      ]);
      valid.forEach((track, index) => {
        const btn = el("button", {
          class: "player__track",
          attrs: { type: "button", "aria-current": "false" },
          on: { click: () => selectTrack(index, true) }
        }, [
          el("span", { class: "player__track-num", text: String(index + 1).padStart(2, "0") }),
          el("span", { class: "player__track-name", text: loc(track.title, lang) }),
          el("span", { class: "player__track-len", dataset: { trackLen: index }, text: "" })
        ]);
        playlistEl.append(btn);
      });
      root.append(playlistEl);
    }

    function currentTrack() { return valid[state.index]; }

    function renderTrackMeta() {
      const track = currentTrack();
      titleEl.textContent = loc(track.title, lang) || "—";
      const artist = loc(track.artist, lang);
      artistEl.textContent = artist || "";
      artistEl.style.display = artist ? "" : "none";

      coverBox.textContent = "";
      if (track.cover) {
        const img = el("img", { attrs: { src: track.cover, alt: "" } });
        img.addEventListener("error", () => {
          coverBox.textContent = "";
          coverBox.append(icon("music"));
        });
        coverBox.append(img);
      } else {
        coverBox.append(icon("music"));
      }

      if (track.lyrics) {
        btnLyrics.style.display = "grid";
        lyricsDesc.textContent = track.description || "";
        lyricsText.textContent = track.lyrics;
      } else {
        btnLyrics.style.display = "none";
        lyricsBox.classList.remove("is-open");
      }

      if (playlistEl) {
        SL.utils.$$(".player__track", playlistEl).forEach((btn, index) => {
          btn.setAttribute("aria-current", String(index === state.index));
        });
      }
    }

    function setStatus(text, isError) {
      statusEl.textContent = text || "";
      statusEl.classList.toggle("player__status--error", Boolean(isError));
    }

    function selectTrack(index, autoplay) {
      audio.pause();
      state.playing = false;
      state.index = ((index % valid.length) + valid.length) % valid.length;
      renderTrackMeta();
      setStatus(t("player.loading"));
      timeCurrent.textContent = "0:00";
      timeTotal.textContent = "0:00";
      seek.value = "0";
      seek.style.setProperty("--fill", "0%");
      audio.src = currentTrack().src;
      audio.load();
      updatePlayButton();
      if (autoplay) play();
    }

    function updatePlayButton() {
      btnPlay.textContent = "";
      btnPlay.append(icon(state.playing ? "pause" : "play"));
      btnPlay.setAttribute("aria-label", state.playing ? t("player.pause") : t("player.play"));
    }

    async function play() {
      stopOthers(api);
      try {
        await audio.play();
        state.playing = true;
        setStatus("");
      } catch (err) {
        state.playing = false;
        if (err && err.name !== "NotAllowedError") setStatus(t("player.error"), true);
      }
      updatePlayButton();
    }

    function pause() {
      audio.pause();
      state.playing = false;
      updatePlayButton();
    }

    btnPlay.addEventListener("click", () => (state.playing ? pause() : play()));
    btnPrev.addEventListener("click", () => selectTrack(state.index - 1, state.playing));
    btnNext.addEventListener("click", () => selectTrack(state.index + 1, state.playing));

    audio.addEventListener("loadedmetadata", () => {
      setStatus("");
      timeTotal.textContent = formatTime(audio.duration);
      const lenEl = playlistEl && playlistEl.querySelector('[data-track-len="' + state.index + '"]');
      if (lenEl) lenEl.textContent = formatTime(audio.duration);
    });
    audio.addEventListener("timeupdate", () => {
      if (state.seeking || !Number.isFinite(audio.duration) || audio.duration === 0) return;
      timeCurrent.textContent = formatTime(audio.currentTime);
      const ratio = audio.currentTime / audio.duration;
      seek.value = String(Math.round(ratio * 1000));
      seek.style.setProperty("--fill", ratio * 100 + "%");
    });
    audio.addEventListener("ended", () => {
      if (valid.length > 1) selectTrack(state.index + 1, true);
      else {
        state.playing = false;
        updatePlayButton();
      }
    });
    audio.addEventListener("error", () => {
      setStatus(t("player.error"), true);
      state.playing = false;
      updatePlayButton();
    });

    seek.addEventListener("input", () => {
      state.seeking = true;
      const ratio = Number(seek.value) / 1000;
      seek.style.setProperty("--fill", ratio * 100 + "%");
      if (Number.isFinite(audio.duration)) timeCurrent.textContent = formatTime(audio.duration * ratio);
    });
    seek.addEventListener("change", () => {
      if (Number.isFinite(audio.duration)) audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
      state.seeking = false;
    });

    volume.addEventListener("input", () => {
      audio.volume = Number(volume.value) / 100;
      volume.style.setProperty("--fill", volume.value + "%");
    });

    renderTrackMeta();
    audio.src = currentTrack().src;
    setStatus("");

    const api = { element: root, pause, play };
    activePlayers.add(api);
    return api;
  }

  SL.audioPlayer = { createPlayer };
})(window.SL);