function createTrackUI() {
  const tracksContainer = document.getElementById("tracks");
  if (!tracksContainer) {
    console.error("Tracks container not found");
    return;
  }

  tracksContainer.innerHTML = "";

  window.sequencer.tracks.forEach((track, trackIndex) => {
    const trackDiv = document.createElement("div");
    trackDiv.className = "track";

    trackDiv.innerHTML = `
      <div class="track-header">
        <div class="track-name">${track.name}</div>
        <div class="track-controls">
          <label>Wave: 
            <select class="wave-select" data-track="${trackIndex}">
              <optgroup label="Classic">
                <option value="square" ${
                  track.type === "square" ? "selected" : ""
                }>Square</option>
                <option value="sawtooth" ${
                  track.type === "sawtooth" ? "selected" : ""
                }>Sawtooth</option>
                <option value="triangle" ${
                  track.type === "triangle" ? "selected" : ""
                }>Triangle</option>
                <option value="sine" ${
                  track.type === "sine" ? "selected" : ""
                }>Sine</option>
              </optgroup>
              <optgroup label="Chip Waves">
                <option value="pulse25" ${
                  track.type === "pulse25" ? "selected" : ""
                }>Pulse 25%</option>
                <option value="pulse12" ${
                  track.type === "pulse12" ? "selected" : ""
                }>Pulse 12.5%</option>
                <option value="fatSaw" ${
                  track.type === "fatSaw" ? "selected" : ""
                }>Fat Saw</option>
                <option value="pwmPulse" ${
                  track.type === "pwmPulse" ? "selected" : ""
                }>PWM Pulse</option>
              </optgroup>
              <optgroup label="Percussion">
                <option value="whiteSnare" ${
                  track.type === "whiteSnare" ? "selected" : ""
                }>White Snare</option>
                <option value="pinkTom" ${
                  track.type === "pinkTom" ? "selected" : ""
                }>Pink Tom</option>
                <option value="brownKick" ${
                  track.type === "brownKick" ? "selected" : ""
                }>Brown Kick</option>
                <option value="hihat" ${
                  track.type === "hihat" ? "selected" : ""
                }>Hi-Hat</option>
              </optgroup>
              <optgroup label="FM Synths">
                <option value="fmBell" ${
                  track.type === "fmBell" ? "selected" : ""
                }>FM Bell</option>
                <option value="fmBass" ${
                  track.type === "fmBass" ? "selected" : ""
                }>FM Bass</option>
                <option value="fmBrass" ${
                  track.type === "fmBrass" ? "selected" : ""
                }>FM Brass</option>
                <option value="fmWobble" ${
                  track.type === "fmWobble" ? "selected" : ""
                }>FM Wobble</option>
              </optgroup>
              <optgroup label="Effects">
                <option value="lpSweep" ${
                  track.type === "lpSweep" ? "selected" : ""
                }>LP Sweep</option>
                <option value="hpStab" ${
                  track.type === "hpStab" ? "selected" : ""
                }>HP Stab</option>
                <option value="resonantSweep" ${
                  track.type === "resonantSweep" ? "selected" : ""
                }>Resonant Sweep</option>
                <option value="bitcrush" ${
                  track.type === "bitcrush" ? "selected" : ""
                }>Bitcrush</option>
              </optgroup>
              <optgroup label="Atmospheric">
                <option value="padWash" ${
                  track.type === "padWash" ? "selected" : ""
                }>Pad Wash</option>
                <option value="crystalBell" ${
                  track.type === "crystalBell" ? "selected" : ""
                }>Crystal Bell</option>
                <option value="windSweep" ${
                  track.type === "windSweep" ? "selected" : ""
                }>Wind Sweep</option>
                <option value="digitalRain" ${
                  track.type === "digitalRain" ? "selected" : ""
                }>Digital Rain</option>
              </optgroup>
            </select>
          </label>
          <div class="volume-control">
            <label>Vol: </label>
            <input type="range" class="volume-slider" data-track="${trackIndex}" min="0" max="1" step="0.1" value="${
      track.volume
    }">
            <span class="volume-display">${Math.round(
              track.volume * 100
            )}%</span>
          </div>
          <button class="mute-btn" data-track="${trackIndex}">${
      track.muted ? "🔇" : "🔊"
    }</button>
          <button class="clear-track-btn" data-track="${trackIndex}">Clear</button>
        </div>
      </div>
      <div class="sequencer" data-track="${trackIndex}">
        ${Array(32)
          .fill(0)
          .map(
            (_, stepIndex) => `
          <div class="step" data-track="${trackIndex}" data-step="${stepIndex}">
            ${
              stepIndex % 4 === 0
                ? `<div class="step-counter">${stepIndex + 1}</div>`
                : ""
            }
            ${track.getNote(stepIndex) || ""}
          </div>
        `
          )
          .join("")}
      </div>
    `;

    tracksContainer.appendChild(trackDiv);
  });
}

