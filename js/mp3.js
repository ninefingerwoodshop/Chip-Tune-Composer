// Enhanced MP3 Timeline Mixer - Adobe Premiere Style
// Audio system
let audioInitialized = false;
let isPlaying = false;
let isPaused = false;
let currentTime = 0;
let playStartTime = 0;
let timelineLength = 300; // seconds
let zoomLevel = 1;
let snapToGrid = true;
let gridSize = 1; // seconds

// Recording
const recorder = new Tone.Recorder();
const masterGain = new Tone.Gain(0.8).connect(recorder).toDestination();

// Tracks and clips
let tracks = [];
let audioClips = [];
let selectedClip = null;
let draggedClip = null;
let clipboardClip = null;
let multiSelectClips = [];

// Timeline elements
const timelineContainer = document.getElementById("timelineContainer");
const timelineRuler = document.getElementById("timelineRuler");
const tracksContainer = document.getElementById("tracks");

// Enhanced AudioClip class with Premiere-like features
class AudioClip {
  constructor(buffer, name, trackIndex) {
    this.buffer = buffer;
    this.name = name;
    this.trackIndex = trackIndex;
    this.startTime = 0;
    this.duration = buffer.duration;
    this.trimStart = 0;
    this.trimEnd = buffer.duration;
    this.volume = 0.8;
    this.fadeIn = 0;
    this.fadeOut = 0;
    this.speed = 1.0;
    this.player = null;
    this.element = null;
    this.id = Math.random().toString(36).substr(2, 9);
    this.locked = false;
    this.color = this.generateColor();

    this.createPlayer();
    this.createElement();
  }

