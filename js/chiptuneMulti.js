// Tone.js Recorder initialization
const recorder = new Tone.Recorder();
Tone.Destination.connect(recorder);

// Set Tone.js lookAhead for tighter scheduling
Tone.context.lookAhead = 0.05;

let audioInitialized = false;
let isPlaying = false;
let currentStep = 0;
let selectedNote = "C";
let selectedOctave = 4;
let tempo = 120;
let recordLoop;
let stepResolution = "16n"; // Default to 16th notes

const tracks = [
  {
    name: "Lead",
    type: "square",
    volume: 0.7,
    muted: false,
    sequence: Array(32).fill(null),
  },
  {
    name: "Bass",
    type: "fmBass",
    volume: 0.8,
    muted: false,
    sequence: Array(32).fill(null),
  },
  {
    name: "Arp",
    type: "pulse25",
    volume: 0.6,
    muted: false,
    sequence: Array(32).fill(null),
  },
  {
    name: "Perc",
    type: "whiteSnare",
    volume: 0.5,
    muted: false,
    sequence: Array(32).fill(null),
  },
  {
    name: "Pad",
    type: "padWash",
    volume: 0.4,
    muted: false,
    sequence: Array(32).fill(null),
  },
  {
    name: "FX",
    type: "fmBell",
    volume: 0.3,
    muted: false,
    sequence: Array(32).fill(null),
  },
];

let synths = [];
let mainLoop;
let previewSynths = {};
let limiter = null;

function createSynth(type) {
  let synth;

  switch (type) {
    // Classic Waves
    case "square":
      synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
      }).connect(limiter);
      break;

    case "sawtooth":
      synth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
      }).connect(limiter);
      break;

    case "triangle":
      synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
      }).connect(limiter);
      break;

    case "sine":
      synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 1.0 },
      }).connect(limiter);
      break;

    // Enhanced Chip Waves
    case "pulse25":
      synth = new Tone.Synth({
        oscillator: { type: "pulse", width: 0.25 },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
      }).connect(limiter);
      break;

    case "pulse12":
      synth = new Tone.Synth({
        oscillator: { type: "pulse", width: 0.125 },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
      }).connect(limiter);
      break;

    case "fatSaw":
      synth = new Tone.Synth({
        oscillator: { type: "fatsawtooth" },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
      }).connect(limiter);
      break;

    case "pwmPulse":
      synth = new Tone.Synth({
        oscillator: { type: "pulse", width: 0.5 },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
      }).connect(limiter);
      // Add PWM LFO
      const pwmLFO = new Tone.LFO(2, 0.1, 0.9);
      pwmLFO.connect(synth.oscillator.width);
      pwmLFO.start();
      break;

    // Percussion & Noise
    case "whiteSnare":
      synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
      }).connect(limiter);
      break;

    case "pinkTom":
      synth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0 },
      }).connect(limiter);
      break;

    case "brownKick":
      synth = new Tone.NoiseSynth({
        noise: { type: "brown" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0 },
      }).connect(limiter);
      break;

    case "hihat":
      const hihatFilter = new Tone.Filter(8000, "highpass").connect(limiter);
      synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.01, decay: 0.05, sustain: 0 },
      }).connect(hihatFilter);
      break;

    // FM Synthesis
    case "fmBell":
      synth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 1 },
        modulation: { type: "sine" },
        modulationEnvelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0,
          release: 0.2,
        },
      }).connect(limiter);
      break;

    case "fmBass":
      synth = new Tone.MonoSynth({
        oscillator: { type: "square" },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
      }).connect(limiter);
      break;

    case "fmBrass":
      synth = new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 8,
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.3 },
        modulation: { type: "square" },
        modulationEnvelope: {
          attack: 0.1,
          decay: 0.1,
          sustain: 0.5,
          release: 0.1,
        },
      }).connect(limiter);
      break;

    case "fmWobble":
      synth = new Tone.FMSynth({
        harmonicity: 1,
        modulationIndex: 15,
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.5 },
        modulation: { type: "sine" },
        modulationEnvelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 1,
          release: 0.1,
        },
      }).connect(limiter);
      // Add wobble LFO
      const wobbleLFO = new Tone.LFO(8, 1, 20);
      wobbleLFO.connect(synth.modulationIndex);
      wobbleLFO.start();
      break;

    // Filtered & Effects
    case "lpSweep":
      const lpFilter = new Tone.Filter(200, "lowpass").connect(limiter);
      const lpLFO = new Tone.LFO(0.5, 100, 2000);
      lpLFO.connect(lpFilter.frequency);
      lpLFO.start();
      synth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 1 },
      }).connect(lpFilter);
      break;

    case "hpStab":
      const hpFilter = new Tone.Filter(1000, "highpass").connect(limiter);
      synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
      }).connect(hpFilter);
      break;

    case "resonantSweep":
      const resonantFilter = new Tone.Filter(500, "lowpass", -24).connect(
        limiter
      );
      resonantFilter.Q.value = 15;
      const resLFO = new Tone.LFO(1, 200, 2000);
      resLFO.connect(resonantFilter.frequency);
      resLFO.start();
      synth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
      }).connect(resonantFilter);
      break;

    case "bitcrush":
      const bitCrusher = new Tone.BitCrusher(4).connect(limiter);
      synth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.3 },
      }).connect(bitCrusher);
      break;

    // Atmospheric
    case "padWash":
      const reverb = new Tone.Reverb(8).connect(limiter);
      synth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 },
      }).connect(reverb);
      break;

    case "crystalBell":
      const reverb2 = new Tone.Reverb(8).connect(limiter);
      synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 2, sustain: 0.1, release: 3 },
      }).connect(reverb2);
      break;

    case "windSweep":
      const reverb3 = new Tone.Reverb(8).connect(limiter);
      synth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 1, decay: 2, sustain: 0.5, release: 4 },
      }).connect(reverb3);
      break;

    case "digitalRain":
      const reverb4 = new Tone.Reverb(8).connect(limiter);
      const digitalFilter = new Tone.Filter(2000, "bandpass").connect(reverb4);
      synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 1 },
      }).connect(digitalFilter);
      break;

    // Default fallback
    default:
      synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
      }).connect(limiter);
  }

  return synth;
}