function setupEventListeners() {
  let selectedNote = "C";
  let selectedOctave = 4;

  // Initialize audio button
  const initBtn = document.getElementById("initBtn");
  const playBtn = document.getElementById("playBtn");
  const stopBtn = document.getElementById("stopBtn");
  const recordBtn = document.getElementById("recordBtn");
  const clearBtn = document.getElementById("clearBtn");
  const tempoSlider = document.getElementById("tempoSlider");
  const tempoDisplay = document.getElementById("tempoDisplay");
  const saveBtn = document.getElementById("saveBtn");
  const loadBtn = document.getElementById("loadBtn");
  const songDataTextarea = document.getElementById("songData");
  const octaveSelect = document.getElementById("octaveSelect");

  // Initialize audio
  if (initBtn) {
    initBtn.addEventListener("click", async () => {
      await window.audioEngine.initialize();
      initBtn.disabled = true;
      playBtn.disabled = false;
      stopBtn.disabled = false;
      recordBtn.disabled = false;
      initBtn.textContent = "✅ Audio Ready";
    });
  }

  // Play/Stop controls
  if (playBtn) {
    playBtn.addEventListener("click", async () => {
      await window.sequencer.start();
      playBtn.disabled = true;
      stopBtn.disabled = false;
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      window.sequencer.stop();
      playBtn.disabled = false;
      stopBtn.disabled = false;

      // Clear all playing indicators
      document.querySelectorAll(".step.playing").forEach((step) => {
        step.classList.remove("playing");
      });
    });
  }

  // Record button
  if (recordBtn) {
    recordBtn.addEventListener("click", async () => {
      try {
        recordBtn.textContent = "⏺ Recording...";
        recordBtn.disabled = true;

        const mp3Blob = await window.sequencer.recordToMp3();

        // Create download link
        const url = URL.createObjectURL(mp3Blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "chiptune-track.mp3";
        a.click();
        URL.revokeObjectURL(url);

        recordBtn.textContent = "⏺ Record MP3";
        recordBtn.disabled = false;
      } catch (error) {
        console.error("Recording failed:", error);
        recordBtn.textContent = "⏺ Record MP3";
        recordBtn.disabled = false;
      }
    });
  }

  // Clear all button
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear all tracks?")) {
        window.sequencer.clearAllTracks();
        createTrackUI();
        setupEventListeners();
      }
    });
  }

  // Tempo control
  if (tempoSlider && tempoDisplay) {
    tempoSlider.addEventListener("input", (e) => {
      const tempo = parseInt(e.target.value);
      window.sequencer.setTempo(tempo);
      tempoDisplay.textContent = `${tempo} BPM`;
    });
  }

  // Note selection
  document.querySelectorAll(".note-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".note-btn")
        .forEach((b) => b.classList.remove("selected"));
      e.target.classList.add("selected");
      selectedNote = e.target.dataset.note;
    });
  });

  // Octave selection
  if (octaveSelect) {
    octaveSelect.addEventListener("change", (e) => {
      selectedOctave = parseInt(e.target.value);
    });
  }

  // Step clicks
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("step")) {
      const trackIndex = parseInt(e.target.dataset.track);
      const stepIndex = parseInt(e.target.dataset.step);
      const track = window.sequencer.getTrack(trackIndex);

      if (track.getNote(stepIndex)) {
        // Remove note
        track.removeNote(stepIndex);
        e.target.textContent = "";
        e.target.classList.remove("active");
      } else {
        // Add note
        const noteToAdd =
          selectedNote === "REST" ? "REST" : `${selectedNote}${selectedOctave}`;
        track.setNote(stepIndex, noteToAdd);
        e.target.textContent = selectedNote;
        e.target.classList.add("active");
      }
    }
  });

  // Track controls
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("wave-select")) {
      const trackIndex = parseInt(e.target.dataset.track);
      window.sequencer.updateTrackSynth(trackIndex, e.target.value);
    }

    if (e.target.classList.contains("volume-slider")) {
      const trackIndex = parseInt(e.target.dataset.track);
      const volume = parseFloat(e.target.value);
      window.sequencer.updateTrackVolume(trackIndex, volume);

      const display = e.target.parentNode.querySelector(".volume-display");
      if (display) {
        display.textContent = `${Math.round(volume * 100)}%`;
      }
    }
  });

  // Mute and clear buttons
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("mute-btn")) {
      const trackIndex = parseInt(e.target.dataset.track);
      const isMuted = window.sequencer.toggleTrackMute(trackIndex);
      e.target.textContent = isMuted ? "🔇" : "🔊";
    }

    if (e.target.classList.contains("clear-track-btn")) {
      const trackIndex = parseInt(e.target.dataset.track);
      window.sequencer.getTrack(trackIndex).clear();
      createTrackUI();
      setupEventListeners();
    }
  });

  // Save/Load functionality
  if (saveBtn && songDataTextarea) {
    saveBtn.addEventListener("click", () => {
      const songData = {
        sequencer: window.sequencer.export(),
        patternChain: window.patternChain.export(),
      };
      songDataTextarea.value = JSON.stringify(songData, null, 2);
    });
  }

  if (loadBtn && songDataTextarea) {
    loadBtn.addEventListener("click", () => {
      try {
        const songData = JSON.parse(songDataTextarea.value);
        if (songData.sequencer) {
          window.sequencer.import(songData.sequencer);
        }
        if (songData.patternChain) {
          window.patternChain.import(songData.patternChain);
        }
        createTrackUI();
        setupEventListeners();
        if (window.patternChainUI) {
          window.patternChainUI.updatePatternDisplay();
        }
        if (window.swingUI) {
          window.swingUI.updateUI();
        }
      } catch (error) {
        alert("Invalid song data format");
        console.error("Load error:", error);
      }
    });
  }

  // Step change callback for visual feedback
  window.sequencer.onStepChange = (currentStep) => {
    // Clear all playing indicators
    document.querySelectorAll(".step.playing").forEach((step) => {
      step.classList.remove("playing");
    });

    // Add playing indicator to current steps
    document
      .querySelectorAll(`[data-step="${currentStep}"]`)
      .forEach((step) => {
        step.classList.add("playing");
      });

    // Update step counter
    const stepCounter = document.getElementById("currentStep");
    if (stepCounter) {
      stepCounter.textContent = currentStep + 1;
    }
  };
}

// Expose functions globally
window.createTrackUI = createTrackUI;
window.setupEventListeners = setupEventListeners;