  generateColor() {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  createPlayer() {
    this.player = new Tone.Player(this.buffer).connect(masterGain);
    this.player.volume.value = Tone.gainToDb(this.volume);
    this.player.playbackRate = this.speed;
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.className = "audio-clip";
    this.element.style.background = this.color;
    this.element.innerHTML = `
            <div class="clip-handle left"></div>
            <div class="clip-content">
                <div class="clip-name">${this.name}</div>
                <div class="clip-info">
                    <span class="clip-duration">${this.formatDuration()}</span>
                    <span class="clip-speed">${this.speed}x</span>
                </div>
                <div class="waveform"></div>
                <div class="fade-in" style="width: ${
                  (this.fadeIn / this.duration) * 100
                }%"></div>
                <div class="fade-out" style="width: ${
                  (this.fadeOut / this.duration) * 100
                }%"></div>
            </div>
            <div class="clip-handle right"></div>
        `;

    this.updatePosition();
    this.setupEvents();
    this.generateWaveform();
    this.setupContextMenu();

    const track = tracks[this.trackIndex];
    track.element.querySelector(".track-content").appendChild(this.element);
  }

  formatDuration() {
    const minutes = Math.floor(this.duration / 60);
    const seconds = (this.duration % 60).toFixed(1);
    return `${minutes}:${seconds.padStart(4, "0")}`;
  }

  updatePosition() {
    const pixelsPerSecond = 50 * zoomLevel;
    this.element.style.left = this.startTime * pixelsPerSecond + "px";
    this.element.style.width = this.duration * pixelsPerSecond + "px";

    // Update fade overlays
    const fadeInEl = this.element.querySelector(".fade-in");
    const fadeOutEl = this.element.querySelector(".fade-out");
    if (fadeInEl)
      fadeInEl.style.width = `${(this.fadeIn / this.duration) * 100}%`;
    if (fadeOutEl)
      fadeOutEl.style.width = `${(this.fadeOut / this.duration) * 100}%`;

    // Update info
    const speedEl = this.element.querySelector(".clip-speed");
    if (speedEl) speedEl.textContent = `${this.speed}x`;

    const durationEl = this.element.querySelector(".clip-duration");
    if (durationEl) durationEl.textContent = this.formatDuration();
  }

  setupEvents() {
    // Main click and drag
    this.element.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("clip-handle")) return;

      // Multi-select with Ctrl/Cmd
      if (e.ctrlKey || e.metaKey) {
        if (multiSelectClips.includes(this)) {
          multiSelectClips = multiSelectClips.filter((clip) => clip !== this);
          this.element.classList.remove("multi-selected");
        } else {
          multiSelectClips.push(this);
          this.element.classList.add("multi-selected");
        }
      } else {
        // Clear previous selections
        multiSelectClips.forEach((clip) =>
          clip.element.classList.remove("multi-selected")
        );
        multiSelectClips = [];
        document
          .querySelectorAll(".audio-clip")
          .forEach((el) => el.classList.remove("selected"));

        selectedClip = this;
        this.element.classList.add("selected");
      }

      if (this.locked) return;

      draggedClip = this;
      const rect = timelineContainer.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - this.element.offsetLeft;

      const onMouseMove = (e) => {
        const rect = timelineContainer.getBoundingClientRect();
        const pixelsPerSecond = 50 * zoomLevel;
        let newStartTime = (e.clientX - rect.left - offsetX) / pixelsPerSecond;

        if (snapToGrid) {
          newStartTime = Math.round(newStartTime / gridSize) * gridSize;
        }

        newStartTime = Math.max(
          0,
          Math.min(newStartTime, timelineLength - this.duration)
        );
        this.startTime = newStartTime;
        this.updatePosition();

        // Move multi-selected clips
        if (multiSelectClips.length > 0) {
          const deltaTime = newStartTime - this.startTime;
          multiSelectClips.forEach((clip) => {
            if (clip !== this) {
              clip.startTime += deltaTime;
              clip.updatePosition();
            }
          });
        }
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        draggedClip = null;
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);

      e.preventDefault();
    });

    // Left handle (trim start)
    const leftHandle = this.element.querySelector(".clip-handle.left");
    leftHandle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      if (this.locked) return;

      const onMouseMove = (e) => {
        const rect = timelineContainer.getBoundingClientRect();
        const pixelsPerSecond = 50 * zoomLevel;
        let newStartTime = (e.clientX - rect.left) / pixelsPerSecond;

        if (snapToGrid) {
          newStartTime = Math.round(newStartTime / gridSize) * gridSize;
        }

        const maxStart = this.startTime + this.duration - 0.1;
        newStartTime = Math.max(0, Math.min(newStartTime, maxStart));

        const timeDiff = newStartTime - this.startTime;
        this.duration -= timeDiff;
        this.trimStart += timeDiff;
        this.startTime = newStartTime;
        this.updatePosition();
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    // Right handle (trim end)
    const rightHandle = this.element.querySelector(".clip-handle.right");
    rightHandle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      if (this.locked) return;

      const onMouseMove = (e) => {
        const rect = timelineContainer.getBoundingClientRect();
        const pixelsPerSecond = 50 * zoomLevel;
        const endPosition = (e.clientX - rect.left) / pixelsPerSecond;
        let newDuration = endPosition - this.startTime;

        if (snapToGrid) {
          newDuration = Math.round(newDuration / gridSize) * gridSize;
        }

        const maxDuration = this.buffer.duration - this.trimStart;
        newDuration = Math.max(0.1, Math.min(newDuration, maxDuration));

        this.duration = newDuration;
        this.trimEnd = this.trimStart + newDuration;
        this.updatePosition();
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    // Double-click to rename
    this.element.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const nameEl = this.element.querySelector(".clip-name");
      const input = document.createElement("input");
      input.value = this.name;
      input.style.background = "transparent";
      input.style.border = "1px solid white";
      input.style.color = "white";
      input.style.fontSize = "0.8em";
      input.style.width = "100%";

      nameEl.replaceWith(input);
      input.focus();
      input.select();

      const finishEdit = () => {
        this.name = input.value || this.name;
        const newNameEl = document.createElement("div");
        newNameEl.className = "clip-name";
        newNameEl.textContent = this.name;
        input.replaceWith(newNameEl);
      };

      input.addEventListener("blur", finishEdit);
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") finishEdit();
      });
    });
  }

  setupContextMenu() {
    this.element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });
  }

  showContextMenu(x, y) {
    // Remove existing context menu
    const existingMenu = document.querySelector(".context-menu");
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: #2a2a2a;
            border: 1px solid #555;
            border-radius: 5px;
            padding: 5px 0;
            z-index: 10000;
            min-width: 150px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;

    const menuItems = [
      { label: "Cut", action: () => this.cut() },
      { label: "Copy", action: () => this.copy() },
      { label: "Delete", action: () => this.delete() },
      { label: "---", action: null },
      { label: "Split at Playhead", action: () => this.splitAtPlayhead() },
      { label: "Add Fade In", action: () => this.addFadeIn() },
      { label: "Add Fade Out", action: () => this.addFadeOut() },
      { label: "---", action: null },
      {
        label: this.locked ? "Unlock" : "Lock",
        action: () => this.toggleLock(),
      },
      { label: "Properties", action: () => this.showProperties() },
    ];

    menuItems.forEach((item) => {
      if (item.label === "---") {
        const separator = document.createElement("div");
        separator.style.cssText =
          "height: 1px; background: #555; margin: 5px 0;";
        menu.appendChild(separator);
      } else {
        const menuItem = document.createElement("div");
        menuItem.textContent = item.label;
        menuItem.style.cssText = `
                    padding: 8px 15px;
                    cursor: pointer;
                    color: white;
                    font-size: 0.9em;
                `;
        menuItem.addEventListener("mouseenter", () => {
          menuItem.style.background = "#00ff88";
          menuItem.style.color = "#000";
        });
        menuItem.addEventListener("mouseleave", () => {
          menuItem.style.background = "transparent";
          menuItem.style.color = "white";
        });
        menuItem.addEventListener("click", () => {
          item.action();
          menu.remove();
        });
        menu.appendChild(menuItem);
      }
    });

    document.body.appendChild(menu);

    // Remove menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener("click", () => menu.remove(), { once: true });
    }, 100);
  }

  cut() {
    this.copy();
    this.delete();
  }

  copy() {
    clipboardClip = {
      buffer: this.buffer,
      name: this.name + " (Copy)",
      duration: this.duration,
      trimStart: this.trimStart,
      trimEnd: this.trimEnd,
      volume: this.volume,
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut,
      speed: this.speed,
    };
  }

  delete() {
    this.dispose();
    audioClips = audioClips.filter((clip) => clip !== this);
    if (selectedClip === this) selectedClip = null;
  }

  splitAtPlayhead() {
    if (
      currentTime > this.startTime &&
      currentTime < this.startTime + this.duration
    ) {
      const splitPoint = currentTime - this.startTime;

      // Create new clip for the second part
      const newClip = new AudioClip(
        this.buffer,
        this.name + " (Split)",
        this.trackIndex
      );
      newClip.startTime = currentTime;
      newClip.duration = this.duration - splitPoint;
      newClip.trimStart = this.trimStart + splitPoint;
      newClip.trimEnd = this.trimEnd;
      newClip.volume = this.volume;
      newClip.speed = this.speed;

      // Trim this clip
      this.duration = splitPoint;
      this.trimEnd = this.trimStart + splitPoint;

      this.updatePosition();
      audioClips.push(newClip);
    }
  }

  addFadeIn() {
    this.fadeIn = Math.min(1.0, this.duration * 0.2);
    this.updatePosition();
  }

  addFadeOut() {
    this.fadeOut = Math.min(1.0, this.duration * 0.2);
    this.updatePosition();
  }

  toggleLock() {
    this.locked = !this.locked;
    this.element.style.opacity = this.locked ? "0.7" : "1";
    this.element.style.border = this.locked
      ? "2px solid #ff4444"
      : "2px solid rgba(255, 255, 255, 0.3)";
  }

  showProperties() {
    const panel = this.createPropertiesPanel();
    document.body.appendChild(panel);
  }

  createPropertiesPanel() {
    const panel = document.createElement("div");
    panel.className = "properties-panel";
    panel.style.cssText = `
            position: fixed;
            right: 20px;
            top: 20px;
            width: 300px;
            background: #2a2a2a;
            border: 1px solid #555;
            border-radius: 10px;
            padding: 20px;
            z-index: 10000;
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;

    panel.innerHTML = `
            <h3>Clip Properties</h3>
            <div class="property-group">
                <label>Name:</label>
                <input type="text" id="clipName" value="${this.name}" />
            </div>
            <div class="property-group">
                <label>Volume:</label>
                <input type="range" id="clipVolume" min="0" max="2" step="0.1" value="${
                  this.volume
                }" />
                <span id="volumeDisplay">${Math.round(
                  this.volume * 100
                )}%</span>
            </div>
            <div class="property-group">
                <label>Speed:</label>
                <input type="range" id="clipSpeed" min="0.25" max="2" step="0.25" value="${
                  this.speed
                }" />
                <span id="speedDisplay">${this.speed}x</span>
            </div>
            <div class="property-group">
                <label>Fade In:</label>
                <input type="range" id="fadeIn" min="0" max="5" step="0.1" value="${
                  this.fadeIn
                }" />
                <span id="fadeInDisplay">${this.fadeIn.toFixed(1)}s</span>
            </div>
            <div class="property-group">
                <label>Fade Out:</label>
                <input type="range" id="fadeOut" min="0" max="5" step="0.1" value="${
                  this.fadeOut
                }" />
                <span id="fadeOutDisplay">${this.fadeOut.toFixed(1)}s</span>
            </div>
            <div class="property-buttons">
                <button id="applyProps">Apply</button>
                <button id="closeProps">Close</button>
            </div>
        `;

    // Add styles for property groups
    const style = document.createElement("style");
    style.textContent = `
            .property-group {
                margin: 15px 0;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .property-group label {
                font-weight: bold;
                color: #00ff88;
            }
            .property-group input {
                background: #444;
                border: 1px solid #666;
                border-radius: 5px;
                padding: 5px;
                color: white;
            }
            .property-buttons {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            .property-buttons button {
                flex: 1;
                padding: 8px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
        `;
    document.head.appendChild(style);

    // Event listeners for real-time updates
    const updateProperty = (
      id,
      property,
      displayId = null,
      formatter = null
    ) => {
      const input = panel.querySelector(`#${id}`);
      const display = displayId ? panel.querySelector(`#${displayId}`) : null;

      input.addEventListener("input", () => {
        const value = parseFloat(input.value);
        this[property] = value;
        if (display) {
          display.textContent = formatter ? formatter(value) : value;
        }
        this.updatePosition();
        if (property === "volume" && this.player) {
          this.player.volume.value = Tone.gainToDb(value);
        }
        if (property === "speed" && this.player) {
          this.player.playbackRate = value;
        }
      });
    };

    updateProperty(
      "clipVolume",
      "volume",
      "volumeDisplay",
      (v) => Math.round(v * 100) + "%"
    );
    updateProperty("clipSpeed", "speed", "speedDisplay", (v) => v + "x");
    updateProperty(
      "fadeIn",
      "fadeIn",
      "fadeInDisplay",
      (v) => v.toFixed(1) + "s"
    );
    updateProperty(
      "fadeOut",
      "fadeOut",
      "fadeOutDisplay",
      (v) => v.toFixed(1) + "s"
    );

    panel.querySelector("#clipName").addEventListener("input", (e) => {
      this.name = e.target.value;
      this.element.querySelector(".clip-name").textContent = this.name;
    });

    panel.querySelector("#closeProps").addEventListener("click", () => {
      panel.remove();
    });

    return panel;
  }

  generateWaveform() {
    const waveformEl = this.element.querySelector(".waveform");
    const samples = 50;
    const channelData = this.buffer.getChannelData(0);
    const samplesPerBar = Math.floor(channelData.length / samples);

    for (let i = 0; i < samples; i++) {
      const start = i * samplesPerBar;
      const end = start + samplesPerBar;
      let max = 0;

      for (let j = start; j < end && j < channelData.length; j++) {
        max = Math.max(max, Math.abs(channelData[j]));
      }

      const bar = document.createElement("div");
      bar.className = "waveform-bar";
      bar.style.height = max * 100 + "%";
      waveformEl.appendChild(bar);
    }
  }

  play(time, offset = 0) {
    if (this.player && !this.player.disposed) {
      const startOffset = this.trimStart + offset;
      const duration = Math.min(
        this.duration - offset,
        this.trimEnd - startOffset
      );
      this.player.start(time, startOffset, duration);
    }
  }

  stop() {
    if (this.player && !this.player.disposed) {
      this.player.stop();
    }
  }

  dispose() {
    this.stop();
    if (this.player) {
      this.player.dispose();
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Enhanced Track class
class Track {
  constructor(name, index) {
    this.name = name;
    this.index = index;
    this.volume = 0.8;
    this.muted = false;
    this.solo = false;
    this.armed = false;
    this.element = null;
    this.color = this.generateTrackColor();

    this.createElement();
  }

  generateTrackColor() {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
    ];
    return colors[this.index % colors.length];
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.className = "track";
    this.element.style.borderLeftColor = this.color;
    this.element.innerHTML = `
            <div class="track-label">
                <div class="track-name" contenteditable="true">${
                  this.name
                }</div>
                <div class="track-controls">
                    <button class="track-btn arm-btn" title="Arm for Recording">R</button>
                    <button class="track-btn mute-btn" title="Mute">M</button>
                    <button class="track-btn solo-btn" title="Solo">S</button>
                    <button class="track-btn delete-btn" title="Delete Track">×</button>
                </div>
                <div class="track-volume">
                    <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="${
                      this.volume
                    }" orient="vertical">
                    <span class="volume-display">${Math.round(
                      this.volume * 100
                    )}%</span>
                </div>
            </div>
            <div class="track-content"></div>
        `;

    this.setupEvents();
    tracksContainer.appendChild(this.element);
  }

  setupEvents() {
    const armBtn = this.element.querySelector(".arm-btn");
    const muteBtn = this.element.querySelector(".mute-btn");
    const soloBtn = this.element.querySelector(".solo-btn");
    const deleteBtn = this.element.querySelector(".delete-btn");
    const volumeSlider = this.element.querySelector(".volume-slider");
    const volumeDisplay = this.element.querySelector(".volume-display");
    const trackName = this.element.querySelector(".track-name");

    armBtn.addEventListener("click", () => {
      this.armed = !this.armed;
      armBtn.style.background = this.armed
        ? "#ff4444"
        : "rgba(255, 255, 255, 0.2)";
    });

    muteBtn.addEventListener("click", () => {
      this.muted = !this.muted;
      muteBtn.style.background = this.muted
        ? "#ff4444"
        : "rgba(255, 255, 255, 0.2)";
      this.element.style.opacity = this.muted ? "0.5" : "1";
    });

    soloBtn.addEventListener("click", () => {
      this.solo = !this.solo;
      soloBtn.style.background = this.solo
        ? "#ffff44"
        : "rgba(255, 255, 255, 0.2)";

      if (this.solo) {
        tracks.forEach((track) => {
          if (track !== this) {
            track.muted = true;
            track.element.querySelector(".mute-btn").style.background =
              "#ff4444";
            track.element.style.opacity = "0.5";
          }
        });
      } else {
        tracks.forEach((track) => {
          track.muted = false;
          track.element.querySelector(".mute-btn").style.background =
            "rgba(255, 255, 255, 0.2)";
          track.element.style.opacity = "1";
        });
      }
    });

    deleteBtn.addEventListener("click", () => {
      if (confirm(`Delete track "${this.name}"?`)) {
        this.delete();
      }
    });

    volumeSlider.addEventListener("input", (e) => {
      this.volume = parseFloat(e.target.value);
      volumeDisplay.textContent = Math.round(this.volume * 100) + "%";
      this.updateClipVolumes();
    });

    trackName.addEventListener("blur", () => {
      this.name = trackName.textContent;
    });

    trackName.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        trackName.blur();
      }
    });
  }

  updateClipVolumes() {
    audioClips
      .filter((clip) => clip.trackIndex === this.index)
      .forEach((clip) => {
        if (clip.player) {
          clip.player.volume.value = Tone.gainToDb(this.volume * clip.volume);
        }
      });
  }

  delete() {
    // Remove all clips on this track
    audioClips
      .filter((clip) => clip.trackIndex === this.index)
      .forEach((clip) => {
        clip.dispose();
      });
    audioClips = audioClips.filter((clip) => clip.trackIndex !== this.index);

    // Remove track element
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    // Remove from tracks array
    const trackIndex = tracks.indexOf(this);
    if (trackIndex > -1) {
      tracks.splice(trackIndex, 1);
    }

    // Update remaining track indices
    tracks.forEach((track, index) => {
      track.index = index;
    });

    audioClips.forEach((clip) => {
      if (clip.trackIndex > trackIndex) {
        clip.trackIndex--;
      }
    });
  }
}