function initializeAudio() {
  // Create limiter at the top and store globally
  limiter = new Tone.Limiter(-6).toDestination();

  tracks.forEach((track, index) => {
    const synth = createSynth(track.type);
    synth.volume.value = Tone.gainToDb(track.volume);
    synths.push(synth);
  });

  // Initialize preview synths for game FX
  previewSynths.coin = createSynth("fmBell");
  previewSynths.jump = createSynth("square");
  previewSynths.laser = createSynth("square");
  previewSynths.powerup = createSynth("fmBell");

  audioInitialized = true;
}

function previewSound(soundType) {
  if (!audioInitialized) return;

  switch (soundType) {
    case "coin":
      previewSynths.coin.triggerAttackRelease("C6", "16n");
      previewSynths.coin.triggerAttackRelease("E6", "16n", "+0.1");
      break;
    case "jump":
      previewSynths.jump.triggerAttackRelease("C5", "16n");
      break;
    case "laser":
      previewSynths.laser.triggerAttackRelease("C6", "8n");
      break;
    case "powerup":
      const notes = ["C5", "E5", "G5", "C6"];
      notes.forEach((note, i) => {
        previewSynths.powerup.triggerAttackRelease(note, "16n", "+" + i * 0.1);
      });
      break;
  }
}

function createTrackUI() {
  const tracksContainer = document.getElementById("tracks");
  tracksContainer.innerHTML = "";

  tracks.forEach((track, trackIndex) => {
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
                                          track.type === "square"
                                            ? "selected"
                                            : ""
                                        }>Square</option>
                                        <option value="sawtooth" ${
                                          track.type === "sawtooth"
                                            ? "selected"
                                            : ""
                                        }>Sawtooth</option>
                                        <option value="triangle" ${
                                          track.type === "triangle"
                                            ? "selected"
                                            : ""
                                        }>Triangle</option>
                                        <option value="sine" ${
                                          track.type === "sine"
                                            ? "selected"
                                            : ""
                                        }>Sine</option>
                                    </optgroup>
                                    <optgroup label="Chip Waves">
                                        <option value="pulse25" ${
                                          track.type === "pulse25"
                                            ? "selected"
                                            : ""
                                        }>Pulse 25%</option>
                                        <option value="pulse12" ${
                                          track.type === "pulse12"
                                            ? "selected"
                                            : ""
                                        }>Pulse 12.5%</option>
                                        <option value="fatSaw" ${
                                          track.type === "fatSaw"
                                            ? "selected"
                                            : ""
                                        }>Fat Saw</option>
                                        <option value="pwmPulse" ${
                                          track.type === "pwmPulse"
                                            ? "selected"
                                            : ""
                                        }>PWM Pulse</option>
                                    </optgroup>
                                    <optgroup label="Percussion">
                                        <option value="whiteSnare" ${
                                          track.type === "whiteSnare"
                                            ? "selected"
                                            : ""
                                        }>White Snare</option>
                                        <option value="pinkTom" ${
                                          track.type === "pinkTom"
                                            ? "selected"
                                            : ""
                                        }>Pink Tom</option>
                                        <option value="brownKick" ${
                                          track.type === "brownKick"
                                            ? "selected"
                                            : ""
                                        }>Brown Kick</option>
                                        <option value="hihat" ${
                                          track.type === "hihat"
                                            ? "selected"
                                            : ""
                                        }>Hi-Hat</option>
                                    </optgroup>
                                    <optgroup label="FM Synths">
                                        <option value="fmBell" ${
                                          track.type === "fmBell"
                                            ? "selected"
                                            : ""
                                        }>FM Bell</option>
                                        <option value="fmBass" ${
                                          track.type === "fmBass"
                                            ? "selected"
                                            : ""
                                        }>FM Bass</option>
                                        <option value="fmBrass" ${
                                          track.type === "fmBrass"
                                            ? "selected"
                                            : ""
                                        }>FM Brass</option>
                                        <option value="fmWobble" ${
                                          track.type === "fmWobble"
                                            ? "selected"
                                            : ""
                                        }>FM Wobble</option>
                                    </optgroup>
                                    <optgroup label="Effects">
                                        <option value="lpSweep" ${
                                          track.type === "lpSweep"
                                            ? "selected"
                                            : ""
                                        }>LP Sweep</option>
                                        <option value="hpStab" ${
                                          track.type === "hpStab"
                                            ? "selected"
                                            : ""
                                        }>HP Stab</option>
                                        <option value="resonantSweep" ${
                                          track.type === "resonantSweep"
                                            ? "selected"
                                            : ""
                                        }>Resonant Sweep</option>
                                        <option value="bitcrush" ${
                                          track.type === "bitcrush"
                                            ? "selected"
                                            : ""
                                        }>Bitcrush</option>
                                    </optgroup>
                                    <optgroup label="Atmospheric">
                                        <option value="padWash" ${
                                          track.type === "padWash"
                                            ? "selected"
                                            : ""
                                        }>Pad Wash</option>
                                        <option value="crystalBell" ${
                                          track.type === "crystalBell"
                                            ? "selected"
                                            : ""
                                        }>Crystal Bell</option>
                                        <option value="windSweep" ${
                                          track.type === "windSweep"
                                            ? "selected"
                                            : ""
                                        }>Wind Sweep</option>
                                        <option value="digitalRain" ${
                                          track.type === "digitalRain"
                                            ? "selected"
                                            : ""
                                        }>Digital Rain</option>
                                    </optgroup>
                                </select>
                            </label>
                            <div class="volume-control">
                                <label>Vol: </label>
                                <input type="range" class="volume-slider" data-track="${trackIndex}" 
                                       min="0" max="1" step="0.1" value="${
                                         track.volume
                                       }">
                                <span class="volume-display">${Math.round(
                                  track.volume * 100
                                )}%</span>
                            </div>
                            <button class="mute-btn" data-track="${trackIndex}">
                                ${track.muted ? "🔇" : "🔊"}
                            </button>
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
                                  stepIndex === 0 || stepIndex % 4 === 0
                                    ? `<div class="step-counter">${
                                        stepIndex + 1
                                      }</div>`
                                    : ""
                                }
                                ${track.sequence[stepIndex] || ""}
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                `;

    tracksContainer.appendChild(trackDiv);
  });
}

function updateStepDisplay() {
  document.querySelectorAll(".step").forEach((step) => {
    step.classList.remove("playing");
  });

  if (isPlaying) {
    document
      .querySelectorAll(`[data-step="${currentStep}"]`)
      .forEach((step) => {
        step.classList.add("playing");
      });
  }

  document.getElementById("currentStep").textContent = currentStep + 1;
}

function playStep(time) {
  tracks.forEach((track, trackIndex) => {
    if (track.muted) return;

    const note = track.sequence[currentStep];
    if (note && note !== "REST") {
      // Check if it's a noise synth (percussion)
      if (synths[trackIndex] instanceof Tone.NoiseSynth) {
        synths[trackIndex].triggerAttackRelease("8n", time);
      } else {
        synths[trackIndex].triggerAttackRelease(note, "8n", time);
      }
    }
  });

  updateStepDisplay();
  currentStep = (currentStep + 1) % 32;
}

// Event Listeners
document.getElementById("initBtn").addEventListener("click", async () => {
  await Tone.start();
  initializeAudio();
  createTrackUI();
  setupEventListeners();
  document.getElementById("initBtn").disabled = true;
  document.getElementById("playBtn").disabled = false;
  document.getElementById("recordBtn").disabled = false;
});

document.getElementById("playBtn").addEventListener("click", () => {
  if (!isPlaying && audioInitialized) {
    isPlaying = true;
    Tone.Transport.bpm.value = tempo;

    mainLoop = Tone.Transport.scheduleRepeat((time) => {
      playStep(time);
    }, stepResolution);

    Tone.Transport.start();
    document.getElementById("playBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;
  }
});

document.getElementById("stopBtn").addEventListener("click", () => {
  isPlaying = false;
  currentStep = 0;
  Tone.Transport.stop();
  Tone.Transport.cancel();
  updateStepDisplay();
  document.getElementById("playBtn").disabled = false;
  document.getElementById("stopBtn").disabled = true;
});

// Record MP3
document.getElementById("recordBtn").addEventListener("click", async () => {
  document.getElementById("recordBtn").disabled = true;

  recorder.start();

  // Play the song once for recording
  let stepsRecorded = 0;
  recordLoop = Tone.Transport.scheduleRepeat((time) => {
    playStep(time);
    stepsRecorded++;
    if (stepsRecorded >= 32) {
      Tone.Transport.stop();
      Tone.Transport.clear(recordLoop);
      Tone.Transport.cancel();
      finalizeRecording();
    }
  }, stepResolution);

  Tone.Transport.start();
});

async function finalizeRecording() {
  const recording = await recorder.stop();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(await recording.arrayBuffer());

  const samples = decoded.getChannelData(0); // mono for now

  const intSamples = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    intSamples[i] = Math.max(-1, Math.min(1, samples[i])) * 32767;
  }

  const mp3encoder = new lamejs.Mp3Encoder(1, decoded.sampleRate, 128);
  const mp3Data = [];

  const blockSize = 1152;
  for (let i = 0; i < intSamples.length; i += blockSize) {
    const chunk = intSamples.subarray(i, i + blockSize);
    const mp3buf = mp3encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);

  const blob = new Blob(mp3Data, { type: "audio/mp3" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "chiptune.mp3";
  a.click();

  document.getElementById("recordBtn").disabled = false;
}

document.getElementById("clearBtn").addEventListener("click", () => {
  tracks.forEach((track) => {
    track.sequence = Array(32).fill(null);
  });
  createTrackUI();
  setupEventListeners();
});

document.getElementById("tempoSlider").addEventListener("input", (e) => {
  tempo = parseInt(e.target.value);
  document.getElementById("tempoDisplay").textContent = tempo + " BPM";
  if (audioInitialized) {
    Tone.Transport.bpm.value = tempo;
  }
});

// Note selection
document.querySelectorAll(".note-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".note-btn")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedNote = btn.dataset.note;
  });
});

document.getElementById("octaveSelect").addEventListener("change", (e) => {
  selectedOctave = parseInt(e.target.value);
});

// Save/Load functionality
document.getElementById("saveBtn").addEventListener("click", () => {
  const songData = {
    tracks: tracks,
    tempo: tempo,
  };
  document.getElementById("songData").value = JSON.stringify(songData, null, 2);
});

document.getElementById("loadBtn").addEventListener("click", () => {
  try {
    const songData = JSON.parse(document.getElementById("songData").value);
    if (songData.tracks && songData.tempo) {
      tracks.splice(0, tracks.length, ...songData.tracks);
      tempo = songData.tempo;
      document.getElementById("tempoSlider").value = tempo;
      document.getElementById("tempoDisplay").textContent = tempo + " BPM";
      createTrackUI();
      setupEventListeners();
      if (audioInitialized) {
        Tone.Transport.bpm.value = tempo;
      }
    }
  } catch (e) {
    alert("Invalid song data format");
  }
});

function setupEventListeners() {
  // Step clicking
  document.querySelectorAll(".step").forEach((step) => {
    step.addEventListener("click", () => {
      const trackIndex = parseInt(step.dataset.track);
      const stepIndex = parseInt(step.dataset.step);

      const noteToAdd =
        selectedNote === "REST" ? "REST" : selectedNote + selectedOctave;

      if (tracks[trackIndex].sequence[stepIndex] === noteToAdd) {
        // Remove note if clicking the same note
        tracks[trackIndex].sequence[stepIndex] = null;
        step.textContent = "";
        step.classList.remove("active");
      } else {
        // Add note
        tracks[trackIndex].sequence[stepIndex] = noteToAdd;
        step.textContent = selectedNote === "REST" ? "·" : selectedNote;
        step.classList.add("active");
      }
    });
  });

  // Wave type changes
  document.querySelectorAll(".wave-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const trackIndex = parseInt(e.target.dataset.track);
      tracks[trackIndex].type = e.target.value;

      if (audioInitialized) {
        // Dispose old synth and create new one
        synths[trackIndex].dispose();
        synths[trackIndex] = createSynth(e.target.value);
        synths[trackIndex].volume.value = Tone.gainToDb(
          tracks[trackIndex].volume
        );
      }
    });
  });

  // Volume controls
  document.querySelectorAll(".volume-slider").forEach((slider) => {
    slider.addEventListener("input", (e) => {
      const trackIndex = parseInt(e.target.dataset.track);
      const volume = parseFloat(e.target.value);
      tracks[trackIndex].volume = volume;

      e.target.nextElementSibling.textContent = Math.round(volume * 100) + "%";

      if (audioInitialized) {
        synths[trackIndex].volume.value = Tone.gainToDb(volume);
      }
    });
  });

  // Mute buttons
  document.querySelectorAll(".mute-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const trackIndex = parseInt(e.target.dataset.track);
      tracks[trackIndex].muted = !tracks[trackIndex].muted;
      e.target.textContent = tracks[trackIndex].muted ? "🔇" : "🔊";

      if (tracks[trackIndex].muted) {
        e.target.classList.add("track-mute");
      } else {
        e.target.classList.remove("track-mute");
      }
    });
  });

  // Clear track buttons
  document.querySelectorAll(".clear-track-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const trackIndex = parseInt(e.target.dataset.track);
      tracks[trackIndex].sequence = Array(32).fill(null);

      // Update UI
      document
        .querySelectorAll(`[data-track="${trackIndex}"].step`)
        .forEach((step) => {
          step.textContent = step.querySelector(".step-counter")
            ? step.querySelector(".step-counter").outerHTML
            : "";
          step.classList.remove("active");
        });
    });
  });
}

// Initialize UI
createTrackUI();

// Select first note by default
document.querySelector('.note-btn[data-note="C"]').classList.add("selected");

// Step resolution selector event
document.getElementById("resolutionSelect").addEventListener("change", (e) => {
  stepResolution = e.target.value;
});
