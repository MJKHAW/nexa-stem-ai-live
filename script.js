(function () {
  var INITIAL_VOLUME = 120;
  var TARGET_VOLUME = 250;
  var POUR_MS = 800;

  var FIKIR_ANSWER = 130;
  var BUKTI_ANSWER = 190;

  var M1_TANK_DEBUG = {
    x: 56.8,
    y: 41,
    width: 29.7,
    height: 20.9,
    borderRadius: 8,
    clipInset: 0,
    labelX: 50,
    labelY: 6,
    labelFollow: true
  };
  var m1TankLayout = null;

  var state = {
    volume: INITIAL_VOLUME,
    selected: null,
    pouring: false,
    completed: false,
    fikirSolved: false,
    buktiSolved: false,
    experimentMarked: false,
    attemptPours: [],
    proofPours: null,
    overflowHold: false,
    correct: 0,
    incorrect: 0,
    log: []
  };

  var pourToken = 0;
  var imageReady = {};
  var perfBaseLogged = false;
  var cylinder = document.getElementById("cylinder");
  var water = document.getElementById("water");
  var scale = document.getElementById("scale");
  var volumeText = document.getElementById("volume-text");
  var message = document.getElementById("message");
  var pourButton = document.getElementById("pour-button");
  var resetButton = document.getElementById("reset-button");
  var beakers = document.querySelectorAll(".beaker");
  var nova = document.getElementById("nova");
  var novaSpeech = document.getElementById("nova-speech");
  var fikirForm = document.getElementById("fikir-form");
  var fikirInput = document.getElementById("fikir-input");
  var fikirFeedback = document.getElementById("fikir-feedback");
  var fikirHint = document.getElementById("fikir-hint");
  var hintButton = document.getElementById("hint-button");
  var eksperimenNote = document.getElementById("eksperimen-note");
  var eksperimenStatus = document.getElementById("eksperimen-status");
  var buktiPanel = document.getElementById("bukti-panel");
  var buktiForm = document.getElementById("bukti-form");
  var buktiInput = document.getElementById("bukti-input");
  var buktiFeedback = document.getElementById("bukti-feedback");
  var correctCount = document.getElementById("correct-count");
  var incorrectCount = document.getElementById("incorrect-count");
  var attemptLog = document.getElementById("attempt-log");
  var welcomeScreen = document.getElementById("welcome-screen");
  var aiDemoScreen = document.getElementById("ai-demo");
  var mapScreen = document.getElementById("city-map");
  var missionScreen = document.getElementById("mission-one");
  var missionBadge = document.getElementById("mission-badge");
  var mapNote = document.getElementById("map-note");
  var openMissionButton = document.getElementById("open-mission-one");
  var backToMapButton = document.getElementById("back-to-map");
  var mapSpeech = document.getElementById("map-speech");
  var missionTwoScreen = document.getElementById("mission-two");
  var missionTwoButton = document.getElementById("open-mission-two");
  var missionTwoBadge = document.getElementById("mission-two-badge");
  var missionTwoLock = document.getElementById("mission-two-lock");
  var missionTwoState = document.getElementById("mission-two-state");
  var backToMapTwoButton = document.getElementById("back-to-map-two");
  var missionThreeScreen = document.getElementById("mission-three");
  var missionThreeButton = document.getElementById("open-mission-three");
  var missionThreeBadge = document.getElementById("mission-three-badge");
  var missionThreeLock = document.getElementById("mission-three-lock");
  var missionThreeState = document.getElementById("mission-three-state");
  var backToMapThreeButton = document.getElementById("back-to-map-three");
  var missionFourScreen = document.getElementById("mission-four");
  var missionFourButton = document.getElementById("open-mission-four");
  var missionFourBadge = document.getElementById("mission-four-badge");
  var missionFourLock = document.getElementById("mission-four-lock");
  var missionFourState = document.getElementById("mission-four-state");
  var backToMapFourButton = document.getElementById("back-to-map-four");

  function buildScale() {
    var mark;
    for (mark = 0; mark <= TARGET_VOLUME; mark += 10) {
      var tick = document.createElement("span");
      tick.className = mark % 50 === 0 ? "tick major" : "tick";
      tick.style.bottom = (mark / TARGET_VOLUME) * 100 + "%";
      if (mark % 50 === 0) {
        var label = document.createElement("span");
        label.textContent = String(mark);
        tick.appendChild(label);
      }
      scale.appendChild(tick);
    }
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = "message" + (type ? " " + type : "");
    if (novaSpeech) {
      novaSpeech.textContent = text;
    }
    if (nova) {
      nova.classList.toggle("nova-happy", type === "success");
      nova.classList.toggle("nova-warn", type === "warn");
    }
  }

  function readMillilitres(value) {
    var cleaned = String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/ml$/, "");
    if (!/^\d+$/.test(cleaned)) {
      return null;
    }
    return Number(cleaned);
  }

  function setPhase(id, mode) {
    var phase = document.getElementById(id);
    phase.classList.toggle("is-active", mode === "active");
    phase.classList.toggle("is-done", mode === "done");
    phase.classList.toggle("is-locked", mode === "locked");
  }

  function renderRecord() {
    var item;
    correctCount.textContent = String(state.correct);
    incorrectCount.textContent = String(state.incorrect);
    attemptLog.textContent = "";
    if (state.log.length === 0) {
      item = document.createElement("li");
      item.className = "log-empty";
      item.textContent = "Belum ada cubaan.";
      attemptLog.appendChild(item);
      return;
    }
    state.log.forEach(function (entry) {
      item = document.createElement("li");
      item.className = entry.correct ? "log-ok" : "log-bad";
      item.textContent = entry.label;
      attemptLog.appendChild(item);
    });
  }

  function recordAttempt(correct, label) {
    if (correct) {
      state.correct += 1;
    } else {
      state.incorrect += 1;
    }
    state.log.push({ correct: correct, label: label });
    renderRecord();
  }

  function missionOneComplete() {
    return state.fikirSolved && state.experimentMarked && state.buktiSolved;
  }

  var m2Complete = function () {
    return false;
  };

  var m3Complete = function () {
    return false;
  };

  var m4Complete = function () {
    return false;
  };

  function paintMapPin(button, locked, done, tick, lock) {
    var pin;
    if (!button) {
      return;
    }
    pin = button.parentElement;
    pin.classList.toggle("is-locked", locked);
    pin.classList.toggle("is-complete", done);
    pin.classList.toggle("is-active", !locked && !done);
    button.classList.toggle("is-locked", locked);
    button.classList.toggle("is-complete", done);
    button.disabled = locked;
    button.setAttribute("aria-disabled", locked ? "true" : "false");
    if (lock) {
      lock.hidden = !locked;
    }
    if (tick) {
      tick.hidden = !done;
    }
  }

  function renderMap() {
    var oneDone = missionOneComplete();
    var twoDone = m2Complete();
    var threeDone = m3Complete();
    var fourDone = m4Complete();
    paintMapPin(openMissionButton, false, oneDone, missionBadge, null);
    paintMapPin(missionTwoButton, !oneDone, twoDone, missionTwoBadge, missionTwoLock);
    paintMapPin(missionThreeButton, !twoDone, threeDone, missionThreeBadge, missionThreeLock);
    paintMapPin(missionFourButton, !threeDone, fourDone, missionFourBadge, missionFourLock);
    if (mapSpeech) {
      mapSpeech.textContent = "Hai! Saya Cikgu Khaw. Selamat datang ke Bandar Air Nexa! Pilih misi yang bercahaya untuk memulakan pengembaraan STEM kamu!";
    }
  }

  function hideEntryScreens() {
    welcomeScreen.hidden = true;
    aiDemoScreen.hidden = true;
  }

  var getM2ScreenId = function () {
    return "m2-fikir";
  };
  var getM3ScreenId = function () {
    return "m3-fikir";
  };
  var getM4ScreenId = function () {
    return "m4-fikir";
  };
  var openM3Stage = function () {
    enterScreen(getM3ScreenId());
  };
  var openM4Stage = function () {
    enterScreen(getM4ScreenId());
  };
  var cancelM34 = function () {};
  var koleksiCelebrated = false;
  var cancelKoleksi = function () {};

  function m1ScreenId() {
    if (!state.fikirSolved) {
      return "m1-fikir";
    }
    if (state.buktiSolved) {
      return "m1-selesai";
    }
    if (state.experimentMarked || state.completed) {
      return "m1-buktikan";
    }
    return "m1-eksperimen";
  }

  var cancelM2Advance = function () {};
  var openM2Stage = function () {
    enterScreen("m2-fikir");
  };

  function showWelcome() {
    cancelM2Advance();
    welcomeScreen.hidden = false;
    aiDemoScreen.hidden = true;
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    window.scrollTo(0, 0);
    enterScreen("welcome");
  }

  function showAiDemo() {
    cancelM2Advance();
    welcomeScreen.hidden = true;
    aiDemoScreen.hidden = false;
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    window.scrollTo(0, 0);
    enterScreen("demo");
  }

  function setupNovaEditor() {
    var NOVA_KEY = "nexa-welcome-nova";
    var NOVA_WIDTH = 44.4444;
    var NOVA_HEIGHT = 37.2917;
    var welcomeFrame = document.querySelector("#welcome-screen .welcome-frame");
    var nova = document.getElementById("welcome-nova");
    var editor = document.getElementById("nova-editor");
    var dragToggle = document.getElementById("nova-drag-toggle");
    var sizeInput = document.getElementById("nova-size");
    var visibilityButton = document.getElementById("nova-visibility");
    var note = document.getElementById("nova-editor-note");
    var novaNodes = document.querySelectorAll(".welcome-nova");
    var drag = null;
    var novaLayout = {
      left: 41.51,
      top: 32.07,
      scale: 1,
      visible: true
    };

    function defaultLayout() {
      return { left: 41.51, top: 32.07, scale: 1, visible: true };
    }

    function clampNova(layout) {
      var scale = layout.scale;
      var maxScale = Math.min(100 / NOVA_WIDTH, 100 / NOVA_HEIGHT);
      if (scale < 0.4) {
        scale = 0.4;
      }
      if (scale > maxScale) {
        scale = maxScale;
      }
      var extraX = NOVA_WIDTH * (scale - 1) / 2;
      var extraY = NOVA_HEIGHT * (scale - 1) / 2;
      var minLeft = extraX;
      var maxLeft = 100 - NOVA_WIDTH * (scale + 1) / 2;
      var minTop = extraY;
      var maxTop = 100 - NOVA_HEIGHT * (scale + 1) / 2;
      var left = layout.left;
      var top = layout.top;
      if (maxLeft < minLeft) {
        left = (100 - NOVA_WIDTH) / 2;
      } else {
        left = Math.min(maxLeft, Math.max(minLeft, left));
      }
      if (maxTop < minTop) {
        top = (100 - NOVA_HEIGHT) / 2;
      } else {
        top = Math.min(maxTop, Math.max(minTop, top));
      }
      return {
        left: left,
        top: top,
        scale: scale,
        visible: layout.visible !== false
      };
    }

    function settingsText() {
      return [
        "left: " + novaLayout.left.toFixed(2) + "%",
        "top: " + novaLayout.top.toFixed(2) + "%",
        "scale: " + novaLayout.scale.toFixed(2),
        "visible: " + (novaLayout.visible ? "true" : "false")
      ].join("\n");
    }

    function setNote(message) {
      note.textContent = message;
    }

    function syncControls() {
      sizeInput.value = String(Math.round(novaLayout.scale * 100));
      visibilityButton.textContent = novaLayout.visible ? "Sembunyi" : "Tunjuk";
      visibilityButton.setAttribute("aria-pressed", novaLayout.visible ? "true" : "false");
      visibilityButton.setAttribute("aria-label", novaLayout.visible ? "Sembunyi AI Nova" : "Tunjuk AI Nova");
      dragToggle.setAttribute("aria-pressed", nova.classList.contains("is-draggable") ? "true" : "false");
    }

    function applyNovaLayout() {
      var index;
      novaLayout = clampNova(novaLayout);
      for (index = 0; index < novaNodes.length; index += 1) {
        novaNodes[index].style.left = novaLayout.left + "%";
        novaNodes[index].style.top = novaLayout.top + "%";
        novaNodes[index].style.setProperty("--nova-scale", String(novaLayout.scale));
        novaNodes[index].classList.toggle("is-hidden", !novaLayout.visible);
      }
      syncControls();
    }

    function loadNovaLayout() {
      try {
        var raw = localStorage.getItem(NOVA_KEY);
        if (!raw) {
          return;
        }
        var data = JSON.parse(raw);
        if (typeof data.left !== "number" || typeof data.top !== "number" || typeof data.scale !== "number") {
          return;
        }
        novaLayout = clampNova({
          left: data.left,
          top: data.top,
          scale: data.scale,
          visible: data.visible !== false
        });
      } catch (error) {
        novaLayout = defaultLayout();
      }
    }

    function setEditing(enabled) {
      welcomeFrame.classList.toggle("is-editing", enabled);
      editor.hidden = !enabled;
      if (enabled) {
        nova.classList.add("is-draggable");
        setNote("Seret AI Nova untuk ubah posisi.");
      } else {
        nova.classList.remove("is-draggable");
        nova.classList.remove("is-dragging");
        drag = null;
      }
      syncControls();
    }

    function copySettings() {
      var text = settingsText();
      function fallback() {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-999px";
        document.body.appendChild(area);
        area.select();
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (error) {
          copied = false;
        }
        document.body.removeChild(area);
        return copied;
      }
      function finish(copied) {
        setNote(copied ? "Tetapan disalin.\n" + text : text);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          finish(true);
        }, function () {
          finish(fallback());
        });
        return;
      }
      finish(fallback());
    }

    nova.addEventListener("pointerdown", function (event) {
      if (!welcomeFrame.classList.contains("is-editing") || !nova.classList.contains("is-draggable")) {
        return;
      }
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      event.preventDefault();
      var frame = welcomeFrame.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: novaLayout.left,
        top: novaLayout.top,
        frameWidth: frame.width,
        frameHeight: frame.height
      };
      nova.classList.add("is-dragging");
      nova.setPointerCapture(event.pointerId);
    });

    nova.addEventListener("pointermove", function (event) {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      novaLayout.left = drag.left + (event.clientX - drag.startX) / drag.frameWidth * 100;
      novaLayout.top = drag.top + (event.clientY - drag.startY) / drag.frameHeight * 100;
      applyNovaLayout();
    });

    function endDrag(event) {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      drag = null;
      nova.classList.remove("is-dragging");
    }

    nova.addEventListener("pointerup", endDrag);
    nova.addEventListener("pointercancel", endDrag);

    dragToggle.addEventListener("click", function () {
      nova.classList.toggle("is-draggable");
      if (!nova.classList.contains("is-draggable")) {
        nova.classList.remove("is-dragging");
        drag = null;
        setNote("Seretan dimatikan.");
      } else {
        setNote("Seret AI Nova untuk ubah posisi.");
      }
      syncControls();
    });

    sizeInput.addEventListener("input", function () {
      novaLayout.scale = Number(sizeInput.value) / 100;
      applyNovaLayout();
    });

    visibilityButton.addEventListener("click", function () {
      novaLayout.visible = !novaLayout.visible;
      applyNovaLayout();
      setNote(novaLayout.visible ? "AI Nova ditunjukkan." : "AI Nova disembunyikan.");
    });

    document.getElementById("nova-save").addEventListener("click", function () {
      try {
        localStorage.setItem(NOVA_KEY, JSON.stringify({
          left: novaLayout.left,
          top: novaLayout.top,
          scale: novaLayout.scale,
          visible: novaLayout.visible
        }));
        setNote("Disimpan.\n" + settingsText());
      } catch (error) {
        setNote("Tidak dapat disimpan dalam pelayar ini.");
      }
    });

    document.getElementById("nova-reset").addEventListener("click", function () {
      novaLayout = defaultLayout();
      try {
        localStorage.removeItem(NOVA_KEY);
      } catch (error) {
        setNote("Tetapan asal.");
      }
      applyNovaLayout();
      setNote("Tetapan asal.");
    });

    document.getElementById("nova-copy").addEventListener("click", copySettings);

    document.addEventListener("keydown", function (event) {
      if (event.code !== "KeyE" || !event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.repeat) {
        return;
      }
      event.preventDefault();
      setEditing(!welcomeFrame.classList.contains("is-editing"));
    });

    loadNovaLayout();
    applyNovaLayout();
  }

  function showMap() {
    cancelM2Advance();
    cancelM34();
    cancelKoleksi();
    hideEntryScreens();
    mapScreen.hidden = false;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    renderMap();
    window.scrollTo(0, 0);
    enterScreen("map");
  }

  function showMission() {
    cancelM2Advance();
    cancelM34();
    cancelKoleksi();
    hideEntryScreens();
    mapScreen.hidden = true;
    missionScreen.hidden = false;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    syncM1FikirScreen();
    window.scrollTo(0, 0);
    if (state.buktiSolved) {
      showM1CompleteScreen();
    } else {
      hideM1CompleteScreen();
    }
    enterScreen(m1ScreenId());
  }

  function showMissionTwo() {
    cancelKoleksi();
    cancelM34();
    if (!missionOneComplete()) {
      mapNote.textContent = "Selesaikan Misi 1 dahulu untuk membuka Batu Misteri.";
      return;
    }
    hideEntryScreens();
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = false;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    window.scrollTo(0, 0);
    if (document.getElementById("m2-feedback")) {
      document.getElementById("m2-feedback").hidden = true;
    }
    if (document.getElementById("m2-dialog")) {
      document.getElementById("m2-dialog").hidden = true;
    }
    openM2Stage();
  }

  function showMissionThree() {
    cancelM2Advance();
    cancelKoleksi();
    if (!m2Complete()) {
      mapNote.textContent = "Selesaikan Misi 2 dahulu untuk membuka Tangki Rosak.";
      return;
    }
    hideEntryScreens();
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = false;
    missionFourScreen.hidden = true;
    window.scrollTo(0, 0);
    cancelM34();
    openM3Stage();
  }

  function showMissionFour() {
    cancelM2Advance();
    cancelKoleksi();
    if (!m3Complete()) {
      mapNote.textContent = "Selesaikan Misi 3 dahulu untuk membuka Bengkel Jurutera Muda.";
      return;
    }
    hideEntryScreens();
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = false;
    window.scrollTo(0, 0);
    cancelM34();
    openM4Stage();
  }

  function renderLearning() {
    var buktiReady = state.completed || state.buktiSolved;
    var remaining = TARGET_VOLUME - state.volume;
    fikirForm.hidden = state.fikirSolved;
    hintButton.hidden = state.fikirSolved;
    eksperimenNote.hidden = !state.fikirSolved;
    if (state.fikirSolved) {
      eksperimenStatus.textContent = remaining === 0
        ? "Tangki sudah tepat 250 mL. Baca skala pada aras mata, kemudian jawab soalan Buktikan."
        : "Masih perlukan " + remaining + " mL. Pilih bekas, tekan Tuang Air, dan baca skala pada aras mata.";
    }
    buktiPanel.hidden = !buktiReady;
    buktiForm.hidden = state.buktiSolved;
    setPhase("phase-fikir", state.fikirSolved ? "done" : "active");
    setPhase("phase-eksperimen", !state.fikirSolved ? "locked" : (state.completed ? "done" : "active"));
    setPhase("phase-buktikan", !buktiReady ? "locked" : (state.buktiSolved ? "done" : "active"));
  }

  function render() {
    var percent = (state.volume / TARGET_VOLUME) * 100;
    var locked = !state.fikirSolved || state.completed || state.pouring || state.overflowHold;
    water.style.height = percent + "%";
    volumeText.textContent = state.volume + " mL";
    placeM1Water();
    document.querySelectorAll("[data-m1-pour]").forEach(function (button) {
      button.disabled = locked;
    });
    document.body.classList.toggle("completed", state.completed);
    document.body.classList.toggle("is-pouring", state.pouring);

    beakers.forEach(function (button) {
      var amount = Number(button.getAttribute("data-amount"));
      var selected = state.selected === amount;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      button.disabled = locked;
    });

    pourButton.disabled = locked;
    renderLearning();
    renderMap();
  }

  function finishPour(token) {
    if (token !== pourToken) {
      return;
    }
    state.pouring = false;
    if (state.volume === TARGET_VOLUME) {
      state.completed = true;
      showMessage("Tahniah! Kamu berjaya menyelamatkan tangki air!", "success");
      if (!state.experimentMarked) {
        state.experimentMarked = true;
        recordAttempt(true, "Eksperimen: tangki tepat 250 mL");
      }
      if (!state.proofPours) {
        state.proofPours = state.attemptPours.slice();
      }
      showM1Outcome("betul", function () {
        var pending = syncM1FikirScreen();
        enterScreen("m1-buktikan");
        return pending;
      });
    } else {
      showMessage("Tangki kini " + state.volume + " mL. Sasaran masih 250 mL.");
    }
    render();
    if (state.completed && buktiPanel && !document.getElementById("m1-sheet").hidden) {
      buktiPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function selectBeaker(amount) {
    if (!state.fikirSolved) {
      showMessage("Jawab soalan Fikir dahulu. Kira 250 − 120.", "warn");
      return;
    }
    if (state.completed || state.pouring) {
      return;
    }
    state.selected = amount;
    showMessage("Bekas " + amount + " mL dipilih. Tekan Tuang Air.");
    render();
  }

  function pour() {
    var next;
    var space;
    var token;
    var reduceMotion;

    if (!state.fikirSolved) {
      showMessage("Jawab soalan Fikir dahulu. Kira 250 − 120.", "warn");
      return;
    }
    if (state.completed || state.pouring || state.overflowHold) {
      return;
    }
    if (state.selected === null) {
      showMessage("Pilih bekas 20 mL, 50 mL atau 80 mL dahulu.", "warn");
      return;
    }

    next = state.volume + state.selected;
    if (next > TARGET_VOLUME) {
      space = TARGET_VOLUME - state.volume;
      state.overflowHold = true;
      showMessage(
        "Terlalu banyak! Ruang tinggal " + space + " mL sahaja. Air tidak dituang.",
        "warn"
      );
      cylinder.classList.remove("shake");
      void cylinder.offsetWidth;
      cylinder.classList.add("shake");
      var tankView = document.getElementById("m1-tank");
      if (tankView) {
        tankView.classList.remove("shake");
        void tankView.offsetWidth;
        tankView.classList.add("shake");
      }
      recordAttempt(false, "Eksperimen: air terlalu banyak");
      guideMemory.expOverflows += 1;
      guideMemory.pendingOverflow = true;
      guideMemory.lastOverflowBeaker = state.selected;
      render();
      showOverflowNotice(space);
      return;
    }

    pourToken += 1;
    token = pourToken;
    state.pouring = true;
    state.volume = next;
    guideMemory.pendingOverflow = false;
    state.attemptPours.push(state.selected);
    render();

    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      finishPour(token);
      return;
    }
    window.setTimeout(function () {
      finishPour(token);
    }, POUR_MS);
  }

  function reset() {
    pourToken += 1;
    state.volume = INITIAL_VOLUME;
    state.selected = null;
    state.pouring = false;
    state.completed = false;
    state.overflowHold = false;
    guideMemory.pendingOverflow = false;
    guideMemory.lastOverflowBeaker = 0;
    state.attemptPours = [];
    cylinder.classList.remove("shake");
    if (state.fikirSolved) {
      showMessage("Tangki diset semula kepada 120 mL. Pilih bekas air.");
    } else {
      showMessage("Tangki diset semula kepada 120 mL. Kira 250 − 120 dahulu.");
    }
    render();
  }

  function checkFikir(event) {
    var answer;
    event.preventDefault();
    if (state.fikirSolved) {
      return;
    }
    answer = readMillilitres(fikirInput.value);
    if (answer === null) {
      fikirFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      fikirFeedback.className = "feedback bad";
      return;
    }
    if (answer === FIKIR_ANSWER) {
      state.fikirSolved = true;
      fikirFeedback.textContent = "Betul! Kamu perlukan 130 mL lagi.";
      fikirFeedback.className = "feedback ok";
      fikirHint.hidden = true;
      recordAttempt(true, "Fikir: betul, 130 mL");
      showMessage("Betul! Kamu perlukan 130 mL lagi. Pilih bekas dan tekan Tuang Air.", "success");
      render();
      return;
    }
    fikirFeedback.textContent = "Belum tepat. Cuba lagi.";
    fikirFeedback.className = "feedback bad";
    fikirHint.hidden = false;
    recordAttempt(false, "Fikir: salah");
    showMessage("Belum tepat. Gunakan petunjuk, kemudian cuba lagi.", "warn");
  }

  function checkBukti(event) {
    var answer;
    event.preventDefault();
    if (state.buktiSolved) {
      return;
    }
    answer = readMillilitres(buktiInput.value);
    if (answer === null) {
      buktiFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      buktiFeedback.className = "feedback bad";
      return;
    }
    if (answer === BUKTI_ANSWER) {
      state.buktiSolved = true;
      buktiFeedback.textContent = "Bagus! Kamu berjaya menjawab tanpa petunjuk.";
      buktiFeedback.className = "feedback ok";
      recordAttempt(true, "Buktikan: betul, 190 mL");
      showMessage("Bagus! Kamu boleh mengira isi padu cecair sendiri.", "success");
      render();
      narrateFeedback("selesai");
      return;
    }
    buktiFeedback.textContent = "Belum tepat. Baca soalan sekali lagi dan cuba semula.";
    buktiFeedback.className = "feedback bad";
    recordAttempt(false, "Buktikan: salah");
    showMessage("Belum tepat. Cuba semak kiraan kamu sendiri.", "warn");
    narrateFeedback("cuba");
  }

  beakers.forEach(function (button) {
    button.addEventListener("click", function () {
      selectBeaker(Number(button.getAttribute("data-amount")));
    });
  });
  pourButton.addEventListener("click", pour);
  resetButton.addEventListener("click", reset);
  fikirForm.addEventListener("submit", checkFikir);
  buktiForm.addEventListener("submit", checkBukti);
  hintButton.addEventListener("click", function () {
    if (state.fikirSolved) {
      return;
    }
    fikirHint.hidden = false;
  });
  setupMissionOnePicture();
  document.getElementById("open-ai-demo").addEventListener("click", showAiDemo);
  document.getElementById("start-play").addEventListener("click", showMap);
  document.getElementById("demo-back").addEventListener("click", showWelcome);
  setupNovaEditor();
  setupDemoGame();
  setupMissionHelp();
  setupNarrationControls();
  openMissionButton.addEventListener("click", showMission);
  backToMapButton.addEventListener("click", showMap);
  document.querySelectorAll(".mission-card.is-locked").forEach(function (button) {
    if (button.id === "open-mission-two" || button.id === "open-mission-three" || button.id === "open-mission-four") {
      return;
    }
    button.addEventListener("click", function () {
      mapNote.textContent = button.getAttribute("data-lock-message");
    });
  });
  missionTwoButton.addEventListener("click", showMissionTwo);
  backToMapTwoButton.addEventListener("click", showMap);
  missionThreeButton.addEventListener("click", showMissionThree);
  backToMapThreeButton.addEventListener("click", showMap);
  missionFourButton.addEventListener("click", showMissionFour);
  backToMapFourButton.addEventListener("click", showMap);
  function setupMapSignEditor() {
    var KEY = "nexa-map-sign-debug";
    var frame = document.getElementById("map-frame");
    var editor = document.getElementById("map-sign-editor");
    var note = document.getElementById("map-sign-note");
    var readout = document.getElementById("map-sign-readout");
    var screen = document.getElementById("city-map");
    var slots = [
      ["m2", "open-mission-two", "map-sign-2"],
      ["m3", "open-mission-three", "map-sign-3"],
      ["m4", "open-mission-four", "map-sign-4"]
    ];
    var layout = {
      m2: { left: 57.8, top: 18.4, width: 34, height: 8.6 },
      m3: { left: 3.5, top: 70.4, width: 33.8, height: 9.5 },
      m4: { left: 58.7, top: 46.6, width: 39.3, height: 9.2 }
    };
    var drag = null;
    var TICK_KEY = "nexa-map-tick-debug";
    var tickSlots = [
      ["m1", "mission-badge", "map-tick-1"],
      ["m2", "mission-two-badge", "map-tick-2"],
      ["m3", "mission-three-badge", "map-tick-3"],
      ["m4", "mission-four-badge", "map-tick-4"]
    ];
    var tickLayout = {
      m1: { left: 37.1, top: 41.1, width: 5.5, height: 4.2 },
      m2: { left: 85.8, top: 23.2, width: 5.5, height: 4.2 },
      m3: { left: 30.9, top: 72.4, width: 5.5, height: 4.2 },
      m4: { left: 90.6, top: 48.2, width: 5.5, height: 4.2 }
    };
    var tickDrag = null;

    function round1(value) {
      return Math.round(value * 10) / 10;
    }

    function clamp(slot) {
      if (slot.width < 4) { slot.width = 4; }
      if (slot.height < 3) { slot.height = 3; }
      if (slot.width > 100) { slot.width = 100; }
      if (slot.height > 40) { slot.height = 40; }
      if (slot.left < 0) { slot.left = 0; }
      if (slot.top < 0) { slot.top = 0; }
      if (slot.left + slot.width > 100) { slot.left = round1(100 - slot.width); }
      if (slot.top + slot.height > 100) { slot.top = round1(100 - slot.height); }
      slot.left = round1(slot.left);
      slot.top = round1(slot.top);
      slot.width = round1(slot.width);
      slot.height = round1(slot.height);
    }

    function applyOne(key, buttonId, handleId) {
      var slot = layout[key];
      var button = document.getElementById(buttonId);
      var handle = document.getElementById(handleId);
      button.style.setProperty("--x", slot.left + "%");
      button.style.setProperty("--y", slot.top + "%");
      button.style.setProperty("--w", slot.width + "%");
      button.style.setProperty("--h", slot.height + "%");
      handle.style.setProperty("--x", slot.left + "%");
      handle.style.setProperty("--y", slot.top + "%");
      handle.style.setProperty("--w", slot.width + "%");
      handle.style.setProperty("--h", slot.height + "%");
    }

    function applyAll() {
      slots.forEach(function (slot) {
        applyOne(slot[0], slot[1], slot[2]);
      });
      readout.textContent = JSON.stringify({ signs: layout, ticks: tickLayout });
    }

    function readSaved() {
      var raw;
      var data;
      var index;
      var saved;
      try {
        raw = localStorage.getItem(KEY);
        if (!raw) { return false; }
        data = JSON.parse(raw);
      } catch (error) {
        return false;
      }
      for (index = 0; index < slots.length; index += 1) {
        saved = data[slots[index][0]];
        if (!saved || !isFinite(saved.left) || !isFinite(saved.top) || !isFinite(saved.width) || !isFinite(saved.height)) {
          return false;
        }
      }
      slots.forEach(function (slot) {
        layout[slot[0]] = {
          left: data[slot[0]].left,
          top: data[slot[0]].top,
          width: data[slot[0]].width,
          height: data[slot[0]].height
        };
        clamp(layout[slot[0]]);
      });
      return true;
    }

    function place() {
      var rect;
      var gutter;
      editor.classList.remove("is-docked");
      editor.classList.remove("is-stacked");
      editor.style.width = "";
      screen.classList.remove("is-map-editor-stacked");
      if (editor.hidden) { return; }
      rect = frame.getBoundingClientRect();
      gutter = window.innerWidth - rect.right;
      if (gutter >= 250) {
        editor.classList.add("is-docked");
        editor.style.width = Math.min(340, Math.floor(gutter - 28)) + "px";
      } else {
        editor.classList.add("is-stacked");
        screen.classList.add("is-map-editor-stacked");
      }
    }

    function setEditing(enabled) {
      frame.classList.toggle("is-map-editing", enabled);
      editor.hidden = !enabled;
      slots.forEach(function (slot) {
        document.getElementById(slot[2]).hidden = !enabled;
      });
      place();
      if (enabled) {
        note.textContent = "Seret papan tanda Misi 2, 3 atau 4, atau tanda siap Misi 1 hingga 4. Seret sudut kuning untuk ubah saiz. Kunci misi tidak berubah.";
        readout.textContent = JSON.stringify({ signs: layout, ticks: tickLayout });
      }
      tickSlots.forEach(function (slot) {
        document.getElementById(slot[2]).hidden = !enabled;
      });
    }

    function beginDrag(event, key, handle, resize) {
      var rect;
      if (!frame.classList.contains("is-map-editing") || (event.button !== undefined && event.button !== 0)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      rect = frame.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        key: key,
        resize: resize,
        startX: event.clientX,
        startY: event.clientY,
        left: layout[key].left,
        top: layout[key].top,
        width: layout[key].width,
        height: layout[key].height,
        frameWidth: rect.width,
        frameHeight: rect.height
      };
      handle.setPointerCapture(event.pointerId);
    }

    slots.forEach(function (slot) {
      var handle = document.getElementById(slot[2]);
      handle.addEventListener("pointerdown", function (event) {
        if (event.target.classList.contains("map-sign-resize")) { return; }
        beginDrag(event, slot[0], handle, false);
      });
      handle.addEventListener("pointermove", function (event) {
        var dx;
        var dy;
        var box;
        if (!drag || drag.pointerId !== event.pointerId || drag.key !== slot[0]) { return; }
        event.preventDefault();
        dx = (event.clientX - drag.startX) / drag.frameWidth * 100;
        dy = (event.clientY - drag.startY) / drag.frameHeight * 100;
        box = layout[slot[0]];
        if (drag.resize) {
          box.left = drag.left;
          box.top = drag.top;
          box.width = drag.width + dx;
          box.height = drag.height + dy;
        } else {
          box.left = drag.left + dx;
          box.top = drag.top + dy;
          box.width = drag.width;
          box.height = drag.height;
        }
        clamp(box);
        applyOne(slot[0], slot[1], slot[2]);
        readout.textContent = JSON.stringify({ signs: layout, ticks: tickLayout });
      });
      handle.addEventListener("pointerup", function (event) {
        if (drag && drag.pointerId === event.pointerId) { drag = null; }
      });
      handle.addEventListener("pointercancel", function (event) {
        if (drag && drag.pointerId === event.pointerId) { drag = null; }
      });
      handle.querySelector(".map-sign-resize").addEventListener("pointerdown", function (event) {
        beginDrag(event, slot[0], handle, true);
      });
    });

    function clampTick(slot) {
      if (slot.width < 2) { slot.width = 2; }
      if (slot.height < 2) { slot.height = 2; }
      if (slot.width > 30) { slot.width = 30; }
      if (slot.height > 20) { slot.height = 20; }
      if (slot.left < 0) { slot.left = 0; }
      if (slot.top < 0) { slot.top = 0; }
      if (slot.left + slot.width > 100) { slot.left = round1(100 - slot.width); }
      if (slot.top + slot.height > 100) { slot.top = round1(100 - slot.height); }
      slot.left = round1(slot.left);
      slot.top = round1(slot.top);
      slot.width = round1(slot.width);
      slot.height = round1(slot.height);
    }

    function applyTick(key, tickId, handleId) {
      var slot = tickLayout[key];
      var tick = document.getElementById(tickId);
      var handle = document.getElementById(handleId);
      tick.style.setProperty("--x", slot.left + "%");
      tick.style.setProperty("--y", slot.top + "%");
      tick.style.setProperty("--w", slot.width + "%");
      tick.style.setProperty("--h", slot.height + "%");
      handle.style.setProperty("--x", slot.left + "%");
      handle.style.setProperty("--y", slot.top + "%");
      handle.style.setProperty("--w", slot.width + "%");
      handle.style.setProperty("--h", slot.height + "%");
    }

    function applyTicks() {
      tickSlots.forEach(function (slot) {
        applyTick(slot[0], slot[1], slot[2]);
      });
    }

    function readTickSaved() {
      var raw;
      var data;
      var index;
      var saved;
      try {
        raw = localStorage.getItem(TICK_KEY);
        if (!raw) { return; }
        data = JSON.parse(raw);
      } catch (error) {
        return;
      }
      for (index = 0; index < tickSlots.length; index += 1) {
        saved = data[tickSlots[index][0]];
        if (!saved || !isFinite(saved.left) || !isFinite(saved.top) || !isFinite(saved.width) || !isFinite(saved.height)) {
          return;
        }
      }
      tickSlots.forEach(function (slot) {
        tickLayout[slot[0]] = {
          left: data[slot[0]].left,
          top: data[slot[0]].top,
          width: data[slot[0]].width,
          height: data[slot[0]].height
        };
        clampTick(tickLayout[slot[0]]);
      });
    }

    tickSlots.forEach(function (slot) {
      var handle = document.getElementById(slot[2]);
      handle.addEventListener("pointerdown", function (event) {
        if (event.target.classList.contains("map-sign-resize")) { return; }
        if (!frame.classList.contains("is-map-editing") || (event.button !== undefined && event.button !== 0)) { return; }
        event.preventDefault();
        event.stopPropagation();
        tickDrag = {
          pointerId: event.pointerId,
          key: slot[0],
          resize: false,
          startX: event.clientX,
          startY: event.clientY,
          left: tickLayout[slot[0]].left,
          top: tickLayout[slot[0]].top,
          width: tickLayout[slot[0]].width,
          height: tickLayout[slot[0]].height,
          frameWidth: frame.getBoundingClientRect().width,
          frameHeight: frame.getBoundingClientRect().height
        };
        handle.setPointerCapture(event.pointerId);
      });
      handle.addEventListener("pointermove", function (event) {
        var dx;
        var dy;
        var box;
        if (!tickDrag || tickDrag.pointerId !== event.pointerId || tickDrag.key !== slot[0]) { return; }
        event.preventDefault();
        dx = (event.clientX - tickDrag.startX) / tickDrag.frameWidth * 100;
        dy = (event.clientY - tickDrag.startY) / tickDrag.frameHeight * 100;
        box = tickLayout[slot[0]];
        if (tickDrag.resize) {
          box.left = tickDrag.left;
          box.top = tickDrag.top;
          box.width = tickDrag.width + dx;
          box.height = tickDrag.height + dy;
        } else {
          box.left = tickDrag.left + dx;
          box.top = tickDrag.top + dy;
          box.width = tickDrag.width;
          box.height = tickDrag.height;
        }
        clampTick(box);
        applyTick(slot[0], slot[1], slot[2]);
        readout.textContent = JSON.stringify({ signs: layout, ticks: tickLayout });
      });
      handle.addEventListener("pointerup", function (event) {
        if (tickDrag && tickDrag.pointerId === event.pointerId) { tickDrag = null; }
      });
      handle.addEventListener("pointercancel", function (event) {
        if (tickDrag && tickDrag.pointerId === event.pointerId) { tickDrag = null; }
      });
      handle.querySelector(".map-sign-resize").addEventListener("pointerdown", function (event) {
        var rect;
        if (!frame.classList.contains("is-map-editing") || (event.button !== undefined && event.button !== 0)) { return; }
        event.preventDefault();
        event.stopPropagation();
        rect = frame.getBoundingClientRect();
        tickDrag = {
          pointerId: event.pointerId,
          key: slot[0],
          resize: true,
          startX: event.clientX,
          startY: event.clientY,
          left: tickLayout[slot[0]].left,
          top: tickLayout[slot[0]].top,
          width: tickLayout[slot[0]].width,
          height: tickLayout[slot[0]].height,
          frameWidth: rect.width,
          frameHeight: rect.height
        };
        handle.setPointerCapture(event.pointerId);
      });
    });

    document.getElementById("map-sign-save").addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(layout));
        localStorage.setItem(TICK_KEY, JSON.stringify(tickLayout));
        note.textContent = "Disimpan dalam pelayar ini. Kunci misi tidak berubah.";
      } catch (error) {
        note.textContent = "Tidak dapat disimpan dalam pelayar ini.";
      }
    });
    document.getElementById("map-sign-copy").addEventListener("click", function () {
      var text = JSON.stringify({ signs: layout, ticks: tickLayout });
      readout.textContent = text;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          note.textContent = "Tetapan disalin.";
        }, function () {
          note.textContent = "Salin teks di bawah.";
        });
        return;
      }
      note.textContent = "Salin teks di bawah.";
    });
    document.getElementById("map-sign-close").addEventListener("click", function () {
      setEditing(false);
    });
    editor.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
    window.addEventListener("resize", place);
    document.addEventListener("keydown", function (event) {
      if (event.code !== "KeyE" || !event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.repeat) {
        return;
      }
      if (screen.hidden) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setEditing(!frame.classList.contains("is-map-editing"));
    }, true);
    applyAll();
    applyTicks();
  }

  setupMissionTwo();
  setupMissionThree();
  setupMissionFour();
  setupMapSignEditor();

  buildScale();
  render();
  window.requestAnimationFrame(function () {
    water.classList.add("ready");
    document.getElementById("m2-water").classList.add("ready");
    document.getElementById("m3-water").classList.add("ready");
    document.getElementById("m4-water").classList.add("ready");
  });

  function setupMissionTwo() {
  var M2_START = 120;
  var M2_FINAL = 165;
  var M2_MAX = 200;
  var M2_VOLUME_ANSWER = 45;
  var M2_BUKTI_ANSWER = 30;
  var SINK_MS = 900;

  var m2 = {
    fikirSolved: false,
    dropped: false,
    animating: false,
    seenRise: false,
    experimentSolved: false,
    buktiSolved: false,
    volume: M2_START,
    token: 0,
    correct: 0,
    incorrect: 0,
    log: [],
    moved: false
  };

  getM2ScreenId = function () {
    if (!m2.fikirSolved) {
      return "m2-fikir";
    }
    if (!m2.experimentSolved) {
      return "m2-eksperimen";
    }
    if (!m2.buktiSolved) {
      return "m2-buktikan";
    }
    return "m2-selesai";
  };

  var cylinder = document.getElementById("m2-cylinder");
  var water = document.getElementById("m2-water");
  var scale = document.getElementById("m2-scale");
  var volumeText = document.getElementById("m2-volume-text");
  var stone = document.getElementById("m2-stone");
  var message = document.getElementById("m2-message");
  var fikirFeedback = document.getElementById("m2-fikir-feedback");
  var fikirHint = document.getElementById("m2-fikir-hint");
  var hintButton = document.getElementById("m2-hint-button");
  var eksperimenNote = document.getElementById("m2-eksperimen-note");
  var eksperimenStatus = document.getElementById("m2-eksperimen-status");
  var calcPanel = document.getElementById("m2-calc-panel");
  var calcForm = document.getElementById("m2-calc-form");
  var calcInput = document.getElementById("m2-calc-input");
  var calcFeedback = document.getElementById("m2-calc-feedback");
  var calcHint = document.getElementById("m2-calc-hint");
  var calcHintButton = document.getElementById("m2-calc-hint-button");
  var buktiPanel = document.getElementById("m2-bukti-panel");
  var buktiForm = document.getElementById("m2-bukti-form");
  var buktiInput = document.getElementById("m2-bukti-input");
  var buktiFeedback = document.getElementById("m2-bukti-feedback");
  var correctCount = document.getElementById("m2-correct-count");
  var incorrectCount = document.getElementById("m2-incorrect-count");
  var attemptLog = document.getElementById("m2-attempt-log");
  var predictButtons = document.querySelectorAll(".predict");
  var drag = { active: false, x: 0, y: 0, moved: false };

  m2Complete = function () {
    return m2.fikirSolved && m2.experimentSolved && m2.buktiSolved;
  };

  function readAmount(value) {
    var cleaned = String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/cm³|cm3|ml/g, "");
    if (!/^\d+$/.test(cleaned)) {
      return null;
    }
    return Number(cleaned);
  }

  function showM2Message(text, type) {
    message.textContent = text;
    message.className = "message" + (type ? " " + type : "");
  }

  function recordM2(correct, label) {
    if (correct) {
      m2.correct += 1;
    } else {
      m2.incorrect += 1;
    }
    m2.log.push({ correct: correct, label: label });
    correctCount.textContent = String(m2.correct);
    incorrectCount.textContent = String(m2.incorrect);
    attemptLog.textContent = "";
    m2.log.forEach(function (entry) {
      var item = document.createElement("li");
      item.className = entry.correct ? "log-ok" : "log-bad";
      item.textContent = entry.label;
      attemptLog.appendChild(item);
    });
    renderMap();
  }

  function renderM2() {
    water.style.height = (m2.volume / M2_MAX) * 100 + "%";
    volumeText.textContent = m2.volume + " mL";
    cylinder.classList.toggle("sunk", m2.dropped);
    stone.classList.toggle("is-used", m2.dropped);
    stone.disabled = m2.animating;
    hintButton.hidden = m2.fikirSolved;
    eksperimenNote.hidden = !m2.fikirSolved;
    calcPanel.hidden = !m2.seenRise;
    calcForm.hidden = m2.experimentSolved;
    calcHintButton.hidden = m2.experimentSolved;
    buktiPanel.hidden = !m2.experimentSolved;
    buktiForm.hidden = m2.buktiSolved;
    predictButtons.forEach(function (button) {
      button.disabled = m2.fikirSolved;
      button.classList.toggle("selected", m2.fikirSolved && button.getAttribute("data-predict") === "naik");
    });
    if (m2.fikirSolved && !m2.seenRise) {
      eksperimenStatus.textContent = "Silinder ada 120 mL air. Tekan batu, atau seret batu ke dalam silinder.";
    } else if (m2.seenRise && !m2.experimentSolved) {
      eksperimenStatus.textContent = "Aras air kini 165 mL. Kira isi padu batu: 165 − 120.";
    } else if (m2.experimentSolved) {
      eksperimenStatus.textContent = "Isi padu batu dalam eksperimen ialah 45 cm³. Jawab soalan Buktikan sendiri.";
    }
    setPhase("m2-phase-fikir", m2.fikirSolved ? "done" : "active");
    setPhase("m2-phase-eksperimen", !m2.fikirSolved ? "locked" : (m2.experimentSolved ? "done" : "active"));
    setPhase("m2-phase-buktikan", !m2.experimentSolved ? "locked" : (m2.buktiSolved ? "done" : "active"));
  }

  function buildM2Scale() {
    var mark;
    for (mark = 0; mark <= M2_MAX; mark += 10) {
      var tick = document.createElement("span");
      tick.className = mark % 50 === 0 ? "tick major" : "tick";
      tick.style.bottom = (mark / M2_MAX) * 100 + "%";
      if (mark % 50 === 0) {
        var label = document.createElement("span");
        label.textContent = String(mark);
        tick.appendChild(label);
      }
      scale.appendChild(tick);
    }
  }

  function choosePrediction(choice) {
    if (m2.fikirSolved) {
      return;
    }
    if (choice === "naik") {
      m2.fikirSolved = true;
      fikirFeedback.textContent = "Betul! Aras air naik kerana batu mengambil ruang.";
      fikirFeedback.className = "feedback ok";
      fikirHint.hidden = true;
      recordM2(true, "Fikir: betul, aras naik");
      showM2Message("Betul! Sekarang masukkan batu ke dalam air.", "success");
      renderM2();
      enterScreen("m2-eksperimen");
      return;
    }
    fikirFeedback.textContent = "Belum tepat. Cuba lagi.";
    fikirFeedback.className = "feedback bad";
    fikirHint.hidden = false;
    recordM2(false, "Fikir: salah");
    showM2Message("Belum tepat. Fikir tentang ruang yang diambil batu.", "warn");
    narrateFeedback("cuba");
  }

  function submergeStone() {
    var token;
    var reduceMotion;
    if (!m2.fikirSolved || m2.dropped || m2.animating) {
      if (!m2.fikirSolved) {
        showM2Message("Jawab soalan Fikir dahulu. Adakah aras air naik?", "warn");
      }
      return;
    }
    m2.token += 1;
    token = m2.token;
    m2.animating = true;
    m2.dropped = true;
    m2.volume = M2_FINAL;
    stone.style.transform = "";
    showM2Message("Perhatikan batu tenggelam dan aras air naik.");
    renderM2();
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(function () {
      if (token !== m2.token) {
        return;
      }
      m2.animating = false;
      m2.seenRise = true;
      showM2Message("Aras air kini 165 mL. Kira 165 − 120.");
      renderM2();
      calcPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    }, reduceMotion ? 0 : SINK_MS);
  }

  function resetM2() {
    m2.token += 1;
    m2.dropped = false;
    m2.animating = false;
    m2.volume = M2_START;
    if (!m2.experimentSolved) {
      m2.seenRise = false;
      calcFeedback.textContent = "";
      calcInput.value = "";
    }
    stone.style.transform = "";
    showM2Message(m2.fikirSolved
      ? "Eksperimen diset semula. Air kembali ke 120 mL."
      : "Air kembali ke 120 mL. Ramalkan dahulu.");
    renderM2();
  }

  function checkCalc(event) {
    var answer;
    event.preventDefault();
    if (!m2.seenRise || m2.experimentSolved) {
      return;
    }
    answer = readAmount(calcInput.value);
    if (answer === null) {
      calcFeedback.textContent = "Tulis nombor dalam cm³ dahulu.";
      calcFeedback.className = "feedback bad";
      return;
    }
    if (answer === M2_VOLUME_ANSWER) {
      m2.experimentSolved = true;
      calcFeedback.textContent = "Betul! Isi padu batu ialah 45 cm³.";
      calcFeedback.className = "feedback ok";
      calcHint.hidden = true;
      recordM2(true, "Eksperimen: betul, 45 cm³");
      showM2Message("Betul! 165 − 120 = 45. Isi padu batu ialah 45 cm³.", "success");
      renderM2();
      enterScreen("m2-buktikan");
      return;
    }
    calcFeedback.textContent = "Belum tepat. Cuba lagi.";
    calcFeedback.className = "feedback bad";
    calcHint.hidden = false;
    recordM2(false, "Eksperimen: salah");
    showM2Message("Belum tepat. Gunakan petunjuk, kemudian cuba lagi.", "warn");
    narrateFeedback("cuba");
  }

  function checkM2Bukti(event) {
    var answer;
    event.preventDefault();
    if (!m2.experimentSolved || m2.buktiSolved) {
      return;
    }
    answer = readAmount(buktiInput.value);
    if (answer === null) {
      buktiFeedback.textContent = "Tulis nombor dalam cm³ dahulu.";
      buktiFeedback.className = "feedback bad";
      return;
    }
    if (answer === M2_BUKTI_ANSWER) {
      m2.buktiSolved = true;
      buktiFeedback.textContent = "Bagus! Isi padu batu ialah 30 cm³.";
      buktiFeedback.className = "feedback ok";
      recordM2(true, "Buktikan: betul, 30 cm³");
      showM2Message("Bagus! Kamu mengira isi padu batu tanpa petunjuk.", "success");
      renderM2();
      narrateFeedback("selesai");
      document.getElementById("m2-bukti-panel").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    buktiFeedback.textContent = "Belum tepat. Baca soalan sekali lagi dan cuba semula.";
    buktiFeedback.className = "feedback bad";
    recordM2(false, "Buktikan: salah");
    showM2Message("Belum tepat. Cuba semak kiraan kamu sendiri.", "warn");
    narrateFeedback("cuba");
  }

  function pointerDown(event) {
    if (!m2.fikirSolved || m2.dropped || m2.animating) {
      return;
    }
    drag.active = true;
    drag.moved = false;
    drag.x = event.clientX;
    drag.y = event.clientY;
    stone.setPointerCapture(event.pointerId);
    stone.classList.add("is-dragging");
  }

  function pointerMove(event) {
    var dx;
    var dy;
    if (!drag.active) {
      return;
    }
    dx = event.clientX - drag.x;
    dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 8) {
      drag.moved = true;
    }
    stone.style.transform = "translate(" + dx + "px, " + dy + "px)";
  }

  function pointerUp() {
    var stoneRect;
    var zone;
    var hit;
    if (!drag.active) {
      return;
    }
    drag.active = false;
    stone.classList.remove("is-dragging");
    stoneRect = stone.getBoundingClientRect();
    zone = cylinder.getBoundingClientRect();
    hit = stoneRect.right > zone.left && stoneRect.left < zone.right && stoneRect.bottom > zone.top && stoneRect.top < zone.bottom;
    stone.style.transform = "";
    m2.moved = drag.moved;
    if (hit || !drag.moved) {
      submergeStone();
    }
  }

  predictButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      choosePrediction(button.getAttribute("data-predict"));
    });
  });
  hintButton.addEventListener("click", function () {
    if (!m2.fikirSolved) {
      fikirHint.hidden = false;
    }
  });
  calcHintButton.addEventListener("click", function () {
    if (!m2.experimentSolved) {
      calcHint.hidden = false;
    }
  });
  calcForm.addEventListener("submit", checkCalc);
  buktiForm.addEventListener("submit", checkM2Bukti);
  document.getElementById("m2-reset").addEventListener("click", resetM2);
  stone.addEventListener("pointerdown", pointerDown);
  stone.addEventListener("pointermove", pointerMove);
  stone.addEventListener("pointerup", pointerUp);
  stone.addEventListener("pointercancel", pointerUp);
  stone.addEventListener("click", function () {
    if (m2.moved) {
      m2.moved = false;
      return;
    }
    submergeStone();
  });

  buildM2Scale();
  renderM2();

  var M2_EXP_KEY = "nexa-m2-exp-debug";
  var m2ExpTimer = 0;
  var m2ExpToken = 0;
  var m2ExpBusy = false;
  var m2ExpPractice = false;
  var m2ExpVolume = 120;
  var m2AdvanceToken = 0;
  var m2ExpFrame = document.getElementById("m2-frame");
  var m2ExpLayout;
  var m2ExpDefaults = {
    stone20: { left: 4, top: 63, width: 30, height: 16 },
    stone45: { left: 35, top: 63, width: 30, height: 16 },
    stone60: { left: 66, top: 63, width: 30, height: 16 },
    reset: { left: 27, top: 81.2, width: 46, height: 6.2 },
    dengar: { left: 2.5, top: 88.2, width: 45, height: 7.2 },
    bantu: { left: 52.5, top: 88.2, width: 45, height: 7.2 },
    water: { x: 55, y: 38, width: 21, height: 24, clip: 0, radius: 8, line120: 52, line140: 59.8, line165: 69.5, line180: 75.3 },
    crystal: { entryX: 46, entryY: 66, finalX: 62, finalY: 50, size: 6 }
  };

  function queueM2Advance(action) {
    m2AdvanceToken += 1;
    var token = m2AdvanceToken;
    return function () {
      if (token !== m2AdvanceToken || missionTwoScreen.hidden) {
        return;
      }
      return action();
    };
  }

  cancelM2Advance = function () {
    var feedback = document.getElementById("m2-feedback");
    var dialog = document.getElementById("m2-dialog");
    var editor = document.getElementById("m2-exp-editor");
    m2AdvanceToken += 1;
    m2ExpToken += 1;
    m2ExpBusy = false;
    if (m2ExpTimer) {
      window.clearTimeout(m2ExpTimer);
      m2ExpTimer = 0;
    }
    if (feedback && !feedback.hidden) {
      feedback.hidden = true;
      m1OutcomeOpen = false;
      m1OutcomeToken += 1;
    }
    if (dialog) {
      dialog.hidden = true;
    }
    if (m2ExpFrame) {
      m2ExpFrame.classList.remove("is-m2-exp-editing");
      m2ExpFrame.classList.remove("is-m2-proof-editing");
    }
    if (editor) {
      editor.hidden = true;
      editor.classList.remove("is-docked");
      editor.classList.remove("is-stacked");
      editor.classList.remove("is-collapsed");
      editor.style.width = "";
    }
    missionTwoScreen.classList.remove("is-m2-editor-stacked");
    var proofEditor = document.getElementById("m2-proof-editor");
    if (proofEditor) {
      proofEditor.hidden = true;
      proofEditor.classList.remove("is-docked");
      proofEditor.classList.remove("is-stacked");
      proofEditor.style.width = "";
    }
  };

  function m2ExpEditing() {
    return !!(m2ExpFrame && m2ExpFrame.classList.contains("is-m2-exp-editing"));
  }

  function showM2FikirScreen() {
    var art = document.getElementById("m2-art");
    document.getElementById("m2-exp-layer").hidden = true;
    document.getElementById("m2-exp-editor").hidden = true;
    document.getElementById("m2-proof-layer").hidden = true;
    document.getElementById("m2-proof-editor").hidden = true;
    document.getElementById("m2-reward").hidden = true;
    missionTwoScreen.classList.remove("is-m2-editor-stacked");
    var pending = assignArt(art, "assets/screens/m2/m2_fikir.png", "Misi 2 Fikir. Paras air naik daripada 120 mL kepada 165 mL. Berapakah isipadu batu kristal?");
    m2ExpFrame.classList.remove("is-m2-exp");
    m2ExpFrame.classList.remove("is-m2-exp-editing");
    m2ExpFrame.classList.remove("is-m2-proof");
    m2ExpFrame.classList.remove("is-m2-proof-editing");
    enterScreen("m2-fikir");
    return pending;
  }

  function placeM2Crystal(mode) {
    var crystal = document.getElementById("m2-exp-crystal");
    var entry = document.getElementById("m2-exp-crystal-entry");
    var spot = m2ExpLayout.crystal;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    crystal.style.width = spot.size + "%";
    entry.style.width = spot.size + "%";
    entry.style.left = spot.entryX + "%";
    entry.style.top = spot.entryY + "%";
    if (mode === "hide") {
      crystal.hidden = true;
      crystal.style.transition = "none";
      return;
    }
    crystal.hidden = false;
    if (mode === "move") {
      crystal.style.transition = "none";
      crystal.style.left = spot.entryX + "%";
      crystal.style.top = spot.entryY + "%";
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          crystal.style.transition = reduce ? "none" : "left 700ms ease, top 700ms ease";
          crystal.style.left = spot.finalX + "%";
          crystal.style.top = spot.finalY + "%";
        });
      });
      return;
    }
    crystal.style.transition = "none";
    crystal.style.left = (mode === "entry" ? spot.entryX : spot.finalX) + "%";
    crystal.style.top = (mode === "entry" ? spot.entryY : spot.finalY) + "%";
  }

  function placeM2ExpWater(volume, animate) {
    var water = m2ExpLayout.water;
    var box = document.getElementById("m2-exp-water");
    var clip = document.getElementById("m2-exp-clip");
    var fill = document.getElementById("m2-exp-fill");
    var label = document.getElementById("m2-exp-level");
    var line = water.line120;
    var radius = water.radius;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (volume >= 180) {
      line = water.line180;
    } else if (volume >= 165) {
      line = water.line165;
    } else if (volume >= 140) {
      line = water.line140;
    }
    if (line < 0) {
      line = 0;
    }
    if (line > 100) {
      line = 100;
    }
    if (radius < 0) {
      radius = 0;
    }
    if (radius > 40) {
      radius = 40;
    }
    box.style.left = water.x + "%";
    box.style.top = water.y + "%";
    box.style.width = water.width + "%";
    box.style.height = water.height + "%";
    box.style.borderRadius = "0 0 " + radius + "% " + radius + "%";
    clip.style.top = water.clip + "%";
    clip.style.right = water.clip + "%";
    clip.style.bottom = water.clip + "%";
    clip.style.left = water.clip + "%";
    clip.style.borderRadius = "0 0 " + Math.max(0, radius - water.clip) + "% " + Math.max(0, radius - water.clip) + "%";
    fill.style.borderRadius = "0";
    fill.style.transition = animate && !reduce ? "height 800ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
    fill.style.height = line + "%";
    label.style.top = (100 - line) + "%";
    label.textContent = volume + " mL";
    m2ExpVolume = volume;
  }

  function clearM2Picked() {
    document.querySelectorAll("[data-m2-stone]").forEach(function (button) {
      button.classList.remove("is-m2-picked");
    });
  }

  function resetM2ExpTrial() {
    m2ExpToken += 1;
    m2ExpBusy = false;
    if (m2ExpTimer) {
      window.clearTimeout(m2ExpTimer);
      m2ExpTimer = 0;
    }
    clearM2Picked();
    placeM2Crystal("hide");
    placeM2ExpWater(120, false);
    if (m2.experimentSolved) {
      m2ExpPractice = true;
    }
  }

  function openM2Experiment(volume) {
    var art = document.getElementById("m2-art");
    if (!m2.fikirSolved) {
      return showM2FikirScreen();
    }
    var pending = assignArt(art, "assets/screens/m2/m2_eksperimen.png", "Misi 2 Eksperimen. Paras awal air ialah 120 mL. Pilih satu batu kristal supaya paras air menjadi 165 mL.");
    m2ExpFrame.classList.add("is-m2-exp");
    m2ExpFrame.classList.remove("is-m2-proof");
    m2ExpFrame.classList.remove("is-m2-proof-editing");
    document.getElementById("m2-exp-layer").hidden = false;
    document.getElementById("m2-proof-layer").hidden = true;
    document.getElementById("m2-proof-editor").hidden = true;
    document.getElementById("m2-reward").hidden = true;
    m2ExpBusy = false;
    m2ExpPractice = false;
    clearM2Picked();
    placeM2ExpWater(volume, false);
    placeM2Crystal(volume === 165 ? "final" : "hide");
    enterScreen("m2-eksperimen");
    return pending;
  }

  function showM2Complete() {
    document.getElementById("m2-exp-layer").hidden = true;
    document.getElementById("m2-proof-layer").hidden = true;
    document.getElementById("m2-proof-editor").hidden = true;
    document.getElementById("m2-dialog").hidden = true;
    m2ExpFrame.classList.remove("is-m2-exp");
    m2ExpFrame.classList.remove("is-m2-exp-editing");
    m2ExpFrame.classList.remove("is-m2-proof");
    m2ExpFrame.classList.remove("is-m2-proof-editing");
    if (!m1OutcomeOpen) {
      document.getElementById("m2-feedback").hidden = true;
    }
    var pending = revealReward("m2-reward");
    renderMap();
    enterScreen("m2-selesai");
    return pending;
  }

  function openM2Buktikan() {
    var art = document.getElementById("m2-art");
    if (!m2.fikirSolved || !m2.experimentSolved) {
      openM2Stage();
      return;
    }
    if (m2.buktiSolved) {
      return showM2Complete();
    }
    var pending = assignArt(art, "assets/screens/m2/m2_buktikan.png", "Misi 2 Buktikan. Pilih pengiraan yang membuktikan paras akhir ialah 165 mililiter.");
    m2ExpFrame.classList.remove("is-m2-exp");
    m2ExpFrame.classList.remove("is-m2-exp-editing");
    m2ExpFrame.classList.add("is-m2-proof");
    document.getElementById("m2-exp-layer").hidden = true;
    document.getElementById("m2-exp-editor").hidden = true;
    document.getElementById("m2-reward").hidden = true;
    document.getElementById("m2-proof-layer").hidden = false;
    enterScreen("m2-buktikan");
    return pending;
  }

  openM2Stage = function () {
    if (!m2.fikirSolved) {
      showM2FikirScreen();
      return;
    }
    if (!m2.experimentSolved) {
      openM2Experiment(120);
      return;
    }
    if (!m2.buktiSolved) {
      openM2Buktikan();
      return;
    }
    showM2Complete();
  };

  function finishM2Stone(amount, token) {
    if (token !== m2ExpToken || missionTwoScreen.hidden || m1OutcomeOpen) {
      m2ExpBusy = false;
      return;
    }
    if (amount === 45) {
      if (!m2.experimentSolved) {
        m2.experimentSolved = true;
        m2ExpPractice = false;
        guideMemory.lastM2ExpWrong = "";
        recordM2(true, "Eksperimen: betul, batu 45 mL");
        renderM2();
        showM2Outcome("betul", queueM2Advance(function () {
          m2ExpBusy = false;
          return openM2Buktikan();
        }));
        return;
      }
      m2ExpBusy = false;
      m2ExpPractice = false;
      placeM2ExpWater(165, false);
      placeM2Crystal("final");
      return;
    }
    guideMemory.lastM2ExpWrong = String(amount);
    if (!m2.experimentSolved) {
      recordM2(false, "Eksperimen: salah, batu " + amount + " mL");
    }
    showM2Outcome("cuba", queueM2Advance(function () {
      resetM2ExpTrial();
    }));
  }

  function beginM2Stone(amount) {
    var token;
    var reduce;
    if (amount !== 20 && amount !== 45 && amount !== 60) {
      return;
    }
    if (m2ExpBusy || m1OutcomeOpen || m2ExpEditing() || !m2.fikirSolved) {
      return;
    }
    if (m2.experimentSolved && !m2ExpPractice) {
      return;
    }
    m2ExpBusy = true;
    m2ExpToken += 1;
    token = m2ExpToken;
    clearM2Picked();
    document.getElementById("m2-stone-" + amount).classList.add("is-m2-picked");
    placeM2Crystal("move");
    placeM2ExpWater(120 + amount, true);
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    m2ExpTimer = window.setTimeout(function () {
      finishM2Stone(amount, token);
    }, reduce ? 800 : 1900);
  }

  function setupM2ExpEditor() {
    var fields = [
      ["stone20", "Batu 20 mL", "m2-stone-20"],
      ["stone45", "Batu 45 mL", "m2-stone-45"],
      ["stone60", "Batu 60 mL", "m2-stone-60"],
      ["reset", "Set semula", "m2-exp-reset"],
      ["dengar", "Dengar", "m2-exp-dengar"],
      ["bantu", "Bantu AI", "m2-exp-bantu"]
    ];
    var boxKeys = ["left", "top", "width", "height"];
    var waterKeys = ["x", "y", "width", "height", "clip", "radius", "line120", "line140", "line165", "line180"];
    var crystalKeys = ["entryX", "entryY", "finalX", "finalY", "size"];
    var host = document.getElementById("m2-exp-fields");
    var readout = document.getElementById("m2-exp-readout");
    var note = document.getElementById("m2-exp-note");
    var editor = document.getElementById("m2-exp-editor");
    var drag = null;

    function round1(value) {
      return Math.round(value * 10) / 10;
    }

    function clampBox(slot) {
      if (slot.width < 4) {
        slot.width = 4;
      }
      if (slot.height < 3) {
        slot.height = 3;
      }
      if (slot.width > 100) {
        slot.width = 100;
      }
      if (slot.height > 80) {
        slot.height = 80;
      }
      if (slot.left < 0) {
        slot.left = 0;
      }
      if (slot.top < 0) {
        slot.top = 0;
      }
      if (slot.left + slot.width > 100) {
        slot.left = round1(100 - slot.width);
      }
      if (slot.top + slot.height > 100) {
        slot.top = round1(100 - slot.height);
      }
      slot.left = round1(slot.left);
      slot.top = round1(slot.top);
      slot.width = round1(slot.width);
      slot.height = round1(slot.height);
    }

    function applyBox(key, id) {
      var slot = m2ExpLayout[key];
      var button = document.getElementById(id);
      button.style.setProperty("--x", slot.left + "%");
      button.style.setProperty("--y", slot.top + "%");
      button.style.setProperty("--w", slot.width + "%");
      button.style.setProperty("--h", slot.height + "%");
      boxKeys.forEach(function (name) {
        var input = document.getElementById("m2-exp-" + key + "-" + name);
        if (input) {
          input.value = String(slot[name]);
        }
      });
    }

    function applyNumbers(group, keys) {
      keys.forEach(function (name) {
        var input = document.getElementById("m2-exp-" + group + "-" + name);
        if (input) {
          input.value = String(m2ExpLayout[group][name]);
        }
      });
    }

    function configText() {
      return JSON.stringify(m2ExpLayout, null, 2);
    }

    function applyAll() {
      var crystal = document.getElementById("m2-exp-crystal");
      fields.forEach(function (field) {
        applyBox(field[0], field[2]);
      });
      placeM2ExpWater(m2ExpVolume, false);
      placeM2Crystal(crystal.hidden ? "hide" : "final");
      applyNumbers("water", waterKeys);
      applyNumbers("crystal", crystalKeys);
      readout.textContent = configText();
    }

    function copyDefaults() {
      m2ExpLayout = JSON.parse(JSON.stringify(m2ExpDefaults));
    }

    function numberOk(value) {
      return typeof value === "number" && isFinite(value);
    }

    function readSaved() {
      var raw;
      var data;
      var index;
      var saved;
      try {
        raw = localStorage.getItem(M2_EXP_KEY);
        if (!raw) {
          return false;
        }
        data = JSON.parse(raw);
      } catch (error) {
        return false;
      }
      for (index = 0; index < fields.length; index += 1) {
        saved = data[fields[index][0]];
        if (!saved || !numberOk(saved.left) || !numberOk(saved.top) || !numberOk(saved.width) || !numberOk(saved.height)) {
          return false;
        }
      }
      if (!data.water || !data.crystal) {
        return false;
      }
      for (index = 0; index < waterKeys.length; index += 1) {
        if (!numberOk(data.water[waterKeys[index]])) {
          return false;
        }
      }
      for (index = 0; index < crystalKeys.length; index += 1) {
        if (!numberOk(data.crystal[crystalKeys[index]])) {
          return false;
        }
      }
      if (data.water.x === 49.5 && data.water.y === 33.2 && data.water.line120 === 42) {
        return false;
      }
      if (data.water.x === 54 && data.water.y === 36 && data.water.width === 24 && data.water.height === 26) {
        return false;
      }
      if (data.water.x === 55 && data.water.y === 38 && data.water.width === 21 && data.water.height === 24 && data.water.line120 === 29 && data.water.line165 === 46) {
        return false;
      }
      m2ExpLayout = data;
      fields.forEach(function (field) {
        clampBox(m2ExpLayout[field[0]]);
      });
      return true;
    }

    function addInputs(title, idPrefix, keys) {
      var fieldset = document.createElement("fieldset");
      var legend = document.createElement("legend");
      legend.textContent = title;
      fieldset.appendChild(legend);
      keys.forEach(function (name) {
        var label = document.createElement("label");
        var input = document.createElement("input");
        label.appendChild(document.createTextNode(name + " "));
        input.id = "m2-exp-" + idPrefix + "-" + name;
        input.type = "number";
        input.step = "0.1";
        label.appendChild(input);
        fieldset.appendChild(label);
      });
      host.appendChild(fieldset);
    }

    function placeM2Editor() {
      var rect;
      var gutter;
      var collapseButton = document.getElementById("m2-exp-collapse");
      editor.classList.remove("is-docked");
      editor.classList.remove("is-stacked");
      editor.style.width = "";
      missionTwoScreen.classList.remove("is-m2-editor-stacked");
      if (editor.hidden) {
        return;
      }
      rect = m2ExpFrame.getBoundingClientRect();
      gutter = window.innerWidth - rect.right;
      if (gutter >= 250) {
        editor.classList.add("is-docked");
        editor.style.width = Math.min(340, Math.floor(gutter - 28)) + "px";
      } else {
        editor.classList.add("is-stacked");
        missionTwoScreen.classList.add("is-m2-editor-stacked");
      }
      if (collapseButton) {
        collapseButton.textContent = editor.classList.contains("is-collapsed") ? "Tunjuk editor" : "Sembunyi panel";
      }
    }

    function setEditing(enabled) {
      var collapseButton = document.getElementById("m2-exp-collapse");
      m2ExpFrame.classList.toggle("is-m2-exp-editing", enabled);
      editor.hidden = !enabled;
      if (!enabled) {
        editor.classList.remove("is-collapsed");
        if (collapseButton) {
          collapseButton.textContent = "Sembunyi panel";
        }
      }
      placeM2Editor();
      if (enabled) {
        m2ExpToken += 1;
        m2ExpBusy = false;
        if (m2ExpTimer) {
          window.clearTimeout(m2ExpTimer);
          m2ExpTimer = 0;
        }
        placeM2Crystal("final");
        note.textContent = "Seret kotak atau sudut kuning. Jawapan tidak dihantar semasa menyunting.";
        return;
      }
      drag = null;
      if (!m2ExpBusy && m2ExpVolume === 120) {
        placeM2Crystal("hide");
      }
      note.textContent = "";
    }

    [120, 140, 165, 180].forEach(function (level) {
      var preview = document.createElement("button");
      preview.type = "button";
      preview.textContent = "Lihat " + level;
      preview.addEventListener("click", function () {
        placeM2ExpWater(level, false);
      });
      editor.insertBefore(preview, readout);
    });
    fields.forEach(function (field) {
      addInputs(field[1], field[0], boxKeys);
    });
    addInputs("Air", "water", waterKeys);
    addInputs("Batu dalam bikar", "crystal", crystalKeys);
    if (!readSaved()) {
      copyDefaults();
    }
    applyAll();

    function bindNumber(group, keys, onChange) {
      keys.forEach(function (name) {
        document.getElementById("m2-exp-" + group + "-" + name).addEventListener("input", function (event) {
          var value = Number(event.target.value);
          if (!isFinite(value)) {
            return;
          }
          m2ExpLayout[group][name] = value;
          onChange();
          readout.textContent = configText();
        });
      });
    }

    fields.forEach(function (field) {
      var button = document.getElementById(field[2]);
      bindNumber(field[0], boxKeys, function () {
        clampBox(m2ExpLayout[field[0]]);
        applyBox(field[0], field[2]);
      });
      button.addEventListener("pointerdown", function (event) {
        var rect;
        if (!m2ExpEditing() || (event.button !== undefined && event.button !== 0)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        rect = m2ExpFrame.getBoundingClientRect();
        drag = {
          pointerId: event.pointerId,
          kind: "box",
          key: field[0],
          resize: event.target.classList.contains("m2-exp-handle"),
          startX: event.clientX,
          startY: event.clientY,
          left: m2ExpLayout[field[0]].left,
          top: m2ExpLayout[field[0]].top,
          width: m2ExpLayout[field[0]].width,
          height: m2ExpLayout[field[0]].height,
          frameWidth: rect.width,
          frameHeight: rect.height
        };
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener("pointermove", function (event) {
        var dx;
        var dy;
        var slot;
        if (!drag || drag.kind !== "box" || drag.pointerId !== event.pointerId || drag.key !== field[0]) {
          return;
        }
        event.preventDefault();
        dx = (event.clientX - drag.startX) / drag.frameWidth * 100;
        dy = (event.clientY - drag.startY) / drag.frameHeight * 100;
        slot = m2ExpLayout[field[0]];
        if (drag.resize) {
          slot.left = drag.left;
          slot.top = drag.top;
          slot.width = drag.width + dx;
          slot.height = drag.height + dy;
        } else {
          slot.left = drag.left + dx;
          slot.top = drag.top + dy;
          slot.width = drag.width;
          slot.height = drag.height;
        }
        clampBox(slot);
        applyBox(field[0], field[2]);
        readout.textContent = configText();
      });
      button.addEventListener("pointerup", function (event) {
        if (drag && drag.pointerId === event.pointerId) {
          drag = null;
        }
      });
    });

    bindNumber("water", waterKeys, function () {
      placeM2ExpWater(m2ExpVolume, false);
      applyNumbers("water", waterKeys);
    });
    bindNumber("crystal", crystalKeys, function () {
      placeM2Crystal(document.getElementById("m2-exp-crystal").hidden ? "hide" : "final");
      applyNumbers("crystal", crystalKeys);
    });

    function dragPoint(element, read, write) {
      element.addEventListener("pointerdown", function (event) {
        var rect;
        var point;
        if (!m2ExpEditing() || (event.button !== undefined && event.button !== 0)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        rect = m2ExpFrame.getBoundingClientRect();
        point = read();
        drag = {
          pointerId: event.pointerId,
          kind: "point",
          element: element,
          resize: event.target.id === "m2-exp-water-handle",
          startX: event.clientX,
          startY: event.clientY,
          point: point,
          frameWidth: rect.width,
          frameHeight: rect.height,
          write: write
        };
        element.setPointerCapture(event.pointerId);
      });
      element.addEventListener("pointermove", function (event) {
        var dx;
        var dy;
        var next;
        if (!drag || drag.kind !== "point" || drag.element !== element || drag.pointerId !== event.pointerId) {
          return;
        }
        event.preventDefault();
        dx = (event.clientX - drag.startX) / drag.frameWidth * 100;
        dy = (event.clientY - drag.startY) / drag.frameHeight * 100;
        next = { x: drag.point.x, y: drag.point.y, width: drag.point.width, height: drag.point.height };
        if (drag.resize) {
          next.width = round1(drag.point.width + dx);
          next.height = round1(drag.point.height + dy);
        } else {
          next.x = round1(drag.point.x + dx);
          next.y = round1(drag.point.y + dy);
        }
        drag.write(next, drag.resize);
        readout.textContent = configText();
      });
      element.addEventListener("pointerup", function (event) {
        if (drag && drag.pointerId === event.pointerId) {
          drag = null;
        }
      });
    }

    dragPoint(document.getElementById("m2-exp-water"), function () {
      return { x: m2ExpLayout.water.x, y: m2ExpLayout.water.y, width: m2ExpLayout.water.width, height: m2ExpLayout.water.height };
    }, function (next) {
      m2ExpLayout.water.x = next.x;
      m2ExpLayout.water.y = next.y;
      m2ExpLayout.water.width = next.width;
      m2ExpLayout.water.height = next.height;
      placeM2ExpWater(m2ExpVolume, false);
      applyNumbers("water", waterKeys);
    });
    dragPoint(document.getElementById("m2-exp-crystal"), function () {
      return { x: m2ExpLayout.crystal.finalX, y: m2ExpLayout.crystal.finalY, width: m2ExpLayout.crystal.size, height: m2ExpLayout.crystal.size };
    }, function (next, resizing) {
      m2ExpLayout.crystal.finalX = next.x;
      m2ExpLayout.crystal.finalY = next.y;
      if (resizing) {
        m2ExpLayout.crystal.size = next.width;
      }
      placeM2Crystal("final");
      applyNumbers("crystal", crystalKeys);
    });
    dragPoint(document.getElementById("m2-exp-crystal-entry"), function () {
      return { x: m2ExpLayout.crystal.entryX, y: m2ExpLayout.crystal.entryY, width: m2ExpLayout.crystal.size, height: m2ExpLayout.crystal.size };
    }, function (next) {
      m2ExpLayout.crystal.entryX = next.x;
      m2ExpLayout.crystal.entryY = next.y;
      placeM2Crystal("final");
      applyNumbers("crystal", crystalKeys);
    });

    document.getElementById("m2-exp-save").addEventListener("click", function () {
      try {
        localStorage.setItem(M2_EXP_KEY, configText());
        note.textContent = "Disimpan dalam pelayar ini.";
      } catch (error) {
        note.textContent = "Tidak dapat disimpan dalam pelayar ini.";
      }
    });
    document.getElementById("m2-exp-layout-reset").addEventListener("click", function () {
      copyDefaults();
      try {
        localStorage.removeItem(M2_EXP_KEY);
      } catch (error) {}
      applyAll();
      note.textContent = "Tetapan asal sementara.";
    });
    document.getElementById("m2-exp-copy").addEventListener("click", function () {
      var text = configText();
      readout.textContent = text;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          note.textContent = "Tetapan disalin.";
        }, function () {
          note.textContent = "Salin teks di bawah.";
        });
        return;
      }
      note.textContent = "Salin teks di bawah.";
    });
    document.getElementById("m2-exp-close").addEventListener("click", function () {
      setEditing(false);
    });
    document.getElementById("m2-exp-collapse").addEventListener("click", function () {
      editor.classList.toggle("is-collapsed");
      placeM2Editor();
    });
    window.addEventListener("resize", placeM2Editor);
    editor.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
    document.addEventListener("keydown", function (event) {
      if (event.code !== "KeyE" || !event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.repeat) {
        return;
      }
      if (missionTwoScreen.hidden || m2ExpFrame.classList.contains("is-m2-proof")) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!m2ExpFrame.classList.contains("is-m2-exp")) {
        return;
      }
      setEditing(!m2ExpFrame.classList.contains("is-m2-exp-editing"));
    }, true);
  }

  setupM2ExpEditor();
  document.querySelectorAll("[data-m2-stone]").forEach(function (button) {
    button.addEventListener("click", function () {
      beginM2Stone(Number(button.getAttribute("data-m2-stone")));
    });
  });
  document.getElementById("m2-exp-reset").addEventListener("click", function () {
    if (m2ExpEditing() || m1OutcomeOpen) {
      return;
    }
    resetM2ExpTrial();
  });
  document.getElementById("m2-exp-dengar").addEventListener("click", function () {
    if (m2ExpEditing()) {
      return;
    }
    replayCurrentInstruction();
  });
  document.getElementById("m2-exp-bantu").addEventListener("click", function () {
    if (m2ExpEditing() || m2ExpBusy || m1OutcomeOpen) {
      return;
    }
    openGuidedHelp("m2-eksperimen");
  });

  function setupM2Proof() {
    var KEY = "nexa-m2-proof-hotspots";
    var fields = [
      ["sum", "120 + 45 = 165", "m2-proof-sum", 5.1, 71.2, 88.6, 5.2],
      ["low", "120 + 20 = 140", "m2-proof-low", 5.3, 77.2, 88.6, 5.4],
      ["high", "120 + 60 = 180", "m2-proof-high", 5.1, 83, 89.5, 5.6],
      ["dengar", "Dengar", "m2-proof-dengar", 3.4, 90, 31.2, 6.5],
      ["bantu", "Bantu AI", "m2-proof-bantu", 65.7, 90.3, 31, 6.2]
    ];
    var keys = ["left", "top", "width", "height"];
    var layout = [];
    var host = document.getElementById("m2-proof-fields");
    var readout = document.getElementById("m2-proof-readout");
    var note = document.getElementById("m2-proof-note");
    var editor = document.getElementById("m2-proof-editor");
    var drag = null;

    function round1(value) {
      return Math.round(value * 10) / 10;
    }

    function clamp(slot) {
      if (slot.width < 4) { slot.width = 4; }
      if (slot.height < 3) { slot.height = 3; }
      if (slot.left < 0) { slot.left = 0; }
      if (slot.top < 0) { slot.top = 0; }
      if (slot.left + slot.width > 100) { slot.left = round1(100 - slot.width); }
      if (slot.top + slot.height > 100) { slot.top = round1(100 - slot.height); }
      slot.left = round1(slot.left);
      slot.top = round1(slot.top);
      slot.width = round1(slot.width);
      slot.height = round1(slot.height);
    }

    function text() {
      var data = {};
      layout.forEach(function (slot) {
        data[slot.key] = { left: slot.left, top: slot.top, width: slot.width, height: slot.height };
      });
      return JSON.stringify(data, null, 2);
    }

    function applySlot(slot) {
      var button = document.getElementById(slot.id);
      button.style.setProperty("--x", slot.left + "%");
      button.style.setProperty("--y", slot.top + "%");
      button.style.setProperty("--w", slot.width + "%");
      button.style.setProperty("--h", slot.height + "%");
      keys.forEach(function (name) {
        var input = document.getElementById("m2-proof-" + slot.key + "-" + name);
        if (input) { input.value = String(slot[name]); }
      });
    }

    function applyAll() {
      layout.forEach(applySlot);
      readout.textContent = text();
    }

    function fromDefaults() {
      layout = fields.map(function (field) {
        return { key: field[0], name: field[1], id: field[2], left: field[3], top: field[4], width: field[5], height: field[6] };
      });
    }

    function readSaved() {
      var raw;
      var data;
      var index;
      var saved;
      try {
        raw = localStorage.getItem(KEY);
        if (!raw) { return false; }
        data = JSON.parse(raw);
      } catch (error) {
        return false;
      }
      fromDefaults();
      for (index = 0; index < layout.length; index += 1) {
        saved = data[layout[index].key];
        if (!saved || typeof saved.left !== "number" || typeof saved.top !== "number" || typeof saved.width !== "number" || typeof saved.height !== "number") {
          return false;
        }
        layout[index].left = saved.left;
        layout[index].top = saved.top;
        layout[index].width = saved.width;
        layout[index].height = saved.height;
        clamp(layout[index]);
      }
      return true;
    }

    function placeEditor() {
      var rect;
      var gutter;
      editor.classList.remove("is-docked");
      editor.classList.remove("is-stacked");
      editor.style.width = "";
      if (editor.hidden) {
        if (!document.getElementById("m2-exp-editor") || document.getElementById("m2-exp-editor").hidden) {
          missionTwoScreen.classList.remove("is-m2-editor-stacked");
        }
        return;
      }
      rect = m2ExpFrame.getBoundingClientRect();
      gutter = window.innerWidth - rect.right;
      if (gutter >= 250) {
        editor.classList.add("is-docked");
        editor.style.width = Math.min(340, Math.floor(gutter - 28)) + "px";
        missionTwoScreen.classList.remove("is-m2-editor-stacked");
        return;
      }
      editor.classList.add("is-stacked");
      missionTwoScreen.classList.add("is-m2-editor-stacked");
    }

    function setEditing(enabled) {
      m2ExpFrame.classList.toggle("is-m2-proof-editing", enabled);
      editor.hidden = !enabled;
      placeEditor();
      note.textContent = enabled ? "Seret kotak atau sudut kuning. Jawapan tidak dihantar semasa menyunting." : "";
    }

    fromDefaults();
    fields.forEach(function (field) {
      var fieldset = document.createElement("fieldset");
      var legend = document.createElement("legend");
      legend.textContent = field[1];
      fieldset.appendChild(legend);
      keys.forEach(function (name) {
        var label = document.createElement("label");
        var input = document.createElement("input");
        input.id = "m2-proof-" + field[0] + "-" + name;
        input.type = "number";
        input.step = "0.1";
        label.appendChild(document.createTextNode(name + " "));
        label.appendChild(input);
        fieldset.appendChild(label);
      });
      host.appendChild(fieldset);
    });
    if (!readSaved()) { fromDefaults(); }
    applyAll();
    layout.forEach(function (slot, index) {
      var button = document.getElementById(slot.id);
      keys.forEach(function (name) {
        document.getElementById("m2-proof-" + slot.key + "-" + name).addEventListener("input", function (event) {
          var value = Number(event.target.value);
          if (!isFinite(value)) { return; }
          layout[index][name] = value;
          clamp(layout[index]);
          applySlot(layout[index]);
          readout.textContent = text();
        });
      });
      button.addEventListener("pointerdown", function (event) {
        var rect;
        if (!m2ExpFrame.classList.contains("is-m2-proof-editing") || (event.button !== undefined && event.button !== 0)) { return; }
        event.preventDefault();
        event.stopPropagation();
        rect = m2ExpFrame.getBoundingClientRect();
        drag = {
          pointerId: event.pointerId,
          index: index,
          resize: event.target.classList.contains("m2-exp-handle"),
          startX: event.clientX,
          startY: event.clientY,
          left: layout[index].left,
          top: layout[index].top,
          width: layout[index].width,
          height: layout[index].height,
          frameWidth: rect.width,
          frameHeight: rect.height
        };
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener("pointermove", function (event) {
        var dx;
        var dy;
        if (!drag || drag.pointerId !== event.pointerId || drag.index !== index) { return; }
        dx = (event.clientX - drag.startX) / drag.frameWidth * 100;
        dy = (event.clientY - drag.startY) / drag.frameHeight * 100;
        if (drag.resize) {
          layout[index].width = drag.width + dx;
          layout[index].height = drag.height + dy;
        } else {
          layout[index].left = drag.left + dx;
          layout[index].top = drag.top + dy;
        }
        clamp(layout[index]);
        applySlot(layout[index]);
        readout.textContent = text();
      });
      button.addEventListener("pointerup", function (event) {
        if (drag && drag.pointerId === event.pointerId) { drag = null; }
      });
      button.addEventListener("click", function () {
        var equation;
        if (m2ExpFrame.classList.contains("is-m2-proof-editing") || m1OutcomeOpen || !m2.experimentSolved || m2.buktiSolved) { return; }
        if (slot.key === "dengar") { replayCurrentInstruction(); return; }
        if (slot.key === "bantu") { openGuidedHelp("m2-buktikan"); return; }
        equation = button.getAttribute("data-m2-proof");
        if (equation === "120+45=165") {
          m2.buktiSolved = true;
          guideMemory.lastM2ProofWrong = "";
          recordM2(true, "Buktikan: betul, 120 + 45 = 165");
          renderM2();
          showM2Outcome("betul", queueM2Advance(function () { return showM2Complete(); }));
          return;
        }
        if (equation !== "120+20=140" && equation !== "120+60=180") { return; }
        guideMemory.lastM2ProofWrong = equation;
        recordM2(false, "Buktikan: salah, " + equation);
        showM2Outcome("cuba", function () { return; });
      });
    });
    document.getElementById("m2-proof-save").addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, text());
        note.textContent = "Disimpan dalam pelayar ini.";
      } catch (error) {
        note.textContent = "Tidak dapat disimpan dalam pelayar ini.";
      }
    });
    document.getElementById("m2-proof-layout-reset").addEventListener("click", function () {
      fromDefaults();
      try { localStorage.removeItem(KEY); } catch (error) {}
      applyAll();
      note.textContent = "Tetapan asal sementara.";
    });
    document.getElementById("m2-proof-copy").addEventListener("click", function () {
      var value = text();
      readout.textContent = value;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { note.textContent = "Tetapan disalin."; }, function () { note.textContent = "Salin teks di bawah."; });
        return;
      }
      note.textContent = "Salin teks di bawah.";
    });
    document.getElementById("m2-proof-close").addEventListener("click", function () { setEditing(false); });
    editor.addEventListener("pointerdown", function (event) { event.stopPropagation(); });
    document.getElementById("m2-reward-next").addEventListener("click", function () {
      document.getElementById("m2-reward").hidden = true;
      showMissionThree();
    });
    document.getElementById("m2-reward-map").addEventListener("click", showMap);
    window.addEventListener("resize", placeEditor);
    document.addEventListener("keydown", function (event) {
      if (event.code !== "KeyE" || !event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.repeat) { return; }
      if (missionTwoScreen.hidden || !m2ExpFrame.classList.contains("is-m2-proof")) { return; }
      event.preventDefault();
      event.stopImmediatePropagation();
      setEditing(!m2ExpFrame.classList.contains("is-m2-proof-editing"));
    }, true);
  }

  setupM2Proof();

  document.querySelectorAll("[data-m2-choice]").forEach(function (button) {
    button.addEventListener("click", function () {
      var choice = button.getAttribute("data-m2-choice");
      if (m1OutcomeOpen || m2.fikirSolved) {
        return;
      }
      if (choice === "45") {
        m2.fikirSolved = true;
        guideMemory.lastM2FikirWrong = "";
        recordM2(true, "Fikir: betul, 45 mL");
        renderM2();
        showM2Outcome("betul", queueM2Advance(function () {
          return openM2Experiment(120);
        }));
        return;
      }
      guideMemory.lastM2FikirWrong = choice;
      recordM2(false, "Fikir: salah, " + choice + " mL");
      showM2Outcome("cuba", function () {
        return;
      });
    });
  });
  document.getElementById("m2-dengar").addEventListener("click", function () {
    replayCurrentInstruction();
  });
  document.getElementById("m2-bantu").addEventListener("click", function () {
    openGuidedHelp("m2-fikir");
  });
  document.getElementById("m2-back").addEventListener("click", showMap);
  document.getElementById("m2-dialog-close").addEventListener("click", function () {
    document.getElementById("m2-dialog").hidden = true;
  });
  }

  function setupMissionThree() {
  var M3_START = 700;
  var M3_AFTER_LEAK = 600;
  var M3_TARGET = 1000;
  var M3_MAX = 1000;
  var M3_ADD = 400;
  var M3_FIKIR = 1000;
  var M3_BUKTI = 300;
  var MOVE_MS = 900;

  var m3 = {
    fikirSolved: false,
    valveClosed: false,
    animating: false,
    seenLevel: false,
    calcSolved: false,
    transferred: false,
    experimentSolved: false,
    buktiSolved: false,
    volume: M3_START,
    token: 0,
    correct: 0,
    incorrect: 0,
    log: []
  };

  getM3ScreenId = function () {
    if (!m3.fikirSolved) {
      return "m3-fikir";
    }
    if (!m3.experimentSolved) {
      return "m3-eksperimen";
    }
    if (!m3.buktiSolved) {
      return "m3-buktikan";
    }
    return "m3-selesai";
  };

  var tank = document.getElementById("m3-tank");
  var water = document.getElementById("m3-water");
  var scale = document.getElementById("m3-scale");
  var volumeText = document.getElementById("m3-volume-text");
  var valveButton = document.getElementById("m3-valve");
  var transferButton = document.getElementById("m3-transfer");
  var message = document.getElementById("m3-message");
  var fikirForm = document.getElementById("m3-fikir-form");
  var fikirInput = document.getElementById("m3-fikir-input");
  var fikirFeedback = document.getElementById("m3-fikir-feedback");
  var fikirHint = document.getElementById("m3-fikir-hint");
  var hintButton = document.getElementById("m3-hint-button");
  var eksperimenNote = document.getElementById("m3-eksperimen-note");
  var eksperimenStatus = document.getElementById("m3-eksperimen-status");
  var calcPanel = document.getElementById("m3-calc-panel");
  var calcForm = document.getElementById("m3-calc-form");
  var calcInput = document.getElementById("m3-calc-input");
  var calcFeedback = document.getElementById("m3-calc-feedback");
  var calcHint = document.getElementById("m3-calc-hint");
  var calcHintButton = document.getElementById("m3-calc-hint-button");
  var buktiPanel = document.getElementById("m3-bukti-panel");
  var buktiForm = document.getElementById("m3-bukti-form");
  var buktiInput = document.getElementById("m3-bukti-input");
  var buktiFeedback = document.getElementById("m3-bukti-feedback");
  var correctCount = document.getElementById("m3-correct-count");
  var incorrectCount = document.getElementById("m3-incorrect-count");
  var attemptLog = document.getElementById("m3-attempt-log");

  m3Complete = function () {
    return m3.fikirSolved && m3.experimentSolved && m3.buktiSolved;
  };

  function readAmount(value) {
    var cleaned = String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/ml/g, "");
    if (!/^\d+$/.test(cleaned)) {
      return null;
    }
    return Number(cleaned);
  }

  function showM3Message(text, type) {
    message.textContent = text;
    message.className = "message" + (type ? " " + type : "");
  }

  function recordM3(correct, label) {
    if (correct) {
      m3.correct += 1;
    } else {
      m3.incorrect += 1;
    }
    m3.log.push({ correct: correct, label: label });
    correctCount.textContent = String(m3.correct);
    incorrectCount.textContent = String(m3.incorrect);
    attemptLog.textContent = "";
    m3.log.forEach(function (entry) {
      var item = document.createElement("li");
      item.className = entry.correct ? "log-ok" : "log-bad";
      item.textContent = entry.label;
      attemptLog.appendChild(item);
    });
    renderMap();
  }

  function renderM3() {
    water.style.height = (m3.volume / M3_MAX) * 100 + "%";
    volumeText.textContent = m3.volume + " mL";
    tank.classList.toggle("is-leaking", m3.fikirSolved && !m3.valveClosed && !m3.animating);
    valveButton.disabled = !m3.fikirSolved || m3.valveClosed || m3.animating;
    transferButton.disabled = !m3.calcSolved || m3.transferred || m3.animating || !m3.valveClosed;
    transferButton.classList.toggle("is-empty", m3.transferred);
    fikirForm.hidden = m3.fikirSolved;
    hintButton.hidden = m3.fikirSolved;
    eksperimenNote.hidden = !m3.fikirSolved;
    calcPanel.hidden = !m3.seenLevel;
    calcForm.hidden = m3.calcSolved;
    calcHintButton.hidden = m3.calcSolved;
    buktiPanel.hidden = !m3.experimentSolved;
    buktiForm.hidden = m3.buktiSolved;
    if (!m3.fikirSolved) {
      eksperimenStatus.textContent = "Tangki ada 700 mL dan bocor tepat 100 mL. Tekan Tutup injap.";
    } else if (!m3.valveClosed) {
      eksperimenStatus.textContent = "Tangki ada 700 mL. Bocoran ini tepat 100 mL. Tekan Tutup injap.";
    } else if (!m3.calcSolved) {
      eksperimenStatus.textContent = "Injap sudah ditutup. Air tinggal 600 mL. Kira 1000 − 600.";
    } else if (!m3.transferred) {
      eksperimenStatus.textContent = "Kamu perlukan 400 mL. Pindah air dari bekas simpanan.";
    } else {
      eksperimenStatus.textContent = "Tangki kini 1000 mL. Jawab soalan Buktikan sendiri.";
    }
    setPhase("m3-phase-fikir", m3.fikirSolved ? "done" : "active");
    setPhase("m3-phase-eksperimen", !m3.fikirSolved ? "locked" : (m3.experimentSolved ? "done" : "active"));
    setPhase("m3-phase-buktikan", !m3.experimentSolved ? "locked" : (m3.buktiSolved ? "done" : "active"));
  }

  function buildM3Scale() {
    var mark;
    for (mark = 0; mark <= M3_MAX; mark += 50) {
      var tick = document.createElement("span");
      tick.className = mark % 200 === 0 ? "tick major" : "tick";
      tick.style.bottom = (mark / M3_MAX) * 100 + "%";
      if (mark % 200 === 0) {
        var label = document.createElement("span");
        label.textContent = String(mark);
        tick.appendChild(label);
      }
      scale.appendChild(tick);
    }
  }

  function waitMotion(token, done) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(function () {
      if (token !== m3.token) {
        return;
      }
      done();
    }, reduceMotion ? 0 : MOVE_MS);
  }

  function checkM3Fikir(event) {
    var answer;
    event.preventDefault();
    if (m3.fikirSolved) {
      return;
    }
    answer = readAmount(fikirInput.value);
    if (answer === null) {
      fikirFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      fikirFeedback.className = "feedback bad";
      return;
    }
    if (answer === M3_FIKIR) {
      m3.fikirSolved = true;
      fikirFeedback.textContent = "Betul! 1 L = 1000 mL.";
      fikirFeedback.className = "feedback ok";
      fikirHint.hidden = true;
      recordM3(true, "Fikir: betul, 1000 mL");
      showM3Message("Betul! Sekarang tutup injap tangki yang bocor.", "success");
      renderM3();
      enterScreen("m3-eksperimen");
      return;
    }
    fikirFeedback.textContent = "Belum tepat. Cuba lagi.";
    fikirFeedback.className = "feedback bad";
    fikirHint.hidden = false;
    recordM3(false, "Fikir: salah");
    showM3Message("Belum tepat. Fikir tentang 1 liter.", "warn");
    narrateFeedback("cuba");
  }

  function closeValve() {
    var token;
    if (!m3.fikirSolved || m3.valveClosed || m3.animating) {
      if (!m3.fikirSolved) {
        showM3Message("Jawab soalan Fikir dahulu. 1 L sama dengan berapa mL?", "warn");
      }
      return;
    }
    m3.token += 1;
    token = m3.token;
    m3.animating = true;
    m3.valveClosed = true;
    m3.volume = M3_AFTER_LEAK;
    showM3Message("Injap ditutup. Air bocor tepat 100 mL.");
    renderM3();
    waitMotion(token, function () {
      m3.animating = false;
      m3.seenLevel = true;
      showM3Message("Air tinggal 600 mL. Kira 1000 − 600.");
      renderM3();
      if (!m3.calcSolved) {
        calcPanel.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function checkM3Calc(event) {
    var answer;
    event.preventDefault();
    if (!m3.seenLevel || m3.calcSolved) {
      return;
    }
    answer = readAmount(calcInput.value);
    if (answer === null) {
      calcFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      calcFeedback.className = "feedback bad";
      return;
    }
    if (answer === M3_ADD) {
      m3.calcSolved = true;
      calcFeedback.textContent = "Betul! Kamu perlukan 400 mL.";
      calcFeedback.className = "feedback ok";
      calcHint.hidden = true;
      recordM3(true, "Eksperimen: betul, perlu 400 mL");
      showM3Message("Betul! Tekan butang untuk pindah 400 mL.", "success");
      renderM3();
      narrateFeedback("betul");
      return;
    }
    calcFeedback.textContent = "Belum tepat. Cuba lagi.";
    calcFeedback.className = "feedback bad";
    calcHint.hidden = false;
    recordM3(false, "Eksperimen: salah");
    showM3Message("Belum tepat. Gunakan petunjuk, kemudian cuba lagi.", "warn");
    narrateFeedback("cuba");
  }

  function transferWater() {
    var token;
    if (!m3.calcSolved || !m3.valveClosed || m3.transferred || m3.animating) {
      if (!m3.calcSolved) {
        showM3Message("Kira dahulu berapa mL perlu ditambah.", "warn");
      }
      return;
    }
    m3.token += 1;
    token = m3.token;
    m3.animating = true;
    m3.transferred = true;
    m3.volume = M3_TARGET;
    showM3Message("Air simpanan sedang dipindahkan.");
    renderM3();
    waitMotion(token, function () {
      m3.animating = false;
      if (!m3.experimentSolved) {
        m3.experimentSolved = true;
        recordM3(true, "Eksperimen: tangki tepat 1000 mL");
      }
      showM3Message("Tangki kini 1000 mL. 600 + 400 = 1000.", "success");
      renderM3();
      enterScreen("m3-buktikan");
    });
  }

  function resetM3() {
    m3.token += 1;
    m3.volume = M3_START;
    m3.valveClosed = false;
    m3.animating = false;
    m3.transferred = false;
    m3.seenLevel = false;
    if (!m3.calcSolved) {
      calcFeedback.textContent = "";
      calcInput.value = "";
    }
    showM3Message(m3.fikirSolved
      ? "Eksperimen diset semula. Tangki kembali ke 700 mL."
      : "Tangki kembali ke 700 mL. Kira 1 L dahulu.");
    renderM3();
  }

  function checkM3Bukti(event) {
    var answer;
    event.preventDefault();
    if (!m3.experimentSolved || m3.buktiSolved) {
      return;
    }
    answer = readAmount(buktiInput.value);
    if (answer === null) {
      buktiFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      buktiFeedback.className = "feedback bad";
      return;
    }
    if (answer === M3_BUKTI) {
      m3.buktiSolved = true;
      buktiFeedback.textContent = "Bagus! Air yang perlu ditambah ialah 300 mL.";
      buktiFeedback.className = "feedback ok";
      recordM3(true, "Buktikan: betul, 300 mL");
      showM3Message("Bagus! Kamu mengira air yang perlu ditambah tanpa petunjuk.", "success");
      renderM3();
      narrateFeedback("selesai");
      return;
    }
    buktiFeedback.textContent = "Belum tepat. Baca soalan sekali lagi dan cuba semula.";
    buktiFeedback.className = "feedback bad";
    recordM3(false, "Buktikan: salah");
    showM3Message("Belum tepat. Cuba semak kiraan kamu sendiri.", "warn");
    narrateFeedback("cuba");
  }

  fikirForm.addEventListener("submit", checkM3Fikir);
  hintButton.addEventListener("click", function () {
    if (!m3.fikirSolved) {
      fikirHint.hidden = false;
    }
  });
  valveButton.addEventListener("click", closeValve);
  calcForm.addEventListener("submit", checkM3Calc);
  calcHintButton.addEventListener("click", function () {
    if (!m3.calcSolved) {
      calcHint.hidden = false;
    }
  });
  transferButton.addEventListener("click", transferWater);
  document.getElementById("m3-reset").addEventListener("click", resetM3);
  buktiForm.addEventListener("submit", checkM3Bukti);

  buildM3Scale();
  renderM3();
  attachM3Picture(m3, recordM3);
  }

  var m1WaterPlaced = false;

  function cloneM1TankDebug() {
    return {
      x: M1_TANK_DEBUG.x,
      y: M1_TANK_DEBUG.y,
      width: M1_TANK_DEBUG.width,
      height: M1_TANK_DEBUG.height,
      borderRadius: M1_TANK_DEBUG.borderRadius,
      clipInset: M1_TANK_DEBUG.clipInset,
      labelX: M1_TANK_DEBUG.labelX,
      labelY: M1_TANK_DEBUG.labelY,
      labelFollow: M1_TANK_DEBUG.labelFollow
    };
  }

  function loadM1TankLayout() {
    var raw;
    var data;
    var keys;
    var index;
    m1TankLayout = cloneM1TankDebug();
    try {
      raw = localStorage.getItem("nexa-m1-tank-debug");
      if (!raw) {
        return;
      }
      data = JSON.parse(raw);
      keys = ["x", "y", "width", "height", "clipInset"];
      for (index = 0; index < keys.length; index += 1) {
        if (typeof data[keys[index]] === "number" && isFinite(data[keys[index]])) {
          m1TankLayout[keys[index]] = data[keys[index]];
        }
      }
      if (typeof data.labelFollow === "boolean") {
        m1TankLayout.labelFollow = data.labelFollow;
      }
      if (data.cylinder === true) {
        if (typeof data.borderRadius === "number" && isFinite(data.borderRadius)) {
          m1TankLayout.borderRadius = data.borderRadius;
        }
        if (typeof data.labelX === "number" && isFinite(data.labelX)) {
          m1TankLayout.labelX = data.labelX;
        }
        if (typeof data.labelY === "number" && isFinite(data.labelY)) {
          m1TankLayout.labelY = data.labelY;
        }
      }
      if (m1TankLayout.borderRadius > 18) {
        m1TankLayout.borderRadius = 8;
      }
    } catch (error) {
      m1TankLayout = cloneM1TankDebug();
    }
  }

  function placeM1Water() {
    var box = document.getElementById("m1-water-box");
    var clip = document.getElementById("m1-water-clip");
    var fill = document.getElementById("m1-water-fill");
    var label = document.getElementById("m1-live-volume");
    var layout;
    var level;
    var animate;
    var bottom;
    var labelTop;
    if (!box || !clip || !fill || !label) {
      return;
    }
    if (!m1TankLayout) {
      loadM1TankLayout();
    }
    layout = m1TankLayout;
    level = state.volume / TARGET_VOLUME;
    bottom = layout.borderRadius;
    if (bottom < 0) {
      bottom = 0;
    }
    if (bottom > 18) {
      bottom = 18;
    }
    animate = m1WaterPlaced && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.style.left = layout.x + "%";
    box.style.top = layout.y + "%";
    box.style.width = layout.width + "%";
    box.style.height = layout.height + "%";
    box.style.borderRadius = "0 0 " + bottom + "% " + bottom + "%";
    clip.style.top = layout.clipInset + "%";
    clip.style.right = layout.clipInset + "%";
    clip.style.bottom = layout.clipInset + "%";
    clip.style.left = layout.clipInset + "%";
    clip.style.borderRadius = "0 0 " + Math.max(0, bottom - layout.clipInset) + "% " + Math.max(0, bottom - layout.clipInset) + "%";
    fill.style.borderRadius = "0";
    fill.style.transition = animate ? "height 800ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
    fill.style.height = (level * 100) + "%";
    label.style.left = layout.labelX + "%";
    if (layout.labelFollow) {
      labelTop = ((1 - level) * 100) + layout.labelY;
    } else {
      labelTop = layout.labelY;
    }
    label.style.top = labelTop + "%";
    label.textContent = state.volume + " mL";
    m1WaterPlaced = true;
  }

  function clearGuideChrome(prefix) {
    var note = document.getElementById(prefix + "-guide-note");
    var taps = document.getElementById(prefix + "-guide-taps");
    var ai = document.getElementById(prefix + "-guide-ai");
    if (note) {
      note.hidden = true;
      note.textContent = "";
    }
    if (taps) {
      taps.hidden = true;
      taps.textContent = "";
    }
    if (ai) {
      ai.hidden = true;
      ai.textContent = "";
    }
  }

  function showM1Dialog(heading, message, showNext, closeLabel, nextLabel) {
    clearGuideChrome("m1");
    var dialog = document.getElementById("m1-dialog");
    var title = document.getElementById("m1-dialog-title");
    var text = document.getElementById("m1-dialog-text");
    var closeButton = document.getElementById("m1-dialog-close");
    var nextButton = document.getElementById("m1-dialog-next");
    if (!dialog) {
      return;
    }
    dialog.removeAttribute("data-m1-action");
    title.textContent = heading;
    text.textContent = message;
    nextButton.hidden = !showNext;
    if (showNext) {
      nextButton.textContent = nextLabel || "Teruskan ke Eksperimen";
      if (nextLabel === "Peta Kota Air") {
        nextButton.setAttribute("data-next", "map");
      } else if (nextLabel === "Teruskan ke Buktikan") {
        nextButton.setAttribute("data-next", "bukti");
      } else {
        nextButton.setAttribute("data-next", "eksperimen");
      }
    }
    closeButton.textContent = closeLabel || (showNext ? "Tutup" : "Cuba lagi");
    dialog.hidden = false;
  }

  var m1OutcomeOpen = false;
  var m1OutcomeToken = 0;

  function showOverflowNotice(space) {
    var dialog = document.getElementById("m1-dialog");
    showM1Dialog(
      "Terlalu banyak air!",
      "Terlalu banyak! Ruang tinggal " + space + " mL sahaja. Air tidak dituang.",
      false,
      "FAHAM"
    );
    if (dialog) {
      dialog.setAttribute("data-m1-action", "overflow");
    }
    speakNow("Air terlalu banyak. Jom cuba sekali lagi!", true);
  }

  // Temporary transition logs. In the browser console, filter for nexa-perf.
  var STAGE_PRELOAD = {
    welcome: ["assets/peta_kota_air.png"],
    demo: ["assets/screens/feedback/betul.png", "assets/screens/feedback/cuba_lagi.png", "assets/peta_kota_air.png"],
    map: ["assets/screens/m1/m1_eksperimen.png", "assets/screens/feedback/betul.png", "assets/screens/feedback/cuba_lagi.png"],
    "m1-fikir": ["assets/screens/feedback/betul.png", "assets/screens/m1/m1_eksperimen.png", "assets/screens/feedback/cuba_lagi.png"],
    "m1-eksperimen": ["assets/screens/feedback/betul.png", "assets/screens/m1/m1_buktikan.png", "assets/screens/feedback/cuba_lagi.png"],
    "m1-buktikan": ["assets/screens/feedback/betul.png", "assets/screens/rewards/misi_selesai.png", "assets/badges/m1_badge.png"],
    "m1-selesai": ["assets/screens/m2/m2_eksperimen.png"],
    "m2-fikir": ["assets/screens/feedback/betul.png", "assets/screens/m2/m2_eksperimen.png", "assets/screens/feedback/cuba_lagi.png"],
    "m2-eksperimen": ["assets/screens/feedback/betul.png", "assets/screens/m2/m2_buktikan.png", "assets/screens/feedback/cuba_lagi.png"],
    "m2-buktikan": ["assets/screens/feedback/betul.png", "assets/screens/rewards/misi_selesai.png", "assets/badges/m2_badge.png"],
    "m2-selesai": ["assets/screens/m3/m3_eksperimen.png"],
    "m3-fikir": ["assets/screens/feedback/betul.png", "assets/screens/m3/m3_eksperimen.png", "assets/screens/feedback/cuba_lagi.png"],
    "m3-eksperimen": ["assets/screens/feedback/betul.png", "assets/screens/m3/m3_buktikan.png", "assets/screens/feedback/cuba_lagi.png"],
    "m3-buktikan": ["assets/screens/feedback/betul.png", "assets/screens/rewards/misi_selesai.png", "assets/badges/m3_badge.png"],
    "m3-selesai": ["assets/screens/m4/m4_eksperimen.png"],
    "m4-fikir": ["assets/screens/feedback/betul.png", "assets/screens/m4/m4_eksperimen.png", "assets/screens/feedback/cuba_lagi.png"],
    "m4-eksperimen": ["assets/screens/feedback/betul.png", "assets/screens/m4/m4_buktikan.png", "assets/screens/feedback/cuba_lagi.png"],
    "m4-buktikan": ["assets/screens/feedback/betul.png", "assets/screens/rewards/misi_selesai.png", "assets/screens/rewards/koleksi_lencana.png", "assets/badges/m4_badge.png"],
    "m4-selesai": ["assets/screens/rewards/koleksi_lencana.png"],
    koleksi: []
  };

  function perfLog(eventName, detail) {
    console.info("[nexa-perf]", Math.round(performance.now()) + "ms", eventName, detail || "");
  }

  function pageBase() {
    var url = new URL(window.location.href);
    var path = url.pathname;
    if (path.charAt(path.length - 1) !== "/" && !/\.[a-z0-9]+$/i.test(path)) {
      path += "/";
    }
    return url.origin + path;
  }

  function assetUrl(path) {
    return new URL(path, pageBase()).href;
  }

  function warmImage(path) {
    var url = assetUrl(path);
    var started;
    var existing;
    var nodes;
    var index;
    if (imageReady[url]) {
      return imageReady[url];
    }
    started = performance.now();
    perfLog("preload-start", path);
    nodes = document.querySelectorAll("img[src]");
    existing = null;
    for (index = 0; index < nodes.length; index += 1) {
      if (nodes[index].getAttribute("src") === path) {
        existing = nodes[index];
        break;
      }
    }
    imageReady[url] = new Promise(function (resolve) {
      var img = existing || new Image();
      var settled = false;
      function finishWarm(ok) {
        if (settled) {
          return;
        }
        settled = true;
        perfLog(ok ? "preload-ready" : "preload-fail", path + " " + Math.round(performance.now() - started) + "ms");
        resolve(!!ok);
      }
      function decodeLoaded() {
        if (img.decode) {
          img.decode().then(function () {
            finishWarm(true);
          }, function () {
            finishWarm(true);
          });
          return;
        }
        finishWarm(true);
      }
      if (existing && existing.complete) {
        if (existing.naturalWidth) {
          decodeLoaded();
        } else {
          finishWarm(false);
        }
        return;
      }
      img.addEventListener("load", decodeLoaded);
      img.addEventListener("error", function () {
        finishWarm(false);
      });
      if (!existing) {
        img.src = url;
      }
    });
    return imageReady[url];
  }

  function warmUpcoming(screenId) {
    var list = STAGE_PRELOAD[screenId];
    var index = 0;
    if (!perfBaseLogged) {
      perfBaseLogged = true;
      perfLog("asset-base", pageBase());
    }
    if (!list || !list.length) {
      return;
    }
    perfLog("preload-plan", screenId + " -> " + list[0]);
    function step() {
      if (index >= list.length) {
        return;
      }
      var path = list[index];
      index += 1;
      warmImage(path).then(step, step);
    }
    step();
  }

  function afterPaint() {
    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          resolve(true);
        });
      });
    });
  }

  function decodeNode(img) {
    function fromWidth() {
      return !!(img && img.complete && img.naturalWidth);
    }
    function waitLoad() {
      return new Promise(function (resolve) {
        function done() {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve(!!img.naturalWidth);
        }
        img.addEventListener("load", done);
        img.addEventListener("error", done);
      });
    }
    if (!img) {
      return Promise.resolve(false);
    }
    if (img.decode) {
      return img.decode().then(function () {
        return !!img.naturalWidth;
      }, function () {
        if (fromWidth()) {
          return true;
        }
        if (img.complete) {
          return false;
        }
        return waitLoad();
      });
    }
    if (img.complete) {
      return Promise.resolve(!!img.naturalWidth);
    }
    return waitLoad();
  }

  function stageFronts(art) {
    var list = [];
    var node = art.nextElementSibling;
    while (node && node.classList && node.classList.contains("stage-front")) {
      list.push(node);
      node = node.nextElementSibling;
    }
    return list;
  }

  function placeFrontOnTop(art, front) {
    var fronts = stageFronts(art);
    var last = fronts.length ? fronts[fronts.length - 1] : art;
    if (last !== front) {
      art.parentNode.insertBefore(front, last.nextSibling);
    }
  }

  function makeStageFront(art) {
    var front = document.createElement("img");
    front.className = "mission-art stage-front";
    front.alt = "";
    front.setAttribute("aria-hidden", "true");
    front.style.zIndex = "1";
    front.style.visibility = "hidden";
    placeFrontOnTop(art, front);
    return front;
  }

  function assignDirect(img, url, path, alt, started) {
    if (alt && img.alt !== undefined) {
      img.alt = alt;
    }
    if ((img.currentSrc || img.src) !== url) {
      perfLog("art-swap", path);
      img.src = url;
    }
    img.style.visibility = "visible";
    return decodeNode(img).then(function (ready) {
      perfLog(ready ? "art-ready" : "art-failed", path + " " + Math.round(performance.now() - started) + "ms");
      return ready;
    });
  }

  function assignArt(art, path, alt) {
    var url = assetUrl(path);
    var started = performance.now();
    var missionArt = art && (art.id === "m1-art" || art.id === "m2-art" || art.id === "m3-art" || art.id === "m4-art");
    if (!art) {
      return Promise.resolve(false);
    }
    return warmImage(path).then(function (ok) {
      var fronts;
      var top;
      var spare;
      var index;
      if (!ok) {
        perfLog("art-failed", path);
        return false;
      }
      if (!missionArt) {
        return assignDirect(art, url, path, alt, started);
      }
      fronts = stageFronts(art);
      top = fronts.length ? fronts[fronts.length - 1] : null;
      if (!m1OutcomeOpen && !top) {
        return assignDirect(art, url, path, alt, started);
      }
      if (top && top.style.visibility !== "hidden" && (top.currentSrc || top.src) === url && top.naturalWidth) {
        if ((art.currentSrc || art.src) !== url) {
          art.src = url;
        }
        if (alt) {
          art.alt = alt;
        }
        perfLog("art-ready", path + " cached");
        return true;
      }
      spare = null;
      for (index = 0; index < fronts.length; index += 1) {
        if (fronts[index] !== top && fronts[index].style.visibility === "hidden") {
          spare = fronts[index];
        }
      }
      if (!spare) {
        if (fronts.length < 2) {
          spare = makeStageFront(art);
        } else {
          spare = fronts[0] === top ? fronts[1] : fronts[0];
          spare.style.visibility = "hidden";
        }
      }
      spare.style.visibility = "hidden";
      placeFrontOnTop(art, spare);
      if ((spare.currentSrc || spare.src) !== url) {
        perfLog("art-swap", path);
        spare.src = url;
      }
      return decodeNode(spare).then(function (ready) {
        if (!ready) {
          spare.style.visibility = "hidden";
          perfLog("art-failed", path);
          return false;
        }
        spare.style.visibility = "visible";
        if ((art.currentSrc || art.src) !== url) {
          art.src = url;
        }
        if (alt) {
          art.alt = alt;
        }
        perfLog("art-ready", path + " " + Math.round(performance.now() - started) + "ms");
        return m1OutcomeOpen ? afterPaint() : true;
      });
    });
  }

  function revealReward(rewardId) {
    var reward = document.getElementById(rewardId);
    var art;
    var badges;
    var waits;
    var index;
    function warmBadge(img) {
      var path = img.getAttribute("src");
      if (!path) {
        return Promise.resolve(true);
      }
      return warmImage(path).then(function (ok) {
        return ok ? decodeNode(img) : false;
      });
    }
    if (!reward) {
      return Promise.resolve(false);
    }
    art = reward.querySelector(".m1-reward-art");
    badges = reward.querySelectorAll(".m1-reward-badge img");
    waits = [assignArt(art, "assets/screens/rewards/misi_selesai.png", art ? (art.getAttribute("alt") || "") : "")];
    for (index = 0; index < badges.length; index += 1) {
      if (!badges[index].hidden) {
        waits.push(warmBadge(badges[index]));
      }
    }
    return Promise.all(waits).then(function (results) {
      for (index = 0; index < results.length; index += 1) {
        if (!results[index]) {
          return false;
        }
      }
      reward.hidden = false;
      perfLog("reward-shown", rewardId);
      return afterPaint();
    });
  }

  function bindFeedbackHotspot(layer) {
    var button = layer.querySelector(".feedback-hotspot");
    if (button) {
      return button;
    }
    button = document.createElement("button");
    button.type = "button";
    button.className = "m1-hotspot feedback-hotspot";
    button.setAttribute("aria-label", "Teruskan");
    button.style.setProperty("--x", "12%");
    button.style.setProperty("--y", "81.5%");
    button.style.setProperty("--w", "76%");
    button.style.setProperty("--h", "11.5%");
    button.hidden = true;
    layer.appendChild(button);
    button.addEventListener("click", function () {
      perfLog("feedback-click", "TERUSKAN");
      if (layer._nexaAdvance) {
        layer._nexaAdvance(true);
      }
    });
    return button;
  }

  function showPortraitFeedback(layerId, artId, line, onDone) {
    var layer = document.getElementById(layerId);
    var art = document.getElementById(artId);
    var token;
    var started = 0;
    var finished = false;
    var timer = 0;
    var isBetul = line.indexOf("Belum tepat") !== 0;
    var src = isBetul ? "assets/screens/feedback/betul.png" : "assets/screens/feedback/cuba_lagi.png";
    var maxWait = narrationMuted || !window.speechSynthesis ? 1800 : Math.min(11000, 2200 + line.length * 75);
    var button;
    if (m1OutcomeOpen) {
      return;
    }
    if (!layer || !art) {
      if (onDone) {
        onDone();
      }
      return;
    }
    m1OutcomeOpen = true;
    m1OutcomeToken += 1;
    token = m1OutcomeToken;
    document.getElementById("m1-dialog").hidden = true;
    document.getElementById("demo-dialog").hidden = true;
    button = bindFeedbackHotspot(layer);
    button.hidden = true;
    var shown = false;
    var imageWait = 0;
    var coverTimer = 0;
    var advanceAttempt = 0;
    perfLog("feedback-request", src);
    function stopImageWatch() {
      window.clearTimeout(imageWait);
      imageWait = 0;
      art.removeEventListener("error", onArtError);
    }
    function onArtError() {
      if (finished || token !== m1OutcomeToken) {
        return;
      }
      perfLog("feedback-image-error", src);
      recoverFromMissingFeedback();
    }
    function recoverFromMissingFeedback() {
      if (shown || finished || token !== m1OutcomeToken) {
        return;
      }
      stopImageWatch();
      layer.hidden = false;
      button.hidden = true;
      perfLog("feedback-image-fallback", src);
      finish(true);
    }
    function finish(force) {
      var wait;
      var pending;
      var advanceAt;
      var myAttempt;
      var committed = false;
      if (finished || token !== m1OutcomeToken) {
        return;
      }
      if (!force) {
        wait = 1400 - (Date.now() - started);
        if (!started || wait > 0) {
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            finish(false);
          }, started ? wait : 200);
          return;
        }
      }
      stopImageWatch();
      finished = true;
      window.clearTimeout(timer);
      window.clearTimeout(coverTimer);
      button.hidden = true;
      advanceAttempt += 1;
      myAttempt = advanceAttempt;
      advanceAt = performance.now();
      perfLog("feedback-advance", (force ? "TERUSKAN" : "auto") + " " + src);
      stopNarration();
      if (onDone) {
        pending = onDone();
      }
      function reveal() {
        if (committed || myAttempt !== advanceAttempt || token !== m1OutcomeToken) {
          return;
        }
        committed = true;
        window.clearTimeout(coverTimer);
        window.requestAnimationFrame(function () {
          if (token !== m1OutcomeToken) {
            return;
          }
          layer.hidden = true;
          m1OutcomeOpen = false;
          layer._nexaAdvance = null;
          perfLog("feedback-hidden", Math.round(performance.now() - advanceAt) + "ms cover");
        });
      }
      function holdForRetry() {
        if (committed || myAttempt !== advanceAttempt || token !== m1OutcomeToken) {
          return;
        }
        window.clearTimeout(coverTimer);
        finished = false;
        layer.hidden = false;
        button.hidden = !isBetul;
        layer._nexaAdvance = finish;
        perfLog("feedback-retry", src);
      }
      if (pending && typeof pending.then === "function") {
        coverTimer = window.setTimeout(function () {
          perfLog("feedback-cover-timeout", src);
          holdForRetry();
        }, 8000);
        pending.then(function (ok) {
          window.clearTimeout(coverTimer);
          if (ok === false) {
            holdForRetry();
            return;
          }
          reveal();
        }, function () {
          window.clearTimeout(coverTimer);
          holdForRetry();
        });
        return;
      }
      reveal();
    }
    layer._nexaAdvance = finish;
    art.addEventListener("error", onArtError);
    imageWait = window.setTimeout(function () {
      perfLog("feedback-image-timeout", src);
      recoverFromMissingFeedback();
    }, 8000);
    function armSpeech() {
      timer = window.setTimeout(function () {
        finish(false);
      }, maxWait);
      if (narrationMuted || !window.speechSynthesis) {
        stopNarration();
        return;
      }
      speakNow(line, true, function () {
        if (token !== m1OutcomeToken) {
          return;
        }
        finish(false);
      });
    }
    warmImage(src).then(function (ok) {
      if (token !== m1OutcomeToken || finished) {
        return;
      }
      if (!ok) {
        perfLog("feedback-image-error", src);
        recoverFromMissingFeedback();
        return;
      }
      art.alt = isBetul ? "Betul. Jawapan anda tepat." : "Cuba lagi. Jawapan belum tepat.";
      if ((art.currentSrc || art.src) !== assetUrl(src)) {
        art.src = assetUrl(src);
      }
      if (finished) {
        return;
      }
      function show() {
        if (token !== m1OutcomeToken || finished) {
          return;
        }
        shown = true;
        stopImageWatch();
        started = Date.now();
        button.hidden = !isBetul;
        layer.hidden = false;
        perfLog("feedback-shown", src);
        armSpeech();
      }
      if (art.decode) {
        art.decode().then(show, show);
        return;
      }
      show();
    });
  }

  function showM1Outcome(kind, onDone) {
    var line = kind === "betul"
      ? "Betul! Syabas! Kamu berjaya!"
      : "Belum tepat. Tidak mengapa. Tekan butang BANTU AI jika kamu memerlukan bantuan.";
    showPortraitFeedback("m1-feedback", "m1-feedback-art", line, onDone);
  }

  function showDemoOutcome(kind, onDone) {
    var line = kind === "betul"
      ? "Betul! Syabas! Kamu berjaya!"
      : "Belum tepat. Tidak mengapa. Tekan butang BANTU AI jika kamu memerlukan bantuan.";
    showPortraitFeedback("demo-feedback", "demo-feedback-art", line, onDone);
  }

  function showM2Outcome(kind, onDone) {
    var line = kind === "betul"
      ? "Betul! Syabas! Kamu berjaya!"
      : "Belum tepat. Tidak mengapa. Tekan butang BANTU AI jika kamu memerlukan bantuan.";
    var dialog = document.getElementById("m2-dialog");
    if (dialog) {
      dialog.hidden = true;
    }
    showPortraitFeedback("m2-feedback", "m2-feedback-art", line, onDone);
  }

  function hideM1CompleteScreen() {
    var reward = document.getElementById("m1-reward");
    if (reward) {
      reward.hidden = true;
    }
  }

  function showRewardBadge(mission) {
    var index;
    var image;
    for (index = 1; index <= 4; index += 1) {
      image = document.getElementById("reward-badge-" + index);
      if (image) {
        image.hidden = index !== mission;
      }
    }
  }

  function showM1CompleteScreen() {
    var feedback = document.getElementById("m1-feedback");
    document.getElementById("m1-dialog").hidden = true;
    showRewardBadge(1);
    if (feedback && !m1OutcomeOpen) {
      feedback.hidden = true;
    }
    return revealReward("m1-reward");
  }

  function syncM1FikirScreen() {
    var stage = "fikir";
    var sheet = document.getElementById("m1-sheet");
    var art = document.getElementById("m1-art");
    var tank = document.getElementById("m1-tank");
    if (state.fikirSolved && (state.buktiSolved || state.experimentMarked || state.completed)) {
      stage = "bukti";
    } else if (state.fikirSolved) {
      stage = "eksperimen";
    }
    if (sheet) {
      sheet.hidden = true;
    }
    document.querySelectorAll(".m1-fikir-only").forEach(function (button) {
      button.hidden = stage !== "fikir";
    });
    document.querySelectorAll(".m1-exp-only").forEach(function (button) {
      button.hidden = stage !== "eksperimen";
    });
    document.querySelectorAll(".m1-bukti-only").forEach(function (button) {
      button.hidden = stage !== "bukti";
    });
    var pending = Promise.resolve(true);
    if (art) {
      if (stage === "bukti") {
        pending = assignArt(art, "assets/screens/m1/m1_buktikan.png", "Misi 1 Buktikan. Pilih pengiraan yang membuktikan paras akhir 250 mL.");
      } else if (stage === "eksperimen") {
        pending = assignArt(art, "assets/screens/m1/m1_eksperimen.png", "Misi 1 Eksperimen. Paras awal 120 mL. Isi sehingga 250 mL.");
      } else {
        pending = assignArt(art, "assets/screens/m1/m1_fikir.png", "Misi 1 Fikir. Tangki ada 120 mL. Sasaran 250 mL.");
      }
    }
    if (tank) {
      tank.hidden = stage !== "eksperimen";
    }
    placeM1Water();
    return pending;
  }

  function setupMissionOnePicture() {
    var dialog = document.getElementById("m1-dialog");
    var closeButton = document.getElementById("m1-dialog-close");
    var nextButton = document.getElementById("m1-dialog-next");

    document.querySelectorAll("[data-m1-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        var submitEvent;
        var wasSolved = state.fikirSolved;
        novaLast.fikir = button.getAttribute("data-m1-choice");
        if (m1OutcomeOpen || wasSolved) {
          return;
        }
        fikirInput.value = button.getAttribute("data-m1-choice");
        submitEvent = new Event("submit", { cancelable: true, bubbles: true });
        fikirForm.dispatchEvent(submitEvent);
        if (state.fikirSolved) {
          showM1Outcome("betul", function () {
            var pending = syncM1FikirScreen();
            enterScreen("m1-eksperimen");
            return pending;
          });
          return;
        }
        guideMemory.fikirFails += 1;
        guideMemory.lastFikirWrong = novaLast.fikir;
        showM1Outcome("cuba", function () {
          return;
        });
      });
    });

    document.getElementById("m1-dengar").addEventListener("click", function () {
      replayCurrentInstruction();
    });
    document.getElementById("m1-bantu").addEventListener("click", function () {
      openGuidedHelp("m1-fikir");
    });
    closeButton.addEventListener("click", function () {
      var overflow = dialog.getAttribute("data-m1-action") === "overflow";
      dialog.hidden = true;
      dialog.removeAttribute("data-m1-action");
      if (overflow) {
        state.overflowHold = false;
        reset();
      }
    });
    nextButton.addEventListener("click", function () {
      var next = nextButton.getAttribute("data-next");
      dialog.hidden = true;
      if (next === "map") {
        showMap();
        return;
      }
      if (next === "bukti") {
        syncM1FikirScreen();
        enterScreen("m1-buktikan");
        return;
      }
      syncM1FikirScreen();
      enterScreen("m1-eksperimen");
    });
    document.querySelectorAll("[data-m1-pour]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.disabled || state.pouring || state.completed || state.overflowHold || m1OutcomeOpen) {
          return;
        }
        state.selected = Number(button.getAttribute("data-m1-pour"));
        pour();
      });
    });
    document.getElementById("m1-exp-reset").addEventListener("click", reset);
    document.getElementById("m1-exp-dengar").addEventListener("click", function () {
      replayCurrentInstruction();
    });
    document.getElementById("m1-exp-bantu").addEventListener("click", function () {
      openGuidedHelp("m1-eksperimen");
    });
    document.querySelectorAll("[data-m1-proof]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (m1OutcomeOpen) {
          return;
        }
        if (document.getElementById("mission-one").querySelector(".mission-frame").classList.contains("is-proof-editing")) {
          return;
        }
        novaLast.proof = button.getAttribute("data-m1-proof");
        if (!(state.experimentMarked || state.completed)) {
          return;
        }
        if (state.buktiSolved) {
          if (button.getAttribute("data-m1-proof") === "120+130=250") {
            showM1Outcome("betul", function () {
              var pending = showM1CompleteScreen();
              enterScreen("m1-selesai");
              return pending;
            });
          }
          return;
        }
        if (button.getAttribute("data-m1-proof") !== "120+130=250") {
          guideMemory.buktiFails += 1;
          guideMemory.lastBuktiWrong = novaLast.proof;
          recordAttempt(false, "Buktikan: salah");
          showM1Outcome("cuba", function () {
            return;
          });
          return;
        }
        state.buktiSolved = true;
        recordAttempt(true, "Buktikan: betul, 120 + 130 = 250 mL");
        render();
        showM1Outcome("betul", function () {
          var pending = showM1CompleteScreen();
          enterScreen("m1-selesai");
          return pending;
        });
      });
    });
    document.getElementById("m1-bukti-dengar").addEventListener("click", function () {
      replayCurrentInstruction();
    });
    document.getElementById("m1-bukti-bantu").addEventListener("click", function () {
      openGuidedHelp("m1-buktikan");
    });
    document.getElementById("m1-guide-taps").addEventListener("click", function (event) {
      onGuideTap("m1", event);
    });
    document.getElementById("m1-reward-map").addEventListener("click", showMap);
    document.getElementById("m1-reward-next").addEventListener("click", showMissionTwo);
    setupM1ProofEditor();
    syncM1FikirScreen();
  }

  function setupM1ProofEditor() {
    var KEY = "nexa-m1-proof-hotspots";
    var frame = document.getElementById("mission-one").querySelector(".mission-frame");
    var panel = document.getElementById("m1-proof-editor");
    var readout = document.getElementById("m1-proof-readout");
    var note = document.getElementById("m1-proof-note");
    var slots = [
      { id: "m1-proof-1", name: "jawapan1", proof: "120+50=170", left: 4.5, top: 70.9, width: 91, height: 5 },
      { id: "m1-proof-2", name: "jawapan2", proof: "120+80=200", left: 4.5, top: 77.3, width: 91, height: 5 },
      { id: "m1-proof-3", name: "jawapan3", proof: "120+130=250", left: 4.5, top: 83.1, width: 91, height: 5 }
    ];
    var layout = [];
    var drag = null;

    function round1(value) {
      return Math.round(value * 10) / 10;
    }

    function clampSlot(slot) {
      var width = slot.width;
      var height = slot.height;
      var left = slot.left;
      var top = slot.top;
      if (width < 8) {
        width = 8;
      }
      if (height < 3) {
        height = 3;
      }
      if (width > 100) {
        width = 100;
      }
      if (height > 40) {
        height = 40;
      }
      if (left < 0) {
        left = 0;
      }
      if (top < 0) {
        top = 0;
      }
      if (left + width > 100) {
        left = 100 - width;
      }
      if (top + height > 100) {
        top = 100 - height;
      }
      slot.left = round1(left);
      slot.top = round1(top);
      slot.width = round1(width);
      slot.height = round1(height);
    }

    function configText() {
      return JSON.stringify({
        jawapan1: { left: layout[0].left, top: layout[0].top, width: layout[0].width, height: layout[0].height, proof: layout[0].proof },
        jawapan2: { left: layout[1].left, top: layout[1].top, width: layout[1].width, height: layout[1].height, proof: layout[1].proof },
        jawapan3: { left: layout[2].left, top: layout[2].top, width: layout[2].width, height: layout[2].height, proof: layout[2].proof }
      }, null, 2);
    }

    function applySlot(index) {
      var button = document.getElementById(layout[index].id);
      var slot = layout[index];
      button.style.setProperty("--x", slot.left + "%");
      button.style.setProperty("--y", slot.top + "%");
      button.style.setProperty("--w", slot.width + "%");
      button.style.setProperty("--h", slot.height + "%");
      document.getElementById(slot.id + "-left").value = String(slot.left);
      document.getElementById(slot.id + "-top").value = String(slot.top);
      document.getElementById(slot.id + "-width").value = String(slot.width);
      document.getElementById(slot.id + "-height").value = String(slot.height);
    }

    function applyAll() {
      var index;
      for (index = 0; index < layout.length; index += 1) {
        applySlot(index);
      }
      readout.textContent = configText();
    }

    function copyFromDefaults() {
      var index;
      layout = [];
      for (index = 0; index < slots.length; index += 1) {
        layout.push({
          id: slots[index].id,
          name: slots[index].name,
          proof: slots[index].proof,
          left: slots[index].left,
          top: slots[index].top,
          width: slots[index].width,
          height: slots[index].height
        });
      }
    }

    function readSaved() {
      var raw;
      var data;
      var index;
      var saved;
      var slot;
      try {
        raw = localStorage.getItem(KEY);
        if (!raw) {
          return false;
        }
        data = JSON.parse(raw);
      } catch (error) {
        return false;
      }
      for (index = 0; index < slots.length; index += 1) {
        saved = data[slots[index].name];
        if (!saved || typeof saved.left !== "number" || typeof saved.top !== "number" || typeof saved.width !== "number" || typeof saved.height !== "number") {
          return false;
        }
      }
      copyFromDefaults();
      for (index = 0; index < slots.length; index += 1) {
        saved = data[slots[index].name];
        slot = layout[index];
        slot.left = saved.left;
        slot.top = saved.top;
        slot.width = saved.width;
        slot.height = saved.height;
        slot.proof = slots[index].proof;
        clampSlot(slot);
      }
      return true;
    }

    function setNote(text) {
      note.textContent = text;
    }

    function setEditing(enabled) {
      frame.classList.toggle("is-proof-editing", enabled);
      panel.hidden = !enabled;
      if (!enabled) {
        drag = null;
      }
      setNote(enabled ? "Seret kotak atau sudut kuning. Jawapan tidak dihantar semasa menyunting." : "");
    }

    function buktiOpen() {
      var proof = document.getElementById("m1-proof-1");
      return !missionScreen.hidden && proof && !proof.hidden;
    }

    if (!readSaved()) {
      copyFromDefaults();
    }
    applyAll();

    layout.forEach(function (slot, index) {
      var button = document.getElementById(slot.id);
      ["left", "top", "width", "height"].forEach(function (key) {
        document.getElementById(slot.id + "-" + key).addEventListener("input", function (event) {
          var value = Number(event.target.value);
          if (!isFinite(value)) {
            return;
          }
          layout[index][key] = value;
          clampSlot(layout[index]);
          applySlot(index);
          readout.textContent = configText();
        });
      });
      button.addEventListener("pointerdown", function (event) {
        var box;
        if (!frame.classList.contains("is-proof-editing")) {
          return;
        }
        if (event.button !== undefined && event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        box = frame.getBoundingClientRect();
        drag = {
          pointerId: event.pointerId,
          index: index,
          resize: event.target.classList.contains("m1-proof-handle"),
          startX: event.clientX,
          startY: event.clientY,
          left: layout[index].left,
          top: layout[index].top,
          width: layout[index].width,
          height: layout[index].height,
          frameWidth: box.width,
          frameHeight: box.height
        };
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener("pointermove", function (event) {
        var dx;
        var dy;
        if (!drag || drag.pointerId !== event.pointerId || drag.index !== index) {
          return;
        }
        event.preventDefault();
        dx = (event.clientX - drag.startX) / drag.frameWidth * 100;
        dy = (event.clientY - drag.startY) / drag.frameHeight * 100;
        if (drag.resize) {
          layout[index].left = drag.left;
          layout[index].top = drag.top;
          layout[index].width = drag.width + dx;
          layout[index].height = drag.height + dy;
        } else {
          layout[index].left = drag.left + dx;
          layout[index].top = drag.top + dy;
          layout[index].width = drag.width;
          layout[index].height = drag.height;
        }
        clampSlot(layout[index]);
        applySlot(index);
        readout.textContent = configText();
      });
      function endDrag(event) {
        if (!drag || drag.pointerId !== event.pointerId || drag.index !== index) {
          return;
        }
        drag = null;
      }
      button.addEventListener("pointerup", endDrag);
      button.addEventListener("pointercancel", endDrag);
    });

    document.getElementById("m1-proof-save").addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, configText());
        setNote("Disimpan dalam pelayar ini.");
      } catch (error) {
        setNote("Tidak dapat disimpan dalam pelayar ini.");
      }

    });
    document.getElementById("m1-proof-reset").addEventListener("click", function () {
      copyFromDefaults();
      applyAll();
      try {
        localStorage.removeItem(KEY);
      } catch (error) {
        setNote("Tetapan asal.");
        return;
      }
      setNote("Tetapan asal.");
    });
    document.getElementById("m1-proof-copy").addEventListener("click", function () {
      var text = configText();
      function finish(copied) {
        setNote(copied ? "Tetapan disalin." : "Salin teks di bawah.");
        readout.textContent = text;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          finish(true);
        }, function () {
          finish(false);
        });
        return;
      }
      finish(false);
    });
    document.getElementById("m1-proof-close").addEventListener("click", function () {
      setEditing(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.code !== "KeyE" || !event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.repeat) {
        return;
      }
      if (!buktiOpen()) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setEditing(!frame.classList.contains("is-proof-editing"));
    }, true);

    panel.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
  }

  function setupDemoGame() {
    var dialog = document.getElementById("demo-dialog");
    var title = document.getElementById("demo-dialog-title");
    var text = document.getElementById("demo-dialog-text");
    var mapButton = document.getElementById("demo-dialog-map");
    var hint = "Perhatikan sasaran 250 mL dan air sedia ada 120 mL. Kira perbezaannya. Ini bantuan visual biasa, bukan AI.";

    function showDemoDialog(heading, message) {
      clearGuideChrome("demo");
      title.textContent = heading;
      text.textContent = message;
      mapButton.hidden = true;
      dialog.hidden = false;
    }

    document.querySelectorAll("[data-demo-answer]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (m1OutcomeOpen) {
          return;
        }
        novaLast.demo = button.getAttribute("data-demo-answer");
        if (Number(button.getAttribute("data-demo-answer")) === 130) {
          showDemoOutcome("betul", function () {
            return warmImage("assets/peta_kota_air.png").then(function () {
              showMap();
            });
          });
          return;
        }
        guideMemory.demoFails += 1;
        guideMemory.lastDemoWrong = novaLast.demo;
        showDemoOutcome("cuba", function () {
          return;
        });
      });
    });

    document.querySelectorAll("[data-demo-help]").forEach(function (button) {
      button.addEventListener("click", function () {
        var kind = button.getAttribute("data-demo-help");
        if (m1OutcomeOpen) {
          return;
        }
        if (kind === "dengar") {
          replayCurrentInstruction();
          return;
        }
        openGuidedHelp("demo");
      });
    });

    document.getElementById("demo-guide-taps").addEventListener("click", function (event) {
      onGuideTap("demo", event);
    });
    document.getElementById("demo-dialog-close").addEventListener("click", function () {
      dialog.hidden = true;
    });
    mapButton.addEventListener("click", function () {
      dialog.hidden = true;
      showMap();
    });
  }

  var narrationMuted = false;
  var narrationToken = 0;
  var narrationTimer = 0;
  var speechNeedsTap = false;
  var WELCOME_LINE = "Hai! Saya AI Nova. Jom belajar dan selamatkan Kota Air bersama-sama!";
  var MAP_LINE = "Hai! Saya Cikgu Khaw. Selamat datang ke Bandar Air Nexa! Pilih misi yang bercahaya untuk memulakan pengembaraan STEM kamu!";

  function malayVoice() {
    var voices;
    var index;
    var voice;
    var lang;
    var name;
    var fallback = null;
    if (!window.speechSynthesis) {
      return null;
    }
    voices = window.speechSynthesis.getVoices();
    for (index = 0; index < voices.length; index += 1) {
      voice = voices[index];
      lang = (voice.lang || "").toLowerCase().replace("_", "-");
      name = (voice.name || "").toLowerCase();
      if (lang === "ms-my" || name.indexOf("malaysia") !== -1) {
        return voice;
      }
      if (!fallback && (lang.indexOf("ms") === 0 || name.indexOf("malay") !== -1)) {
        fallback = voice;
      }
    }
    return fallback;
  }

  function refreshNarrationButtons() {
    var buttons = document.querySelectorAll(".narration-toggle");
    var index;
    var button;
    var label;
    if (narrationMuted) {
      label = "Mainkan bacaan";
    } else if (speechNeedsTap) {
      label = "Tekan untuk dengar";
    } else {
      label = "Senyapkan bacaan";
    }
    for (index = 0; index < buttons.length; index += 1) {
      button = buttons[index];
      button.textContent = narrationMuted || speechNeedsTap ? "🔇" : "🔊";
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", narrationMuted ? "true" : "false");
      button.classList.toggle("is-muted", narrationMuted || speechNeedsTap);
    }
  }

  function stopNarration() {
    narrationToken += 1;
    if (narrationTimer) {
      window.clearTimeout(narrationTimer);
      narrationTimer = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  var narrationScreenId = "welcome";
  var SCREEN_LINES = {
    welcome: WELCOME_LINE,
    demo: "Hai! Saya AI Nova. Tangki ada 120 mililiter. Sasaran 250 mililiter. Berapa mililiter lagi diperlukan?",
    map: MAP_LINE,
    "m1-fikir": "Tangki ada 120 mililiter. Sasaran 250 mililiter. Berapa mililiter lagi diperlukan?",
    "m1-eksperimen": "Paras awal 120 mililiter. Tambah air sehingga 250 mililiter. Pilih bekas 20, 50 atau 80 mililiter.",
    "m1-buktikan": "Pilih pengiraan yang membuktikan paras akhir tangki ialah 250 mililiter.",
    "m1-selesai": "Misi selesai. Lencana kamu sudah dikumpul.",
    "m2-fikir": "Paras air naik daripada 120 mililiter kepada 165 mililiter. Berapakah isipadu batu kristal?",
    "m2-eksperimen": "Paras awal air ialah 120 mililiter. Pilih satu batu kristal. Perhatikan paras air apabila batu dimasukkan. Cuba capai 165 mililiter.",
    "m2-buktikan": "Pilih pengiraan yang membuktikan paras akhir ialah 165 mililiter.",
    "m2-selesai": "Misi selesai. Lencana kamu sudah dikumpul.",
    "m3-fikir": "Tangki ada 700 mililiter dan bocor 100 mililiter. Berapakah baki air?",
    "m3-eksperimen": "Paras awal air ialah 600 mililiter. Pilih bekas air sehingga tangki menjadi 1000 mililiter.",
    "m3-buktikan": "Pilih pengiraan yang membuktikan paras akhir ialah 1000 mililiter.",
    "m3-selesai": "Misi selesai. Lencana kamu sudah dikumpul.",
    "m4-fikir": "Sensor perlu 750 mililiter. Pilih dua paip yang jumlahnya betul.",
    "m4-eksperimen": "Sambungkan paip yang betul. Sensor hijau hidup apabila air mencapai 750 mililiter.",
    "m4-buktikan": "Tangki perlu 750 mililiter dan sudah ada 250 mililiter. Berapa lagi perlu ditambah?",
    "m4-selesai": "Misi selesai. Lencana kamu sudah dikumpul.",
    koleksi: "Tahniah, anda berjaya!"
  };
  var FEEDBACK_LINES = {
    betul: "Betul!",
    cuba: "Cuba lagi. Belum tepat.",
    selesai: "Misi selesai. Lencana kamu sudah dikumpul."
  };

  function activeNarrationLine() {
    return SCREEN_LINES[narrationScreenId] || "";
  }

  function enterScreen(screenId) {
    if (screenId !== "demo") {
      guideMemory.lastDemoWrong = "";
      novaLast.demo = "";
    }
    if (screenId !== "m1-fikir") {
      guideMemory.lastFikirWrong = "";
      novaLast.fikir = "";
    }
    if (screenId !== "m1-buktikan") {
      guideMemory.lastBuktiWrong = "";
      novaLast.proof = "";
    }
    if (screenId !== "m2-fikir") {
      guideMemory.lastM2FikirWrong = "";
    }
    if (screenId !== "m2-eksperimen") {
      guideMemory.lastM2ExpWrong = "";
    }
    if (screenId !== "m2-buktikan") {
      guideMemory.lastM2ProofWrong = "";
    }
    if (screenId !== "m3-fikir") {
      guideMemory.lastM3FikirWrong = "";
    }
    if (screenId !== "m3-eksperimen") {
      guideMemory.lastM3ExpWrong = "";
    }
    if (screenId !== "m3-buktikan") {
      guideMemory.lastM3ProofWrong = "";
    }
    if (screenId !== "m4-fikir") {
      guideMemory.lastM4FikirWrong = "";
    }
    if (screenId !== "m4-eksperimen") {
      guideMemory.lastM4ExpWrong = "";
    }
    if (screenId !== "m4-buktikan") {
      guideMemory.lastM4ProofWrong = "";
    }
    narrationScreenId = screenId;
    warmUpcoming(screenId);
    if (narrationMuted || !SCREEN_LINES[screenId]) {
      stopNarration();
      return;
    }
    speakNow(SCREEN_LINES[screenId], true);
  }

  function replayCurrentInstruction() {
    var line = SCREEN_LINES[narrationScreenId] || "";
    if (!line) {
      return;
    }
    speakNow(line, false);
  }

  function narrateFeedback(kind, spoken) {
    var line = spoken || FEEDBACK_LINES[kind] || "";
    if (!line) {
      return;
    }
    speakNow(line, true);
  }

  function narrateHint(text) {
    if (!text) {
      return;
    }
    speakNow(text, true);
  }

  function speakNow(text, automatic, onDone) {
    var token;
    if (!text) {
      return;
    }
    if (automatic && narrationMuted) {
      stopNarration();
      return;
    }
    if (!window.speechSynthesis) {
      if (automatic) {
        speechNeedsTap = true;
        refreshNarrationButtons();
      } else {
        openHelp("DENGAR", "Bacaan suara tidak disokong oleh pelayar ini.");
      }
      return;
    }
    stopNarration();
    token = narrationToken;
    function begin() {
      var utterance;
      var voice;
      if (token !== narrationToken || (automatic && narrationMuted)) {
        return;
      }
      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ms-MY";
      utterance.rate = 0.8;
      utterance.pitch = 1.02;
      voice = malayVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.onstart = function () {
        if (token !== narrationToken) {
          return;
        }
        speechNeedsTap = false;
        refreshNarrationButtons();
      };
      utterance.onend = function () {
        if (token !== narrationToken) {
          return;
        }
        if (onDone) {
          onDone();
        }
      };
      utterance.onerror = function (event) {
        var reason = event && event.error ? event.error : "";
        if (token !== narrationToken) {
          return;
        }
        if (reason === "interrupted" || reason === "canceled" || reason === "cancelled") {
          return;
        }
        if (automatic) {
          speechNeedsTap = true;
          refreshNarrationButtons();
        }
        if (onDone) {
          onDone();
        }
      };
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      narrationTimer = window.setTimeout(function () {
        narrationTimer = 0;
        if (token !== narrationToken || !automatic || narrationMuted) {
          return;
        }
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          return;
        }
        speechNeedsTap = true;
        refreshNarrationButtons();
      }, 900);
    }
    if (window.speechSynthesis.getVoices().length === 0) {
      var started = false;
      function ready() {
        if (started || token !== narrationToken) {
          return;
        }
        started = true;
        window.speechSynthesis.removeEventListener("voiceschanged", ready);
        begin();
      }
      window.speechSynthesis.addEventListener("voiceschanged", ready);
      window.setTimeout(ready, 500);
      return;
    }
    begin();
  }

  function setupNarrationControls() {
    document.querySelectorAll(".narration-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        if (!narrationMuted && !speechNeedsTap) {
          narrationMuted = true;
          stopNarration();
          refreshNarrationButtons();
          return;
        }
        narrationMuted = false;
        speechNeedsTap = false;
        refreshNarrationButtons();
        speakNow(activeNarrationLine(), false);
      });
    });
    refreshNarrationButtons();
  }

  function speakText(text) {
    speakNow(text, false);
  }

  function openHelp(heading, message) {
    document.getElementById("help-title").textContent = heading;
    document.getElementById("help-text").textContent = message;
    document.getElementById("help-dialog").hidden = false;
  }

  function setupMissionHelp() {
    document.getElementById("help-close").addEventListener("click", function () {
      document.getElementById("help-dialog").hidden = true;
    });
    document.querySelectorAll(".mission-help").forEach(function (bar) {
      bar.addEventListener("click", function (event) {
        var button = event.target.closest("button");
        var mission;
        if (!button) {
          return;
        }
        if (button.getAttribute("data-help") === "dengar") {
          replayCurrentInstruction();
          return;
        }
        if (button.getAttribute("data-help") === "ai") {
          mission = bar.closest(".mission-screen");
          if (mission && mission.id === "mission-one") {
            if (m1ScreenId() === "m1-eksperimen") {
              openGuidedHelp("m1-eksperimen");
            } else if (m1ScreenId() === "m1-buktikan") {
              openGuidedHelp("m1-buktikan");
            } else {
              openGuidedHelp("m1-fikir");
            }
            return;
          }
          if (mission && mission.id === "mission-two") {
            openGuidedHelp(document.getElementById("m2-frame").classList.contains("is-m2-proof") ? "m2-buktikan" : (document.getElementById("m2-frame").classList.contains("is-m2-exp") ? "m2-eksperimen" : "m2-fikir"));
            return;
          }
          openHelp("BANTU AI", "Bantuan untuk misi ini belum sedia. Dengar soalan dan cuba lagi.");
        }
      });
    });
  }

  function setupMissionFour() {
    var M4_FIKIR = 1000;
    var M4_BUKTI = 500;
    var m4 = {
      fikirSolved: false,
      pipes: [],
      volume: 0,
      experimentSolved: false,
      buktiSolved: false,
      correct: 0,
      incorrect: 0,
      log: []
    };
    getM4ScreenId = function () {
      if (!m4.fikirSolved) {
        return "m4-fikir";
      }
      if (!m4.experimentSolved) {
        return "m4-eksperimen";
      }
      if (!m4.buktiSolved) {
        return "m4-buktikan";
      }
      return "m4-selesai";
    };
    var water = document.getElementById("m4-water");
    var volumeText = document.getElementById("m4-volume-text");
    var message = document.getElementById("m4-message");
    var fikirForm = document.getElementById("m4-fikir-form");
    var fikirInput = document.getElementById("m4-fikir-input");
    var fikirFeedback = document.getElementById("m4-fikir-feedback");
    var fikirHint = document.getElementById("m4-fikir-hint");
    var hintButton = document.getElementById("m4-hint-button");
    var eksperimenNote = document.getElementById("m4-eksperimen-note");
    var buktiPanel = document.getElementById("m4-bukti-panel");
    var buktiForm = document.getElementById("m4-bukti-form");
    var buktiInput = document.getElementById("m4-bukti-input");
    var buktiFeedback = document.getElementById("m4-bukti-feedback");
    var correctCount = document.getElementById("m4-correct-count");
    var incorrectCount = document.getElementById("m4-incorrect-count");
    var attemptLog = document.getElementById("m4-attempt-log");
    var pipeButtons = document.querySelectorAll(".pipe");

    m4Complete = function () {
      return m4.fikirSolved && m4.experimentSolved && m4.buktiSolved;
    };

    function readAmount(value) {
      var cleaned = String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/ml/g, "");
      if (!/^\d+$/.test(cleaned)) {
        return null;
      }
      return Number(cleaned);
    }

    function showM4Message(text, type) {
      message.textContent = text;
      message.className = "message" + (type ? " " + type : "");
    }

    function recordM4(correct, label) {
      var item = document.createElement("li");
      if (correct) {
        m4.correct += 1;
      } else {
        m4.incorrect += 1;
      }
      item.textContent = label;
      if (attemptLog.querySelector(".log-empty")) {
        attemptLog.textContent = "";
      }
      attemptLog.appendChild(item);
      correctCount.textContent = String(m4.correct);
      incorrectCount.textContent = String(m4.incorrect);
      renderMap();
    }

    function renderM4() {
      var index;
      water.style.height = (m4.volume / 1000) * 100 + "%";
      volumeText.textContent = m4.volume + " mL";
      fikirForm.hidden = m4.fikirSolved;
      hintButton.hidden = m4.fikirSolved;
      eksperimenNote.hidden = !m4.fikirSolved;
      buktiPanel.hidden = !m4.experimentSolved;
      buktiForm.hidden = m4.buktiSolved;
      for (index = 0; index < pipeButtons.length; index += 1) {
        pipeButtons[index].disabled = !m4.fikirSolved || m4.experimentSolved || m4.pipes.length >= 2;
      }
      setPhase("m4-phase-fikir", m4.fikirSolved ? "done" : "active");
      setPhase("m4-phase-eksperimen", !m4.fikirSolved ? "locked" : (m4.experimentSolved ? "done" : "active"));
      setPhase("m4-phase-buktikan", !m4.experimentSolved ? "locked" : (m4.buktiSolved ? "done" : "active"));
    }

    function checkM4Fikir(event) {
      var answer;
      event.preventDefault();
      if (m4.fikirSolved) {
        return;
      }
      answer = readAmount(fikirInput.value);
      if (answer === null) {
        fikirFeedback.textContent = "Tulis nombor dalam mL dahulu.";
        fikirFeedback.className = "feedback bad";
        return;
      }
      if (answer === M4_FIKIR) {
        m4.fikirSolved = true;
        fikirFeedback.textContent = "Betul. 1 L = 1000 mL.";
        fikirFeedback.className = "feedback ok";
        recordM4(true, "Fikir: betul, 1000 mL");
        showM4Message("Bagus. Sekarang pilih dua paip.", "success");
        renderM4();
        enterScreen("m4-eksperimen");
        return;
      }
      fikirFeedback.textContent = "Belum tepat. Cuba lagi.";
      fikirFeedback.className = "feedback bad";
      recordM4(false, "Fikir: salah");
      showM4Message("Belum tepat. Cuba semak 1 L.", "warn");
      narrateFeedback("cuba");
    }

    function choosePipe(amount) {
      var first;
      var second;
      var pair;
      if (!m4.fikirSolved || m4.experimentSolved || m4.pipes.length >= 2) {
        return;
      }
      m4.pipes.push(amount);
      m4.volume = m4.pipes[0] + (m4.pipes.length > 1 ? m4.pipes[1] : 0);
      renderM4();
      if (m4.pipes.length < 2 && m4.volume < 750) {
        showM4Message("Paip pertama dipilih. Pilih satu lagi.", "");
        return;
      }
      first = m4.pipes[0];
      second = m4.pipes[1];
      pair = (first === 250 && second === 500) || (first === 500 && second === 250);
      if (m4.pipes.length === 2 && pair) {
        m4.experimentSolved = true;
        recordM4(true, "Eksperimen: dua paip 750 mL");
        showM4Message("Bagus! 250 mL + 500 mL = 750 mL.", "success");
        renderM4();
        enterScreen("m4-buktikan");
        return;
      }
      recordM4(false, "Eksperimen: paip tidak tepat");
      showM4Message("Gunakan dua paip yang jumlahnya 750 mL. Tekan Set Semula.", "warn");
      narrateFeedback("cuba");
    }

    function resetM4() {
      m4.pipes = [];
      m4.volume = 0;
      showM4Message(m4.fikirSolved ? "Paip diset semula. Pilih dua paip semula." : "Kira dahulu: 1 L sama dengan berapa mL?", "");
      renderM4();
    }

    function checkM4Bukti(event) {
      var answer;
      event.preventDefault();
      if (!m4.experimentSolved || m4.buktiSolved) {
        return;
      }
      answer = readAmount(buktiInput.value);
      if (answer === null) {
        buktiFeedback.textContent = "Tulis nombor dalam mL dahulu.";
        buktiFeedback.className = "feedback bad";
        return;
      }
      if (answer === M4_BUKTI) {
        m4.buktiSolved = true;
        buktiFeedback.textContent = "Bagus! 200 mL + 300 mL = 500 mL.";
        buktiFeedback.className = "feedback ok";
        recordM4(true, "Buktikan: betul, 500 mL");
        showM4Message("Syabas! Misi 4 selesai.", "success");
        renderM4();
        narrateFeedback("selesai");
        return;
      }
      buktiFeedback.textContent = "Belum tepat. Baca soalan sekali lagi dan cuba semula.";
      buktiFeedback.className = "feedback bad";
      recordM4(false, "Buktikan: salah");
      showM4Message("Belum tepat. Cuba semak kiraan kamu sendiri.", "warn");
      narrateFeedback("cuba");
    }

    fikirForm.addEventListener("submit", checkM4Fikir);
    hintButton.addEventListener("click", function () {
      if (!m4.fikirSolved) {
        fikirHint.hidden = false;
      }
    });
    pipeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        choosePipe(Number(button.getAttribute("data-pipe")));
      });
    });
    document.getElementById("m4-reset").addEventListener("click", resetM4);
    buktiForm.addEventListener("submit", checkM4Bukti);
    renderM4();
    attachM4Picture(m4, recordM4);
  }

  var guideMemory = {
    demoFails: 0,
    demoPress: 0,
    lastDemoWrong: "",
    fikirFails: 0,
    fikirPress: 0,
    lastFikirWrong: "",
    expPress: 0,
    expOverflows: 0,
    pendingOverflow: false,
    lastOverflowBeaker: 0,
    buktiFails: 0,
    buktiPress: 0,
    lastBuktiWrong: "",
    lastM2FikirWrong: "",
    lastM2ExpWrong: "",
    lastM2ProofWrong: "",
    lastM3FikirWrong: "",
    lastM3ExpWrong: "",
    lastM3ProofWrong: "",
    lastM4FikirWrong: "",
    lastM4ExpWrong: "",
    lastM4ProofWrong: ""
  };
  var guideToken = 0;
  var guidePack = { demo: null, m1: null, m2: null };

  function renderGuideTaps(prefix, pack) {
    var taps = document.getElementById(prefix + "-guide-taps");
    var index;
    var tap;
    var button;
    var small;
    if (!taps) {
      return;
    }
    taps.textContent = "";
    if (!pack.taps || !pack.taps.length) {
      taps.hidden = true;
      return;
    }
    for (index = 0; index < pack.taps.length; index += 1) {
      tap = pack.taps[index];
      button = document.createElement("button");
      button.type = "button";
      button.className = "guide-tap";
      button.setAttribute("data-guide-tap", tap.id);
      button.appendChild(document.createTextNode(tap.label));
      small = document.createElement("small");
      small.textContent = tap.visual;
      button.appendChild(small);
      taps.appendChild(button);
    }
    taps.hidden = false;
  }

  function writeGuideSpeech(element, speech) {
    var pieces = String(speech || "").split(/(\d+)/);
    var index;
    var strong;
    element.textContent = "";
    for (index = 0; index < pieces.length; index += 1) {
      if (!pieces[index]) {
        continue;
      }
      if (/^\d+$/.test(pieces[index])) {
        strong = document.createElement("strong");
        strong.textContent = pieces[index];
        element.appendChild(strong);
      } else {
        element.appendChild(document.createTextNode(pieces[index]));
      }
    }
  }

  function showGuidePack(screen, pack) {
    var prefix = "m1";
    if (screen === "demo") {
      prefix = "demo";
    } else if (String(screen).indexOf("m2-") === 0) {
      prefix = "m2";
    } else if (String(screen).indexOf("m3-") === 0) {
      prefix = "m3";
    } else if (String(screen).indexOf("m4-") === 0) {
      prefix = "m4";
    }
    var dialog = document.getElementById(prefix + "-dialog");
    var note = document.getElementById(prefix + "-guide-note");
    var ai = document.getElementById(prefix + "-guide-ai");
    var closeButton = document.getElementById(prefix + "-dialog-close");
    guidePack[prefix] = pack;
    if (screen === "demo") {
      document.getElementById("demo-dialog-map").hidden = true;
    } else if (prefix === "m1") {
      document.getElementById("m1-dialog-next").hidden = true;
      dialog.removeAttribute("data-m1-action");
    }
    if (closeButton) {
      closeButton.textContent = "Tutup";
    }
    document.getElementById(prefix + "-dialog-title").textContent = "AI NOVA";
    writeGuideSpeech(document.getElementById(prefix + "-dialog-text"), pack.speech);
    if (note) {
      note.textContent = "";
      note.hidden = true;
    }
    if (ai) {
      ai.textContent = "";
      ai.hidden = true;
    }
    renderGuideTaps(prefix, pack);
    dialog.hidden = false;
    narrateHint(pack.speech);
  }

  function situationFor(screen) {
    if (screen === "demo") {
      guideMemory.demoPress += 1;
      return {
        screen: "demo",
        stage: "fikir",
        fails: guideMemory.demoFails,
        presses: guideMemory.demoPress,
        lastWrong: guideMemory.lastDemoWrong
      };
    }
    if (screen === "m1-fikir") {
      guideMemory.fikirPress += 1;
      return {
        screen: "m1-fikir",
        stage: "fikir",
        fails: guideMemory.fikirFails,
        presses: guideMemory.fikirPress,
        lastWrong: guideMemory.lastFikirWrong
      };
    }
    if (screen === "m1-eksperimen") {
      guideMemory.expPress += 1;
      return {
        screen: "m1-eksperimen",
        stage: "eksperimen",
        fails: guideMemory.expOverflows,
        presses: guideMemory.expPress,
        volume: state.volume,
        overflow: guideMemory.pendingOverflow,
        beaker: guideMemory.lastOverflowBeaker
      };
    }
    guideMemory.buktiPress += 1;
    return {
      screen: "m1-buktikan",
      stage: "buktikan",
      fails: guideMemory.buktiFails,
      presses: guideMemory.buktiPress,
      lastWrong: guideMemory.lastBuktiWrong
    };
  }

  function openGuidedHelp(screen) {
    var pack;
    var answer = "";
    var pour = 0;
    var blocked = false;
    if (m1OutcomeOpen) {
      return;
    }
    if (screen === "m1-eksperimen" && state.overflowHold) {
      return;
    }
    if (!window.NexaGuide || !window.NexaGuide.pupilGuide) {
      presentNova(screen, "AI NOVA", "Panduan tidak dapat ditunjukkan sekarang.", false);
      return;
    }
    if (screen === "demo") {
      answer = guideMemory.lastDemoWrong;
    } else if (screen === "m1-fikir") {
      answer = guideMemory.lastFikirWrong;
    } else if (screen === "m1-buktikan") {
      answer = guideMemory.lastBuktiWrong;
    } else if (screen === "m2-fikir") {
      answer = guideMemory.lastM2FikirWrong;
    } else if (screen === "m2-eksperimen") {
      answer = guideMemory.lastM2ExpWrong;
    } else if (screen === "m2-buktikan") {
      answer = guideMemory.lastM2ProofWrong;
    } else if (screen === "m3-fikir") {
      answer = guideMemory.lastM3FikirWrong;
    } else if (screen === "m3-eksperimen") {
      answer = guideMemory.lastM3ExpWrong;
    } else if (screen === "m3-buktikan") {
      answer = guideMemory.lastM3ProofWrong;
    } else if (screen === "m4-fikir") {
      answer = guideMemory.lastM4FikirWrong;
    } else if (screen === "m4-eksperimen") {
      answer = guideMemory.lastM4ExpWrong;
    } else if (screen === "m4-buktikan") {
      answer = guideMemory.lastM4ProofWrong;
    }
    if (screen === "m2-fikir") {
      if (answer !== "35" && answer !== "55") {
        answer = "";
      }
    } else if (screen === "m2-eksperimen") {
      if (answer !== "20" && answer !== "60") {
        answer = "";
      }
    } else if (screen === "m2-buktikan") {
      if (answer !== "120+20=140" && answer !== "120+60=180") {
        answer = "";
      }
    } else if (screen === "m3-fikir") {
      if (answer !== "500" && answer !== "700") {
        answer = "";
      }
    } else if (screen === "m3-eksperimen") {
      if (answer !== "100" && answer !== "200" && answer !== "400") {
        answer = "";
      }
    } else if (screen === "m3-buktikan") {
      if (answer !== "600+200=800" && answer !== "700+400=1100") {
        answer = "";
      }
    } else if (screen === "m4-fikir") {
      if (answer !== "250+200" && answer !== "500+200") {
        answer = "";
      }
    } else if (screen === "m4-eksperimen") {
      if (answer !== "200") {
        answer = "";
      }
    } else if (screen === "m4-buktikan") {
      if (answer !== "750" && answer !== "200") {
        answer = "";
      }
    } else if (answer !== "120" && answer !== "150" && answer !== "120+50=170" && answer !== "120+80=200") {
      answer = "";
    }
    if (screen === "m1-eksperimen") {
      blocked = guideMemory.pendingOverflow;
      if (blocked) {
        pour = Number(guideMemory.lastOverflowBeaker) || 0;
      } else if (state.attemptPours.length) {
        pour = Number(state.attemptPours[state.attemptPours.length - 1]) || 0;
      }
    }
    pack = window.NexaGuide.pupilGuide({
      screen: screen,
      answer: answer,
      volume: state.volume,
      pour: pour,
      blocked: blocked
    });
    if (!pack || window.NexaGuide.containsAnswer(pack.speech)) {
      presentNova(screen, "AI NOVA", "Panduan tidak dapat ditunjukkan sekarang.", false);
      return;
    }
    showGuidePack(screen, pack);
  }

  function showDemoWait() {
    clearGuideChrome("demo");
    document.getElementById("demo-dialog-map").hidden = true;
    document.getElementById("demo-dialog-title").textContent = "AI Nova";
    document.getElementById("demo-dialog-text").textContent = "Sila tunggu. AI Nova sedang berfikir.";
    document.getElementById("demo-guide-note").textContent = "Ini belum petunjuk.";
    document.getElementById("demo-guide-note").hidden = false;
    document.getElementById("demo-dialog").hidden = false;
    stopNarration();
  }

  function showGuruDemo(code) {
    var pack = window.NexaGuide.selectHint({
      screen: "demo",
      stage: "fikir",
      fails: guideMemory.demoFails,
      presses: guideMemory.demoPress,
      lastWrong: guideMemory.lastDemoWrong
    });
    if (!pack || window.NexaGuide.containsAnswer(pack.speech)) {
      presentNova("demo", "Bantuan Guru", "Petunjuk tidak dapat ditunjukkan. Ini bukan ayat AI.", false);
      return;
    }
    showGuidePack("demo", pack);
    document.getElementById("demo-dialog-title").textContent = "Bantuan Guru";
    document.getElementById("demo-guide-ai").textContent = window.NexaGuide.statusLine({
      mode: code === "allowance" ? "allowance" : "guru"
    });
  }

  function showAiDemoHint(text, level, lastAnswer) {
    var sample = window.NexaGuide.selectHint({
      stage: "fikir",
      fails: 2,
      presses: 2,
      lastWrong: lastAnswer
    });
    var pack = {
      speech: text,
      level: level,
      taps: level >= 2 && sample ? sample.taps : []
    };
    var note = document.getElementById("demo-guide-note");
    var ai = document.getElementById("demo-guide-ai");
    guidePack.demo = pack;
    document.getElementById("demo-dialog-title").textContent = "AI Nova";
    document.getElementById("demo-dialog-text").textContent = text;
    note.textContent = "Ayat ini daripada AI Nova.";
    note.hidden = false;
    ai.textContent = "Matematik dan markah tidak datang daripada model.";
    ai.hidden = false;
    renderGuideTaps("demo", pack);
    document.getElementById("demo-dialog").hidden = false;
    narrateHint(text);
  }

  function askDemoNova() {
    openGuidedHelp("demo");
    return;
  }

  function onGuideTap(prefix, event) {
    var button = event.target.closest("button");
    var chosen;
    if (!button || !guidePack[prefix]) {
      return;
    }
    chosen = window.NexaGuide.tap(guidePack[prefix], button.getAttribute("data-guide-tap"));
    if (!chosen || window.NexaGuide.containsAnswer(chosen.speech)) {
      return;
    }
    document.getElementById(prefix + "-dialog-text").textContent = chosen.speech;
    narrateHint(chosen.speech);
  }

  var novaBusy = false;
  var novaLast = { demo: "", fikir: "", proof: "" };

  function novaEndpoint() {
    var config = window.NEXA_NOVA || {};
    if (!config.endpoint || typeof config.endpoint !== "string") {
      return "";
    }
    return config.endpoint.trim();
  }

  function refreshNovaStatus() {
    document.querySelectorAll("[data-demo-help='ai'] span, #m1-bantu span, #m1-exp-bantu span, #m1-bukti-bantu span").forEach(function (span) {
      span.hidden = true;
    });
  }

  function presentNova(screen, heading, message, speak) {
    var title;
    var text;
    var mapButton;
    var dialog;
    if (screen === "demo") {
      title = document.getElementById("demo-dialog-title");
      text = document.getElementById("demo-dialog-text");
      mapButton = document.getElementById("demo-dialog-map");
      dialog = document.getElementById("demo-dialog");
      title.textContent = heading;
      text.textContent = message;
      mapButton.hidden = true;
      dialog.hidden = false;
    } else if (screen === "m2-fikir" || screen === "m2-eksperimen" || screen === "m2-buktikan") {
      title = document.getElementById("m2-dialog-title");
      text = document.getElementById("m2-dialog-text");
      dialog = document.getElementById("m2-dialog");
      title.textContent = heading;
      text.textContent = message;
      dialog.hidden = false;
    } else if (String(screen).indexOf("m3-") === 0 || String(screen).indexOf("m4-") === 0) {
      title = document.getElementById(screen.indexOf("m3-") === 0 ? "m3-dialog-title" : "m4-dialog-title");
      text = document.getElementById(screen.indexOf("m3-") === 0 ? "m3-dialog-text" : "m4-dialog-text");
      dialog = document.getElementById(screen.indexOf("m3-") === 0 ? "m3-dialog" : "m4-dialog");
      title.textContent = heading;
      text.textContent = message;
      dialog.hidden = false;
    } else {
      showM1Dialog(heading, message, false, "Tutup");
    }
    if (speak) {
      narrateHint(message);
    }
  }

  function novaBody(screen) {
    var body = { screen: screen };
    if (screen === "demo" && novaLast.demo) {
      body.lastAnswer = novaLast.demo;
    }
    if (screen === "m1-fikir" && novaLast.fikir) {
      body.lastAnswer = novaLast.fikir;
    }
    if (screen === "m1-buktikan" && novaLast.proof) {
      body.lastAnswer = novaLast.proof;
    }
    if (screen === "m1-eksperimen") {
      body.volume = state.volume;
      if (state.selected === 20 || state.selected === 50 || state.selected === 80) {
        body.lastPour = state.selected;
      }
    }
    return body;
  }

  function askNova(screen) {
    return;
  }

  function ensureM34() {
    var editor;
    var note;
    var fields;
    var readout;
    var drag;
    if (ensureM34.ready) {
      return ensureM34.box;
    }
    editor = document.getElementById("m34-editor");
    note = document.getElementById("m34-note");
    fields = document.getElementById("m34-fields");
    readout = document.getElementById("m34-readout");
    drag = null;
    ensureM34.box = {
      wait: { m3: 0, m4: 0 },
      pour: { m3: 0, m4: 0 },
      live: { m3: 600, m4: 0 },
      layout: {
        spots: {
          m3f500: { left: 4, top: 77.4, width: 29, height: 8.7 },
          m3f700: { left: 36, top: 77.4, width: 29, height: 8.7 },
          m3f600: { left: 67, top: 77.4, width: 32, height: 8.7 },
          m3fd: { left: 3, top: 88.5, width: 32, height: 6 },
          m3fb: { left: 66, top: 88, width: 30, height: 6.5 },
          m3p100: { left: 9.5, top: 65.8, width: 23.4, height: 13.9 },
          m3p200: { left: 39, top: 65.4, width: 22, height: 13.9 },
          m3p400: { left: 68.4, top: 65.7, width: 25.5, height: 13.8 },
          m3reset: { left: 28.9, top: 84.2, width: 44.5, height: 6.3 },
          m3ed: { left: 3.8, top: 91, width: 32, height: 6 },
          m3eb: { left: 67.2, top: 91, width: 30, height: 6 },
          m3low: { left: 5, top: 72.1, width: 90, height: 5.2 },
          m3sum: { left: 5, top: 77.8, width: 90, height: 4.8 },
          m3high: { left: 5, top: 83.5, width: 90, height: 4.8 },
          m3pd: { left: 3, top: 89.5, width: 32, height: 5.5 },
          m3pb: { left: 66, top: 89.5, width: 30, height: 5.5 },
          m4fpair: { left: 5, top: 72.4, width: 90, height: 4.6 },
          m4flow: { left: 5, top: 77.8, width: 90, height: 5.2 },
          m4fhigh: { left: 5, top: 83.5, width: 90, height: 5 },
          m4fd: { left: 3, top: 89.5, width: 32, height: 5.5 },
          m4fb: { left: 66, top: 89.5, width: 30, height: 5.5 },
          m4p250: { left: 7.9, top: 64.4, width: 23.3, height: 13.7 },
          m4p500: { left: 38.9, top: 63.8, width: 25.3, height: 14.6 },
          m4p200: { left: 70.1, top: 64.6, width: 25.7, height: 13 },
          m4reset: { left: 27.5, top: 78.6, width: 49.4, height: 5.8 },
          m4ed: { left: 3, top: 89.5, width: 32, height: 5.5 },
          m4eb: { left: 66, top: 89.5, width: 32.3, height: 6.7 },
          m4sensor: { left: 73.7, top: 37.5, width: 8, height: 6 },
          m4full: { left: 4, top: 74.8, width: 30, height: 8.7 },
          m4low: { left: 36, top: 74.8, width: 28, height: 8.7 },
          m4add: { left: 66, top: 74.8, width: 30, height: 8.7 },
          m4pd: { left: 3, top: 86, width: 32, height: 5.5 },
          m4pb: { left: 66, top: 86, width: 30, height: 5.5 }
        },
        water: {
          m3: { x: 57.2, y: 42.4, width: 29, height: 18.8, clip: 0, radius: 8, line600: 63, line700: 73, line800: 83, line900: 93, line1000: 105 },
          m4: { x: 50.2, y: 40.8, width: 31.9, height: 20, clip: 0, radius: 8, line0: 0, line200: 33.8, line250: 38, line450: 65, line500: 70, line700: 95, line750: 103 }
        }
      }
    };
    function round1(value) {
      return Math.round(value * 10) / 10;
    }
    function spot(key) {
      return ensureM34.box.layout.spots[key];
    }
    function waterOf(prefix) {
      return ensureM34.box.layout.water[prefix];
    }
    function applySpot(key) {
      var el = document.querySelector('[data-cal="' + key + '"]');
      var slot = spot(key);
      if (!el || !slot) {
        return;
      }
      el.style.setProperty("--x", slot.left + "%");
      el.style.setProperty("--y", slot.top + "%");
      el.style.setProperty("--w", slot.width + "%");
      el.style.setProperty("--h", slot.height + "%");
    }
    function applySpots() {
      var key;
      for (key in ensureM34.box.layout.spots) {
        if (Object.prototype.hasOwnProperty.call(ensureM34.box.layout.spots, key)) {
          applySpot(key);
        }
      }
    }
    function placeFill(prefix, volume, animate) {
      var water = waterOf(prefix);
      var box = document.getElementById(prefix + "-exp-water");
      var clip = document.getElementById(prefix + "-exp-clip");
      var fill = document.getElementById(prefix + "-exp-fill");
      var label = document.getElementById(prefix + "-exp-level");
      var sensor = document.getElementById("m4-sensor");
      var marks = prefix === "m3" ? [600, 700, 800, 900, 1000] : [0, 200, 250, 450, 500, 700, 750];
      var line = 0;
      var index;
      var reduce;
      var radius;
      if (!box || !water) {
        return;
      }
      for (index = 0; index < marks.length; index += 1) {
        if (volume >= marks[index]) {
          line = water["line" + marks[index]];
        }
      }
      radius = water.radius;
      if (radius < 0) {
        radius = 0;
      }
      if (radius > 40) {
        radius = 40;
      }
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      box.style.left = water.x + "%";
      box.style.top = water.y + "%";
      box.style.width = water.width + "%";
      box.style.height = water.height + "%";
      box.style.borderRadius = "0 0 " + radius + "% " + radius + "%";
      clip.style.top = water.clip + "%";
      clip.style.right = water.clip + "%";
      clip.style.bottom = water.clip + "%";
      clip.style.left = water.clip + "%";
      fill.style.borderRadius = "0";
      fill.style.transition = animate && !reduce ? "height 800ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
      fill.style.height = line + "%";
      label.style.top = (100 - line) + "%";
      label.textContent = volume + " mL";
      ensureM34.box.live[prefix] = volume;
      if (sensor) {
        sensor.classList.toggle("is-on", prefix === "m4" && !animate && volume >= 750);
      }
    }
    function activeFrame() {
      if (!missionThreeScreen.hidden) {
        return document.getElementById("m3-frame");
      }
      if (!missionFourScreen.hidden) {
        return document.getElementById("m4-frame");
      }
      return null;
    }
    function stageName() {
      var frame = activeFrame();
      if (!frame) {
        return "";
      }
      if (frame.id === "m3-frame") {
        if (!document.getElementById("m3-reward").hidden) {
          return "";
        }
        if (frame.classList.contains("is-m3-proof")) {
          return "m3-buktikan";
        }
        if (frame.classList.contains("is-m3-exp")) {
          return "m3-eksperimen";
        }
        return "m3-fikir";
      }
      if (!document.getElementById("m4-reward").hidden) {
        return "";
      }
      if (frame.classList.contains("is-m4-proof")) {
        return "m4-buktikan";
      }
      if (frame.classList.contains("is-m4-exp")) {
        return "m4-eksperimen";
      }
      return "m4-fikir";
    }
    function placeEditor() {
      var frame = activeFrame();
      var screen = frame && frame.id === "m4-frame" ? missionFourScreen : missionThreeScreen;
      var rect;
      var gutter;
      editor.classList.remove("is-docked");
      editor.classList.remove("is-stacked");
      editor.style.width = "";
      missionThreeScreen.classList.remove("is-m34-editor-stacked");
      missionFourScreen.classList.remove("is-m34-editor-stacked");
      if (editor.hidden || !frame) {
        return;
      }
      rect = frame.getBoundingClientRect();
      gutter = window.innerWidth - rect.right;
      if (gutter >= 250) {
        editor.classList.add("is-docked");
        editor.style.width = Math.min(340, Math.floor(gutter - 28)) + "px";
      } else {
        editor.classList.add("is-stacked");
        screen.classList.add("is-m34-editor-stacked");
      }
    }
    function rebuild() {
      var groups = {
        "m3-fikir": ["m3f500", "m3f700", "m3f600", "m3fd", "m3fb"],
        "m3-eksperimen": ["m3p100", "m3p200", "m3p400", "m3reset", "m3ed", "m3eb"],
        "m3-buktikan": ["m3low", "m3sum", "m3high", "m3pd", "m3pb"],
        "m4-fikir": ["m4fpair", "m4flow", "m4fhigh", "m4fd", "m4fb"],
        "m4-eksperimen": ["m4p250", "m4p500", "m4p200", "m4reset", "m4ed", "m4eb", "m4sensor"],
        "m4-buktikan": ["m4full", "m4low", "m4add", "m4pd", "m4pb"]
      };
      var name = stageName();
      var list = groups[name] || [];
      var prefix = name.indexOf("m4-") === 0 ? "m4" : "m3";
      fields.textContent = "";
      list.forEach(function (key) {
        var slot = spot(key);
        var box = document.createElement("p");
        box.textContent = key + " " + slot.left + ", " + slot.top + ", " + slot.width + ", " + slot.height;
        fields.appendChild(box);
      });
      if (name.indexOf("eksperimen") !== -1) {
        var water = waterOf(prefix);
        var waterKey;
        for (waterKey in water) {
          if (Object.prototype.hasOwnProperty.call(water, waterKey)) {
            (function (nameKey) {
              var label = document.createElement("label");
              var input = document.createElement("input");
              label.appendChild(document.createTextNode(nameKey + " "));
              input.type = "number";
              input.step = "0.1";
              input.value = String(water[nameKey]);
              input.addEventListener("input", function () {
                var value = Number(input.value);
                if (!isFinite(value)) {
                  return;
                }
                waterOf(prefix)[nameKey] = value;
                placeFill(prefix, ensureM34.box.live[prefix], false);
                readout.textContent = JSON.stringify(ensureM34.box.layout);
              });
              label.appendChild(input);
              fields.appendChild(label);
            }(waterKey));
          }
        }
      }
      readout.textContent = JSON.stringify(ensureM34.box.layout);
    }
    function setEditing(on) {
      var frame = activeFrame();
      document.getElementById("m3-frame").classList.remove("is-m34-editing");
      document.getElementById("m3-frame").classList.remove("is-m2-exp-editing");
      document.getElementById("m4-frame").classList.remove("is-m34-editing");
      document.getElementById("m4-frame").classList.remove("is-m2-exp-editing");
      editor.hidden = !on;
      if (frame && on) {
        frame.classList.add("is-m34-editing");
        frame.classList.add("is-m2-exp-editing");
        note.textContent = "Seret kotak atau sudut kuning. Jawapan tidak dihantar semasa menyunting.";
        rebuild();
      }
      placeEditor();
    }
    applySpots();
    placeFill("m3", 600, false);
    placeFill("m4", 0, false);
    ensureM34.box.placeFill = placeFill;
    ensureM34.box.editing = function (frame) {
      return !!(frame && frame.classList.contains("is-m34-editing"));
    };
    document.querySelectorAll("[data-cal]").forEach(function (el) {
      el.addEventListener("pointerdown", function (event) {
        var frame = el.closest(".mission-frame");
        var key = el.getAttribute("data-cal");
        var slot;
        var rect;
        if (!frame || !frame.classList.contains("is-m34-editing")) {
          return;
        }
        if (key === "m3water" || key === "m4water") {
          slot = waterOf(key === "m3water" ? "m3" : "m4");
        } else {
          slot = spot(key);
        }
        if (!slot || (event.button !== undefined && event.button !== 0)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        rect = frame.getBoundingClientRect();
        drag = {
          pointerId: event.pointerId,
          key: key,
          water: key === "m3water" || key === "m4water",
          resize: event.target.classList.contains("m2-exp-handle"),
          startX: event.clientX,
          startY: event.clientY,
          slot: slot,
          left: slot.x !== undefined ? slot.x : slot.left,
          top: slot.y !== undefined ? slot.y : slot.top,
          width: slot.width,
          height: slot.height,
          frameWidth: rect.width,
          frameHeight: rect.height
        };
        el.setPointerCapture(event.pointerId);
      });
      el.addEventListener("pointermove", function (event) {
        var dx;
        var dy;
        var slot;
        if (!drag || drag.pointerId !== event.pointerId || drag.key !== el.getAttribute("data-cal")) {
          return;
        }
        event.preventDefault();
        dx = (event.clientX - drag.startX) / drag.frameWidth * 100;
        dy = (event.clientY - drag.startY) / drag.frameHeight * 100;
        slot = drag.slot;
        if (drag.resize) {
          slot.width = round1(Math.max(4, drag.width + dx));
          slot.height = round1(Math.max(3, drag.height + dy));
        } else if (drag.water) {
          slot.x = round1(drag.left + dx);
          slot.y = round1(drag.top + dy);
        } else {
          slot.left = round1(drag.left + dx);
          slot.top = round1(drag.top + dy);
        }
        if (drag.water) {
          placeFill(drag.key === "m3water" ? "m3" : "m4", ensureM34.box.live[drag.key === "m3water" ? "m3" : "m4"], false);
        } else {
          applySpot(drag.key);
        }
        readout.textContent = JSON.stringify(ensureM34.box.layout);
      });
      el.addEventListener("pointerup", function (event) {
        if (drag && drag.pointerId === event.pointerId) {
          drag = null;
        }
      });
    });
    document.getElementById("m34-save").addEventListener("click", function () {
      try {
        localStorage.setItem("nexa-m34-debug", JSON.stringify(ensureM34.box.layout));
        note.textContent = "Disimpan dalam pelayar ini.";
      } catch (error) {
        note.textContent = "Tidak dapat disimpan dalam pelayar ini.";
      }
    });
    document.getElementById("m34-copy").addEventListener("click", function () {
      var text = JSON.stringify(ensureM34.box.layout);
      readout.textContent = text;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          note.textContent = "Tetapan disalin.";
        }, function () {
          note.textContent = "Salin teks di bawah.";
        });
        return;
      }
      note.textContent = "Salin teks di bawah.";
    });
    document.getElementById("m34-close").addEventListener("click", function () {
      setEditing(false);
    });
    editor.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
    window.addEventListener("resize", placeEditor);
    document.addEventListener("keydown", function (event) {
      if (event.code !== "KeyE" || !event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.repeat) {
        return;
      }
      if (missionThreeScreen.hidden && missionFourScreen.hidden) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setEditing(!(activeFrame() && activeFrame().classList.contains("is-m34-editing")));
    }, true);
    cancelM34 = function () {
      var feedbackA = document.getElementById("m3-feedback");
      var feedbackB = document.getElementById("m4-feedback");
      ensureM34.box.wait.m3 += 1;
      ensureM34.box.wait.m4 += 1;
      ensureM34.box.pour.m3 += 1;
      ensureM34.box.pour.m4 += 1;
      if ((feedbackA && !feedbackA.hidden) || (feedbackB && !feedbackB.hidden)) {
        if (feedbackA) {
          feedbackA.hidden = true;
        }
        if (feedbackB) {
          feedbackB.hidden = true;
        }
        m1OutcomeOpen = false;
        m1OutcomeToken += 1;
      }
      document.getElementById("m3-dialog").hidden = true;
      document.getElementById("m4-dialog").hidden = true;
      setEditing(false);
    };
    ensureM34.ready = true;
    return ensureM34.box;
  }

  function showStageOutcome(prefix, kind, onDone) {
    var line = kind === "betul"
      ? "Betul! Syabas! Kamu berjaya!"
      : "Belum tepat. Tidak mengapa. Tekan butang BANTU AI jika kamu memerlukan bantuan.";
    var dialog = document.getElementById(prefix + "-dialog");
    if (dialog) {
      dialog.hidden = true;
    }
    showPortraitFeedback(prefix + "-feedback", prefix + "-feedback-art", line, onDone);
  }

  function attachM3Picture(m3, recordM3) {
    var box = ensureM34();
    var frame = document.getElementById("m3-frame");
    var art = document.getElementById("m3-art");
    var volume = 600;
    function queue(action) {
      box.wait.m3 += 1;
      var token = box.wait.m3;
      return function () {
        if (token !== box.wait.m3 || missionThreeScreen.hidden) {
          return;
        }
        return action();
      };
    }
    function showFikir() {
      frame.classList.remove("is-m3-exp");
      frame.classList.remove("is-m3-proof");
      document.getElementById("m3-exp-layer").hidden = true;
      document.getElementById("m3-proof-layer").hidden = true;
      document.getElementById("m3-reward").hidden = true;
      var pending = assignArt(art, "assets/screens/m3/m3_fikir.png", "Misi 3 Fikir. Tangki ada 700 mL dan bocor 100 mL. Berapakah baki air?");
      enterScreen("m3-fikir");
      return pending;
    }
    function showExperiment() {
      frame.classList.add("is-m3-exp");
      frame.classList.remove("is-m3-proof");
      document.getElementById("m3-exp-layer").hidden = false;
      document.getElementById("m3-proof-layer").hidden = true;
      document.getElementById("m3-reward").hidden = true;
      var pending = assignArt(art, "assets/screens/m3/m3_eksperimen.png", "Misi 3 Eksperimen. Paras awal 600 mL. Isi sehingga 1000 mL.");
      box.placeFill("m3", volume, false);
      enterScreen("m3-eksperimen");
      return pending;
    }
    function showProof() {
      frame.classList.remove("is-m3-exp");
      frame.classList.add("is-m3-proof");
      document.getElementById("m3-exp-layer").hidden = true;
      document.getElementById("m3-proof-layer").hidden = false;
      document.getElementById("m3-reward").hidden = true;
      var pending = assignArt(art, "assets/screens/m3/m3_buktikan.png", "Misi 3 Buktikan. Pilih pengiraan yang membuktikan paras akhir 1000 mL.");
      enterScreen("m3-buktikan");
      return pending;
    }
    function showComplete() {
      var feedback = document.getElementById("m3-feedback");
      frame.classList.remove("is-m3-exp");
      frame.classList.remove("is-m3-proof");
      document.getElementById("m3-exp-layer").hidden = true;
      document.getElementById("m3-proof-layer").hidden = true;
      document.getElementById("m3-dialog").hidden = true;
      if (feedback && !m1OutcomeOpen) {
        feedback.hidden = true;
      }
      var pending = revealReward("m3-reward");
      renderMap();
      enterScreen("m3-selesai");
      return pending;
    }
    openM3Stage = function () {
      if (!m3.fikirSolved) {
        showFikir();
        return;
      }
      if (!m3.experimentSolved) {
        volume = 600;
        showExperiment();
        return;
      }
      if (!m3.buktiSolved) {
        showProof();
        return;
      }
      showComplete();
    };
    document.getElementById("m3-picture-back").addEventListener("click", showMap);
    document.querySelectorAll("[data-m3-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        var choice = button.getAttribute("data-m3-choice");
        if (box.editing(frame) || m1OutcomeOpen || m3.fikirSolved) {
          return;
        }
        if (choice === "600") {
          m3.fikirSolved = true;
          guideMemory.lastM3FikirWrong = "";
          recordM3(true, "Fikir: betul, 600 mL");
          showStageOutcome("m3", "betul", queue(function () {
            volume = 600;
            return showExperiment();
          }));
          return;
        }
        guideMemory.lastM3FikirWrong = choice;
        recordM3(false, "Fikir: salah, " + choice + " mL");
        showStageOutcome("m3", "cuba", function () {
          return;
        });
      });
    });
    document.querySelectorAll("[data-m3-pour]").forEach(function (button) {
      button.addEventListener("click", function () {
        var amount = Number(button.getAttribute("data-m3-pour"));
        var next;
        var token;
        if (box.editing(frame) || m1OutcomeOpen || !m3.fikirSolved || m3.experimentSolved) {
          return;
        }
        next = volume + amount;
        if (next > 1000) {
          guideMemory.lastM3ExpWrong = String(amount);
          recordM3(false, "Eksperimen: terlalu banyak, " + amount + " mL");
          showStageOutcome("m3", "cuba", function () {
            return;
          });
          return;
        }
        box.pour.m3 += 1;
        token = box.pour.m3;
        volume = next;
        box.placeFill("m3", volume, true);
        window.setTimeout(function () {
          if (token !== box.pour.m3 || missionThreeScreen.hidden) {
            return;
          }
          box.placeFill("m3", volume, false);
          if (volume === 1000 && !m3.experimentSolved) {
            m3.experimentSolved = true;
            guideMemory.lastM3ExpWrong = "";
            recordM3(true, "Eksperimen: betul, 1000 mL");
            showStageOutcome("m3", "betul", queue(showProof));
          }
        }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900);
      });
    });
    document.getElementById("m3-exp-reset").addEventListener("click", function () {
      if (box.editing(frame) || m1OutcomeOpen) {
        return;
      }
      box.pour.m3 += 1;
      volume = 600;
      box.placeFill("m3", 600, false);
    });
    document.getElementById("m3-fikir-dengar").addEventListener("click", replayCurrentInstruction);
    document.getElementById("m3-exp-dengar").addEventListener("click", replayCurrentInstruction);
    document.getElementById("m3-proof-dengar").addEventListener("click", replayCurrentInstruction);
    document.getElementById("m3-fikir-bantu").addEventListener("click", function () {
      if (!box.editing(frame) && !m1OutcomeOpen) {
        openGuidedHelp("m3-fikir");
      }
    });
    document.getElementById("m3-exp-bantu").addEventListener("click", function () {
      if (!box.editing(frame) && !m1OutcomeOpen) {
        openGuidedHelp("m3-eksperimen");
      }
    });
    document.getElementById("m3-proof-bantu").addEventListener("click", function () {
      if (!box.editing(frame) && !m1OutcomeOpen) {
        openGuidedHelp("m3-buktikan");
      }
    });
    document.querySelectorAll("[data-m3-proof]").forEach(function (button) {
      button.addEventListener("click", function () {
        var equation = button.getAttribute("data-m3-proof");
        if (box.editing(frame) || m1OutcomeOpen || !m3.experimentSolved || m3.buktiSolved) {
          return;
        }
        if (equation === "600+400=1000") {
          m3.buktiSolved = true;
          guideMemory.lastM3ProofWrong = "";
          recordM3(true, "Buktikan: betul, 600 + 400 = 1000");
          showStageOutcome("m3", "betul", queue(showComplete));
          return;
        }
        guideMemory.lastM3ProofWrong = equation;
        recordM3(false, "Buktikan: salah, " + equation);
        showStageOutcome("m3", "cuba", function () {
          return;
        });
      });
    });
    document.getElementById("m3-reward-next").addEventListener("click", function () {
      document.getElementById("m3-reward").hidden = true;
      showMissionFour();
    });
    document.getElementById("m3-reward-map").addEventListener("click", showMap);
    document.getElementById("m3-dialog-close").addEventListener("click", function () {
      document.getElementById("m3-dialog").hidden = true;
    });
  }

  function attachM4Picture(m4, recordM4) {
    var box = ensureM34();
    var frame = document.getElementById("m4-frame");
    var art = document.getElementById("m4-art");
    var volume = 0;
    var used = [];
    function queue(action) {
      box.wait.m4 += 1;
      var token = box.wait.m4;
      return function () {
        if (token !== box.wait.m4 || missionFourScreen.hidden) {
          return;
        }
        return action();
      };
    }
    function resetPipes() {
      box.pour.m4 += 1;
      volume = 0;
      used = [];
      box.placeFill("m4", 0, false);
    }
    function showFikir() {
      frame.classList.remove("is-m4-exp");
      frame.classList.remove("is-m4-proof");
      document.getElementById("m4-exp-layer").hidden = true;
      document.getElementById("m4-proof-layer").hidden = true;
      document.getElementById("m4-reward").hidden = true;
      var pending = assignArt(art, "assets/screens/m4/m4_fikir.png", "Misi 4 Fikir. Pilih dua paip yang jumlahnya 750 mL.");
      enterScreen("m4-fikir");
      return pending;
    }
    function showExperiment() {
      frame.classList.add("is-m4-exp");
      frame.classList.remove("is-m4-proof");
      document.getElementById("m4-exp-layer").hidden = false;
      document.getElementById("m4-proof-layer").hidden = true;
      document.getElementById("m4-reward").hidden = true;
      var pending = assignArt(art, "assets/screens/m4/m4_eksperimen.png", "Misi 4 Eksperimen. Sambungkan paip sehingga 750 mL.");
      box.placeFill("m4", volume, false);
      enterScreen("m4-eksperimen");
      return pending;
    }
    function showProof() {
      frame.classList.remove("is-m4-exp");
      frame.classList.add("is-m4-proof");
      document.getElementById("m4-exp-layer").hidden = true;
      document.getElementById("m4-proof-layer").hidden = false;
      document.getElementById("m4-reward").hidden = true;
      var pending = assignArt(art, "assets/screens/m4/m4_buktikan.png", "Misi 4 Buktikan. Tangki perlu 750 mL dan sudah ada 250 mL.");
      enterScreen("m4-buktikan");
      return pending;
    }
    function showComplete() {
      var feedback = document.getElementById("m4-feedback");
      frame.classList.remove("is-m4-exp");
      frame.classList.remove("is-m4-proof");
      document.getElementById("m4-exp-layer").hidden = true;
      document.getElementById("m4-proof-layer").hidden = true;
      document.getElementById("m4-dialog").hidden = true;
      if (feedback && !m1OutcomeOpen) {
        feedback.hidden = true;
      }
      var pending = revealReward("m4-reward");
      renderMap();
      enterScreen("m4-selesai");
      scheduleKoleksi();
      return pending;
    }
    openM4Stage = function () {
      if (!m4.fikirSolved) {
        showFikir();
        return;
      }
      if (!m4.experimentSolved) {
        resetPipes();
        showExperiment();
        return;
      }
      if (!m4.buktiSolved) {
        showProof();
        return;
      }
      if (koleksiCelebrated && showKoleksi(false)) {
        return;
      }
      showComplete();
    };
    document.getElementById("m4-picture-back").addEventListener("click", showMap);
    document.querySelectorAll("[data-m4-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        var choice = button.getAttribute("data-m4-choice");
        if (box.editing(frame) || m1OutcomeOpen || m4.fikirSolved) {
          return;
        }
        if (choice === "250+500") {
          m4.fikirSolved = true;
          guideMemory.lastM4FikirWrong = "";
          recordM4(true, "Fikir: betul, 250 + 500");
          showStageOutcome("m4", "betul", queue(function () {
            resetPipes();
            return showExperiment();
          }));
          return;
        }
        guideMemory.lastM4FikirWrong = choice;
        recordM4(false, "Fikir: salah, " + choice);
        showStageOutcome("m4", "cuba", function () {
          return;
        });
      });
    });
    document.querySelectorAll("[data-m4-pipe]").forEach(function (button) {
      button.addEventListener("click", function () {
        var amount = Number(button.getAttribute("data-m4-pipe"));
        var token;
        if (box.editing(frame) || m1OutcomeOpen || !m4.fikirSolved || m4.experimentSolved) {
          return;
        }
        if (used.indexOf(amount) !== -1) {
          return;
        }
        used.push(amount);
        volume += amount;
        box.pour.m4 += 1;
        token = box.pour.m4;
        box.placeFill("m4", volume, true);
        window.setTimeout(function () {
          var wrong;
          if (token !== box.pour.m4 || missionFourScreen.hidden) {
            return;
          }
          box.placeFill("m4", volume, false);
          if (volume === 750 && used.length === 2 && used.indexOf(200) === -1 && !m4.experimentSolved) {
            m4.experimentSolved = true;
            guideMemory.lastM4ExpWrong = "";
            recordM4(true, "Eksperimen: betul, 250 + 500 = 750");
            showStageOutcome("m4", "betul", queue(showProof));
            return;
          }
          wrong = used.indexOf(200) !== -1 || used.length >= 2;
          if (wrong) {
            guideMemory.lastM4ExpWrong = used.indexOf(200) !== -1 ? "200" : "";
            recordM4(false, "Eksperimen: salah, " + used.join(" + "));
            showStageOutcome("m4", "cuba", queue(function () {
              resetPipes();
              return showExperiment();
            }));
          }
        }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900);
      });
    });
    document.getElementById("m4-exp-reset").addEventListener("click", function () {
      if (box.editing(frame) || m1OutcomeOpen) {
        return;
      }
      resetPipes();
    });
    document.getElementById("m4-fikir-dengar").addEventListener("click", replayCurrentInstruction);
    document.getElementById("m4-exp-dengar").addEventListener("click", replayCurrentInstruction);
    document.getElementById("m4-proof-dengar").addEventListener("click", replayCurrentInstruction);
    document.getElementById("m4-fikir-bantu").addEventListener("click", function () {
      if (!box.editing(frame) && !m1OutcomeOpen) {
        openGuidedHelp("m4-fikir");
      }
    });
    document.getElementById("m4-exp-bantu").addEventListener("click", function () {
      if (!box.editing(frame) && !m1OutcomeOpen) {
        openGuidedHelp("m4-eksperimen");
      }
    });
    document.getElementById("m4-proof-bantu").addEventListener("click", function () {
      if (!box.editing(frame) && !m1OutcomeOpen) {
        openGuidedHelp("m4-buktikan");
      }
    });
    document.querySelectorAll("[data-m4-proof]").forEach(function (button) {
      button.addEventListener("click", function () {
        var choice = button.getAttribute("data-m4-proof");
        if (box.editing(frame) || m1OutcomeOpen || !m4.experimentSolved || m4.buktiSolved) {
          return;
        }
        if (choice === "500") {
          m4.buktiSolved = true;
          guideMemory.lastM4ProofWrong = "";
          recordM4(true, "Buktikan: betul, 250 + 500 = 750");
          showStageOutcome("m4", "betul", queue(showComplete));
          return;
        }
        guideMemory.lastM4ProofWrong = choice;
        recordM4(false, "Buktikan: salah, " + choice + " mL");
        showStageOutcome("m4", "cuba", function () {
          return;
        });
      });
    });
    document.getElementById("m4-reward-next").addEventListener("click", showMap);
    document.getElementById("m4-reward-map").addEventListener("click", showMap);
    document.getElementById("m4-dialog-close").addEventListener("click", function () {
      document.getElementById("m4-dialog").hidden = true;
    });
  }

  function allMissionsComplete() {
    return missionOneComplete() && m2Complete() && m3Complete() && m4Complete();
  }

  function setupKoleksi() {
    var KEY = "nexa-koleksi-debug";
    var screen = document.getElementById("koleksi-screen");
    var frame = document.getElementById("koleksi-frame");
    var editor = document.getElementById("koleksi-editor");
    var note = document.getElementById("koleksi-note");
    var readout = document.getElementById("koleksi-readout");
    var fill = document.getElementById("koleksi-fill");
    var ids = {
      b1: "koleksi-badge-1",
      b2: "koleksi-badge-2",
      b3: "koleksi-badge-3",
      b4: "koleksi-badge-4",
      bar: "koleksi-bar",
      p1: "koleksi-mile-1",
      p2: "koleksi-mile-2",
      p3: "koleksi-mile-3",
      p4: "koleksi-mile-4",
      tahniah: "koleksi-tahniah"
    };
    var order = ["b1", "b2", "b3", "b4", "bar", "p1", "p2", "p3", "p4", "tahniah"];
    var timers = [];
    var drag = null;
    function fresh() {
      return {
        b1: { left: 7.4, top: 43.6, width: 39.8, height: 15.9 },
        b2: { left: 55, top: 43.9, width: 42.8, height: 16.1 },
        b3: { left: 7.1, top: 66.2, width: 39.8, height: 16.3 },
        b4: { left: 54.4, top: 66.5, width: 41, height: 17.1 },
        bar: { left: 14.4, top: 37.7, width: 50, height: 1.6 },
        p1: { left: 14.6, top: 37.5, width: 4.3, height: 2.5 },
        p2: { left: 30.8, top: 37.5, width: 4.2, height: 2.6 },
        p3: { left: 46.7, top: 37.2, width: 4.2, height: 2.6 },
        p4: { left: 62, top: 37.5, width: 4.2, height: 2.6 },
        tahniah: { left: 28, top: 91.1, width: 44, height: 5.5 }
      };
    }
    var layout = fresh();
    function round1(value) {
      return Math.round(value * 10) / 10;
    }
    function slotOk(slot) {
      return slot && isFinite(slot.left) && isFinite(slot.top) && isFinite(slot.width) && isFinite(slot.height) && slot.width >= 1 && slot.width <= 80 && slot.height >= 1 && slot.height <= 40 && slot.left >= 0 && slot.top >= 0 && slot.left <= 100 && slot.top <= 100;
    }
    function applyOne(key) {
      var el = document.getElementById(ids[key]);
      var slot = layout[key];
      if (!el || !slot) {
        return;
      }
      el.style.setProperty("--x", slot.left + "%");
      el.style.setProperty("--y", slot.top + "%");
      el.style.setProperty("--w", slot.width + "%");
      el.style.setProperty("--h", slot.height + "%");
    }
    function applyAll() {
      var index;
      for (index = 0; index < order.length; index += 1) {
        applyOne(order[index]);
      }
      readout.textContent = JSON.stringify(layout);
    }
    function readSaved() {
      var raw;
      var data;
      var index;
      var key;
      try {
        raw = localStorage.getItem(KEY);
        if (!raw) {
          return;
        }
        data = JSON.parse(raw);
      } catch (error) {
        return;
      }
      if (!data) {
        return;
      }
      for (index = 0; index < order.length; index += 1) {
        key = order[index];
        if (slotOk(data[key])) {
          layout[key] = {
            left: data[key].left,
            top: data[key].top,
            width: data[key].width,
            height: data[key].height
          };
        }
      }
    }
    function clearTimers() {
      var index;
      for (index = 0; index < timers.length; index += 1) {
        window.clearTimeout(timers[index]);
      }
      timers = [];
    }
    function earned(key) {
      if (key === "b1") {
        return missionOneComplete();
      }
      if (key === "b2") {
        return m2Complete();
      }
      if (key === "b3") {
        return m3Complete();
      }
      if (key === "b4") {
        return m4Complete();
      }
      return false;
    }
    function setFill(percent, animate) {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      fill.style.transition = animate && !reduce ? "width 650ms ease" : "none";
      fill.style.width = percent + "%";
    }
    function reach(key) {
      var bar = layout.bar;
      var slot = layout[key];
      var center;
      var rel;
      if (!bar || !slot || bar.width <= 0) {
        return 100;
      }
      center = slot.left + slot.width / 2;
      rel = (center - bar.left) / bar.width * 100;
      if (rel < 0) {
        rel = 0;
      }
      if (rel > 100) {
        rel = 100;
      }
      return rel;
    }
    function markMile(key, on) {
      document.getElementById(ids[key]).classList.toggle("is-on", on);
    }
    function settle() {
      var badges = ["b1", "b2", "b3", "b4"];
      var miles = ["p1", "p2", "p3", "p4"];
      var index;
      var el;
      clearTimers();
      for (index = 0; index < badges.length; index += 1) {
        el = document.getElementById(ids[badges[index]]);
        el.classList.remove("is-shown");
        el.classList.toggle("is-settled", earned(badges[index]));
      }
      for (index = 0; index < miles.length; index += 1) {
        markMile(miles[index], true);
      }
      setFill(100, false);
    }
    function pop(key, percent, mile) {
      var el = document.getElementById(ids[key]);
      if (earned(key)) {
        el.classList.remove("is-settled");
        el.classList.remove("is-shown");
        void el.offsetWidth;
        el.classList.add("is-shown");
      }
      setFill(percent, true);
      if (mile) {
        markMile(mile, true);
      }
    }
    function play() {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var steps;
      var index;
      clearTimers();
      ["b1", "b2", "b3", "b4"].forEach(function (key) {
        var el = document.getElementById(ids[key]);
        el.classList.remove("is-shown");
        el.classList.remove("is-settled");
      });
      ["p1", "p2", "p3", "p4"].forEach(function (key) {
        markMile(key, false);
      });
      setFill(0, false);
      if (reduce) {
        settle();
        return;
      }
      steps = [
        [360, "b1", reach("p1"), "p1"],
        [1080, "b2", reach("p2"), "p2"],
        [1800, "b3", reach("p3"), "p3"],
        [2520, "b4", 100, "p4"]
      ];
      for (index = 0; index < steps.length; index += 1) {
        (function (step) {
          timers.push(window.setTimeout(function () {
            if (screen.hidden) {
              return;
            }
            pop(step[1], step[2], step[3]);
          }, step[0]));
        }(steps[index]));
      }
    }
    function placeEditor() {
      var rect;
      var gutter;
      editor.classList.remove("is-docked");
      editor.classList.remove("is-stacked");
      editor.style.width = "";
      screen.classList.remove("is-koleksi-editor-stacked");
      if (editor.hidden) {
        return;
      }
      rect = frame.getBoundingClientRect();
      gutter = window.innerWidth - rect.right;
      if (gutter >= 250) {
        editor.classList.add("is-docked");
        editor.style.width = Math.min(340, Math.floor(gutter - 28)) + "px";
      } else {
        editor.classList.add("is-stacked");
        screen.classList.add("is-koleksi-editor-stacked");
      }
    }
    function setEditing(on) {
      frame.classList.toggle("is-koleksi-editing", on);
      editor.hidden = !on;
      if (on) {
        settle();
        note.textContent = "Seret lencana, bar kemajuan, titik atau butang TAHNIAH. Seret sudut kuning untuk ubah saiz.";
        readout.textContent = JSON.stringify(layout);
      }
      placeEditor();
    }
    showKoleksi = function (animate) {
      if (!allMissionsComplete()) {
        return false;
      }
      hideEntryScreens();
      mapScreen.hidden = true;
      missionScreen.hidden = true;
      missionTwoScreen.hidden = true;
      missionThreeScreen.hidden = true;
      missionFourScreen.hidden = true;
      screen.hidden = false;
      window.scrollTo(0, 0);
      if (animate && !koleksiCelebrated) {
        koleksiCelebrated = true;
        play();
        enterScreen("koleksi");
        return true;
      }
      settle();
      stopNarration();
      narrationScreenId = "koleksi";
      return true;
    };
    scheduleKoleksi = function () {
      clearTimers();
      if (!allMissionsComplete() || koleksiCelebrated) {
        return;
      }
      timers.push(window.setTimeout(function () {
        if (missionFourScreen.hidden || document.getElementById("m4-reward").hidden || !allMissionsComplete()) {
          return;
        }
        showKoleksi(true);
      }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1400 : 2800));
    };
    cancelKoleksi = function () {
      clearTimers();
      setEditing(false);
      screen.hidden = true;
    };
    document.getElementById("koleksi-tahniah").addEventListener("click", function () {
      if (frame.classList.contains("is-koleksi-editing")) {
        return;
      }
      showMap();
    });
    order.forEach(function (key) {
      var el = document.getElementById(ids[key]);
      el.addEventListener("pointerdown", function (event) {
        var rect;
        if (!frame.classList.contains("is-koleksi-editing") || (event.button !== undefined && event.button !== 0)) {
          return;
        }
        if (event.target.classList.contains("koleksi-handle")) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        rect = frame.getBoundingClientRect();
        drag = {
          pointerId: event.pointerId,
          key: key,
          resize: false,
          startX: event.clientX,
          startY: event.clientY,
          left: layout[key].left,
          top: layout[key].top,
          width: layout[key].width,
          height: layout[key].height,
          frameWidth: rect.width,
          frameHeight: rect.height
        };
        el.setPointerCapture(event.pointerId);
      });
      el.addEventListener("pointermove", function (event) {
        var dx;
        var dy;
        var box;
        if (!drag || drag.pointerId !== event.pointerId || drag.key !== key) {
          return;
        }
        event.preventDefault();
        dx = (event.clientX - drag.startX) / drag.frameWidth * 100;
        dy = (event.clientY - drag.startY) / drag.frameHeight * 100;
        box = layout[key];
        if (drag.resize) {
          box.width = round1(drag.width + dx);
          box.height = round1(drag.height + dy);
        } else {
          box.left = round1(drag.left + dx);
          box.top = round1(drag.top + dy);
        }
        if (box.width < 1) { box.width = 1; }
        if (box.height < 1) { box.height = 1; }
        if (box.width > 80) { box.width = 80; }
        if (box.height > 40) { box.height = 40; }
        if (box.left < 0) { box.left = 0; }
        if (box.top < 0) { box.top = 0; }
        if (box.left > 100) { box.left = 100; }
        if (box.top > 100) { box.top = 100; }
        applyOne(key);
        readout.textContent = JSON.stringify(layout);
      });
      el.addEventListener("pointerup", function (event) {
        if (drag && drag.pointerId === event.pointerId) {
          drag = null;
        }
      });
      el.addEventListener("pointercancel", function (event) {
        if (drag && drag.pointerId === event.pointerId) {
          drag = null;
        }
      });
      el.querySelector(".koleksi-handle").addEventListener("pointerdown", function (event) {
        var rect;
        if (!frame.classList.contains("is-koleksi-editing") || (event.button !== undefined && event.button !== 0)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        rect = frame.getBoundingClientRect();
        drag = {
          pointerId: event.pointerId,
          key: key,
          resize: true,
          startX: event.clientX,
          startY: event.clientY,
          left: layout[key].left,
          top: layout[key].top,
          width: layout[key].width,
          height: layout[key].height,
          frameWidth: rect.width,
          frameHeight: rect.height
        };
        el.setPointerCapture(event.pointerId);
      });
    });
    document.getElementById("koleksi-save").addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(layout));
        note.textContent = "Disimpan dalam pelayar ini.";
      } catch (error) {
        note.textContent = "Tidak dapat disimpan dalam pelayar ini.";
      }
    });
    document.getElementById("koleksi-copy").addEventListener("click", function () {
      var text = JSON.stringify(layout);
      readout.textContent = text;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          note.textContent = "Tetapan disalin.";
        }, function () {
          note.textContent = "Salin teks di bawah.";
        });
        return;
      }
      note.textContent = "Salin teks di bawah.";
    });
    document.getElementById("koleksi-reset").addEventListener("click", function () {
      layout = fresh();
      applyAll();
      settle();
      try {
        localStorage.removeItem(KEY);
      } catch (error) {
      }
      note.textContent = "Tetapan asal dipulihkan.";
    });
    document.getElementById("koleksi-close").addEventListener("click", function () {
      setEditing(false);
    });
    editor.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
    window.addEventListener("resize", placeEditor);
    document.addEventListener("keydown", function (event) {
      if (event.code !== "KeyE" || !event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.repeat) {
        return;
      }
      if (screen.hidden) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setEditing(!frame.classList.contains("is-koleksi-editing"));
    }, true);
    applyAll();
  }

  var showKoleksi = function () {
    return false;
  };
  var scheduleKoleksi = function () {};
  setupKoleksi();

  try {
    localStorage.removeItem("nexa-m2-fikir-hotspots");
    localStorage.removeItem("nexa-m34-debug");
    localStorage.removeItem("nexa-map-sign-debug");
    localStorage.removeItem("nexa-map-tick-debug");
    localStorage.removeItem("nexa-koleksi-debug");
  } catch (error) {
  }
  refreshNovaStatus();
  enterScreen("welcome");
})();