// Rest of the functions remain the same but with enhancements...
// [Previous functions for timeline, playback, etc. would continue here]

// Initialize audio system
async function initializeAudio() {
  await Tone.start();
  console.log("Audio initialized");
  setupTimeline();
  createInitialTracks();
  setupKeyboardShortcuts();

  audioInitialized = true;
  document.getElementById("initBtn").disabled = true;
  document.getElementById("playBtn").disabled = false;
  document.getElementById("recordBtn").disabled = false;
  document.getElementById("exportBtn").disabled = false;
}

function setupTimeline() {
  const pixelsPerSecond = 50 * zoomLevel;
  const markerInterval = 10; // seconds

  timelineRuler.innerHTML = `
        <div class="playhead" id="playhead"></div>
        <div class="timeline-markers"></div>
    `;

  const markersContainer = timelineRuler.querySelector(".timeline-markers");

  for (let time = 0; time <= timelineLength; time += markerInterval) {
    const marker = document.createElement("div");
    marker.className = "time-marker";
    marker.style.left = time * pixelsPerSecond + "px";
    marker.textContent = formatTime(time);
    markersContainer.appendChild(marker);
  }

  // Set timeline width
  timelineRuler.style.width = timelineLength * pixelsPerSecond + "px";

  setupPlayheadInteraction();
}

function setupPlayheadInteraction() {
  const playheadEl = document.getElementById("playhead");
  let isDraggingPlayhead = false;

  playheadEl.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isDraggingPlayhead = true;
    playheadEl.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDraggingPlayhead) return;

    const rect = timelineRuler.getBoundingClientRect();
    const pixelsPerSecond = 50 * zoomLevel;
    let newTime = (e.clientX - rect.left) / pixelsPerSecond;
    newTime = Math.max(0, Math.min(newTime, timelineLength));

    currentTime = newTime;
    updatePlayhead();
  });

  document.addEventListener("mouseup", () => {
    if (isDraggingPlayhead) {
      isDraggingPlayhead = false;
      playheadEl.style.cursor = "grab";

      if (isPlaying) {
        stopTimeline();
        playTimeline();
      }
    }
  });

  // Click on timeline to set playhead
  timelineRuler.addEventListener("click", (e) => {
    if (e.target === playheadEl) return;

    const rect = timelineRuler.getBoundingClientRect();
    const pixelsPerSecond = 50 * zoomLevel;
    const clickTime = (e.clientX - rect.left) / pixelsPerSecond;

    currentTime = Math.max(0, Math.min(clickTime, timelineLength));
    updatePlayhead();

    if (isPlaying) {
      stopTimeline();
      playTimeline();
    }
  });
}

function createInitialTracks() {
  const trackTypes = ["Audio 1", "Audio 2", "Music", "SFX"];
  for (let i = 0; i < trackTypes.length; i++) {
    tracks.push(new Track(trackTypes[i], i));
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === "INPUT" || e.target.contentEditable === "true")
      return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        if (isPlaying) {
          pauseTimeline();
        } else {
          playTimeline();
        }
        break;

      case "Home":
        e.preventDefault();
        currentTime = 0;
        updatePlayhead();
        if (isPlaying) {
          stopTimeline();
          playTimeline();
        }
        break;

      case "End":
        e.preventDefault();
        currentTime = timelineLength;
        updatePlayhead();
        break;

      case "Delete":
      case "Backspace":
        e.preventDefault();
        if (selectedClip) {
          selectedClip.delete();
        }
        if (multiSelectClips.length > 0) {
          multiSelectClips.forEach((clip) => clip.delete());
          multiSelectClips = [];
        }
        break;

      case "KeyC":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (selectedClip) selectedClip.copy();
        }
        break;

      case "KeyX":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (selectedClip) selectedClip.cut();
        }
        break;

      case "KeyV":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          pasteClip();
        }
        break;

      case "KeyA":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          selectAllClips();
        }
        break;

      case "KeyS":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (selectedClip) selectedClip.splitAtPlayhead();
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        currentTime = Math.max(0, currentTime - (e.shiftKey ? 0.1 : 1));
        updatePlayhead();
        break;

      case "ArrowRight":
        e.preventDefault();
        currentTime = Math.min(
          timelineLength,
          currentTime + (e.shiftKey ? 0.1 : 1)
        );
        updatePlayhead();
        break;

      case "KeyM":
        if (selectedClip) {
          const track = tracks[selectedClip.trackIndex];
          track.muted = !track.muted;
          track.element.querySelector(".mute-btn").click();
        }
        break;
    }
  });
}

function pasteClip() {
  if (!clipboardClip) return;

  // Find target track (first available or selected clip's track)
  let targetTrack = 0;
  if (selectedClip) {
    targetTrack = selectedClip.trackIndex;
  }

  if (targetTrack >= tracks.length) {
    tracks.push(new Track(`Track ${tracks.length + 1}`, tracks.length));
  }

  const newClip = new AudioClip(
    clipboardClip.buffer,
    clipboardClip.name,
    targetTrack
  );
  newClip.startTime = currentTime;
  newClip.duration = clipboardClip.duration;
  newClip.trimStart = clipboardClip.trimStart;
  newClip.trimEnd = clipboardClip.trimEnd;
  newClip.volume = clipboardClip.volume;
  newClip.fadeIn = clipboardClip.fadeIn;
  newClip.fadeOut = clipboardClip.fadeOut;
  newClip.speed = clipboardClip.speed;

  audioClips.push(newClip);
}

function selectAllClips() {
  multiSelectClips = [...audioClips];
  audioClips.forEach((clip) => {
    clip.element.classList.add("multi-selected");
  });
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${minutes.toString().padStart(2, "0")}:${secs.padStart(4, "0")}`;
}

function updatePlayhead() {
  const playhead = document.getElementById("playhead");
  if (!playhead) return;

  const pixelsPerSecond = 50 * zoomLevel;
  playhead.style.left = `${currentTime * pixelsPerSecond}px`;

  const timeDisplay = document.getElementById("timeDisplay");
  if (timeDisplay) timeDisplay.textContent = formatTime(currentTime);

  // Update playhead time input
  const timeInput = document.getElementById("playheadTimeInput");
  if (timeInput) timeInput.value = formatTime(currentTime);
}

async function playTimeline() {
  if (!audioInitialized) return;

  // Ensure Tone context is running
  if (Tone.context.state !== "running") {
    await Tone.start();
    console.log("Tone context started");
  }

  isPlaying = true;
  isPaused = false;
  playStartTime = Tone.now() - currentTime;

  // Start all clips that should be playing
  audioClips.forEach((clip) => {
    const track = tracks[clip.trackIndex];
    if (
      !track.muted &&
      currentTime >= clip.startTime &&
      currentTime < clip.startTime + clip.duration
    ) {
      const offset = currentTime - clip.startTime;
      console.log(`Playing clip: ${clip.name} at offset ${offset}`);
      clip.play(Tone.now(), offset);
    }
  });

  // Update playhead
  const updateInterval = setInterval(() => {
    if (!isPlaying) {
      clearInterval(updateInterval);
      return;
    }

    currentTime = Tone.now() - playStartTime;
    updatePlayhead();

    if (currentTime >= timelineLength) {
      stopTimeline();
    }
  }, 50);

  document.getElementById("playBtn").disabled = true;
  document.getElementById("pauseBtn").disabled = false;
  document.getElementById("stopBtn").disabled = false;
}

function pauseTimeline() {
  isPlaying = false;
  isPaused = true;

  audioClips.forEach((clip) => clip.stop());

  document.getElementById("playBtn").disabled = false;
  document.getElementById("pauseBtn").disabled = true;
}

function stopTimeline() {
  isPlaying = false;
  isPaused = false;
  currentTime = 0;

  audioClips.forEach((clip) => clip.stop());
  updatePlayhead();

  document.getElementById("playBtn").disabled = false;
  document.getElementById("pauseBtn").disabled = true;
  document.getElementById("stopBtn").disabled = true;
}

async function loadAudioFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);

    // Find the first available track or create a new one
    let targetTrack = 0;
    if (tracks.length === 0) {
      const newTrack = new Track("Audio 1", 0);
      tracks.push(newTrack);
    }

    const clip = new AudioClip(audioBuffer, file.name, targetTrack);
    clip.startTime = currentTime; // Place at playhead position
    audioClips.push(clip);

    console.log(`Loaded: ${file.name} (${clip.duration.toFixed(2)}s)`);
  } catch (error) {
    console.error("Error loading audio file:", error);
    alert(`Error loading ${file.name}: ${error.message}`);
  }
}

// Event Listeners
document.getElementById("initBtn").addEventListener("click", initializeAudio);
document.getElementById("playBtn").addEventListener("click", playTimeline);
document.getElementById("pauseBtn").addEventListener("click", pauseTimeline);
document.getElementById("stopBtn").addEventListener("click", stopTimeline);

document.getElementById("addTrackBtn").addEventListener("click", () => {
  const trackIndex = tracks.length;
  tracks.push(new Track(`Track ${trackIndex + 1}`, trackIndex));
});

document.getElementById("zoomSlider").addEventListener("input", (e) => {
  zoomLevel = parseFloat(e.target.value);
  document.getElementById("zoomDisplay").textContent =
    Math.round(zoomLevel * 100) + "%";
  setupTimeline();
  audioClips.forEach((clip) => clip.updatePosition());
});

document.getElementById("snapToGrid").addEventListener("change", (e) => {
  snapToGrid = e.target.checked;
});

document.getElementById("masterVolume").addEventListener("input", (e) => {
  const volume = parseFloat(e.target.value);
  masterGain.gain.value = volume;
  document.getElementById("masterVolumeDisplay").textContent =
    Math.round(volume * 100) + "%";
});

// File handling
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

fileInput.addEventListener("change", (e) => {
  Array.from(e.target.files).forEach((file) => {
    if (file.type.startsWith("audio/")) {
      loadAudioFile(file);
    }
  });
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  Array.from(e.dataTransfer.files).forEach((file) => {
    if (file.type.startsWith("audio/")) {
      loadAudioFile(file);
    }
  });
});

// Recording and Export functionality
document.getElementById("recordBtn").addEventListener("click", async () => {
  if (!audioInitialized) return;

  document.getElementById("recordBtn").disabled = true;
  recorder.start();

  currentTime = 0;
  playTimeline();

  const checkFinished = setInterval(() => {
    if (!isPlaying || currentTime >= timelineLength) {
      clearInterval(checkFinished);
      finalizeRecording();
    }
  }, 100);
});

async function finalizeRecording() {
  try {
    const recording = await recorder.stop();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(
      await recording.arrayBuffer()
    );

    // Convert to MP3
    const samples = decoded.getChannelData(0);
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
    a.download = "premiere_mix.mp3";
    a.click();

    document.getElementById("recordBtn").disabled = false;
    alert("Recording exported successfully!");
  } catch (error) {
    console.error("Recording error:", error);
    alert("Error during recording: " + error.message);
    document.getElementById("recordBtn").disabled = false;
  }
}

document.getElementById("exportBtn").addEventListener("click", async () => {
  if (!audioInitialized) return;

  try {
    const offlineCtx = new OfflineAudioContext(
      2,
      44100 * timelineLength,
      44100
    );
    const offlineMasterGain = offlineCtx.createGain();
    offlineMasterGain.gain.value = masterGain.gain.value;
    offlineMasterGain.connect(offlineCtx.destination);

    const promises = audioClips.map(async (clip) => {
      const track = tracks[clip.trackIndex];
      if (track.muted) return;

      const source = offlineCtx.createBufferSource();
      source.buffer = clip.buffer;

      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = track.volume * clip.volume;

      source.connect(gainNode);
      gainNode.connect(offlineMasterGain);

      source.start(clip.startTime, clip.trimStart, clip.duration);
    });

    await Promise.all(promises);

    const rendered = await offlineCtx.startRendering();

    // Convert to MP3
    const samples = rendered.getChannelData(0);
    const intSamples = new Int16Array(samples.length);

    for (let i = 0; i < samples.length; i++) {
      intSamples[i] = Math.max(-1, Math.min(1, samples[i])) * 32767;
    }

    const mp3encoder = new lamejs.Mp3Encoder(1, rendered.sampleRate, 128);
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
    a.download = "premiere_export.mp3";
    a.click();

    alert("Mix exported successfully!");
  } catch (error) {
    console.error("Export error:", error);
    alert("Error during export: " + error.message);
  }
});

// Playhead time input
document.getElementById("playheadTimeInput").addEventListener("change", (e) => {
  const timeString = e.target.value;
  const parts = timeString.split(":");
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    const totalSeconds = minutes * 60 + seconds;

    if (totalSeconds >= 0 && totalSeconds <= timelineLength) {
      currentTime = totalSeconds;
      updatePlayhead();
    }
  }
});

// Initialize empty timeline
setupTimeline();
