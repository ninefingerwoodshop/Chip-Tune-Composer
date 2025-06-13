/**
 * SwingUI - User interface for swing/groove controls
 */
class SwingUI {
  constructor(sequencer, containerSelector) {
    this.sequencer = sequencer;
    this.container = document.querySelector(containerSelector);
    this.isExpanded = false;

    if (this.container) {
      this.setupUI();
      this.setupEventListeners();
    }
  }

  setupUI() {
    this.container.innerHTML = `
      <div class="swing-section">
        <div class="swing-header" id="swingHeader">
          <h3>🎵 Groove & Feel</h3>
          <span class="expand-icon">${this.isExpanded ? "▼" : "▶"}</span>
        </div>
        
        <div class="swing-content" style="display: ${
          this.isExpanded ? "block" : "none"
        }">
          <div class="groove-presets">
            <label>Groove Presets:</label>
            <div class="groove-buttons">
              ${this.sequencer
                .getAvailableGrooves()
                .map(
                  (groove) => `
                <button class="groove-btn" data-groove="${
                  groove.name
                }" title="${groove.description}">
                  ${this.formatGrooveName(groove.name)}
                </button>
              `
                )
                .join("")}
            </div>
          </div>
          
          <div class="swing-controls">
            <div class="control-row">
              <div class="control-group">
                <label for="swingAmount">Swing Amount:</label>
                <input type="range" id="swingAmount" min="0" max="100" value="0" step="1">
                <span class="value-display" id="swingValue">0%</span>
              </div>
              
              <div class="control-group">
                <label for="humanizeAmount">Humanize:</label>
                <input type="range" id="humanizeAmount" min="0" max="100" value="0" step="1">
                <span class="value-display" id="humanizeValue">0%</span>
              </div>
            </div>
            
            <div class="control-row">
              <div class="control-group">
                <label for="velocityVariation">Velocity Variation:</label>
                <input type="range" id="velocityVariation" min="0" max="100" value="0" step="1">
                <span class="value-display" id="velocityValue">0%</span>
              </div>
              
              <div class="control-group">
                <button id="randomAccentBtn" class="accent-btn">🎲 Random Accents</button>
                <button id="clearAccentBtn" class="accent-btn">🗑️ Clear Accents</button>
              </div>
            </div>
          </div>
          
          <div class="accent-pattern">
            <label>Accent Pattern:</label>
            <div class="accent-steps" id="accentSteps">
              ${Array(8)
                .fill(0)
                .map(
                  (_, i) => `
                <div class="accent-step">
                  <input type="range" class="accent-slider" data-step="${i}" 
                         min="0.1" max="1.0" value="1.0" step="0.1">
                  <div class="step-label">${i + 1}</div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          
          <div class="groove-info">
            <div class="current-groove">
              Current: <span id="currentGrooveDisplay">None</span>
            </div>
            <div class="groove-actions">
              <button id="saveGrooveBtn" class="action-btn">💾 Save Custom</button>
              <button id="resetGrooveBtn" class="action-btn">🔄 Reset</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
    this.updateUI();
  }

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .swing-section {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        padding: 15px;
        margin: 15px 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .swing-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }

      .swing-header h3 {
        margin: 0;
        color: #4fc3f7;
        font-size: 1.3em;
      }

      .expand-icon {
        color: #4fc3f7;
        font-size: 1.2em;
        transition: transform 0.3s ease;
      }

      .swing-content {
        margin-top: 15px;
      }

      .groove-presets {
        margin-bottom: 20px;
      }

      .groove-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;
      }

      .groove-btn {
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 0.85em;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
      }

      .groove-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4);
      }

      .groove-btn.active {
        background: linear-gradient(45deg, #4fc3f7, #29b6f6);
        box-shadow: 0 0 15px rgba(79, 195, 247, 0.5);
      }

      .swing-controls {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 15px;
      }

      .control-row {
        display: flex;
        gap: 20px;
        margin-bottom: 15px;
        flex-wrap: wrap;
      }

      .control-row:last-child {
        margin-bottom: 0;
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 150px;
        flex: 1;
      }

      .control-group label {
        color: #ffffff;
        font-size: 0.9em;
        font-weight: bold;
      }

      .control-group input[type="range"] {
        background: rgba(255, 255, 255, 0.1);
        height: 6px;
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
      }

      .control-group input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #4fc3f7;
        border-radius: 50%;
        cursor: pointer;
      }

      .value-display {
        color: #feca57;
        font-weight: bold;
        font-size: 0.9em;
        text-align: center;
      }

      .accent-btn, .action-btn {
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 0.85em;
        cursor: pointer;
        transition: all 0.3s ease;
        margin: 2px;
      }

      .accent-btn:hover, .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4);
      }

      .accent-pattern {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 15px;
      }

      .accent-pattern label {
        color: #ffffff;
        font-weight: bold;
        margin-bottom: 10px;
        display: block;
      }

      .accent-steps {
        display: flex;
        gap: 8px;
        justify-content: space-between;
      }

      .accent-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }

      .accent-slider {
        width: 60px;
        background: rgba(255, 255, 255, 0.1);
        height: 4px;
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
        writing-mode: bt-lr; /* IE */
        -webkit-appearance: slider-vertical; /* WebKit */
        transform: rotate(90deg);
        transform-origin: center;
      }

      .step-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8em;
        margin-top: 20px;
      }

      .groove-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        padding: 10px 15px;
      }

      .current-groove {
        color: #ffffff;
        font-weight: bold;
      }

      .current-groove span {
        color: #4fc3f7;
      }

      .groove-actions {
        display: flex;
        gap: 8px;
      }

      @media (max-width: 768px) {
        .control-row {
          flex-direction: column;
          gap: 10px;
        }
        
        .groove-info {
          flex-direction: column;
          gap: 10px;
          text-align: center;
        }
        
        .accent-steps {
          flex-wrap: wrap;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Header click to toggle expansion
    const header = document.getElementById("swingHeader");
    if (header) {
      header.addEventListener("click", () => {
        this.toggleExpanded();
      });
    }

    // Groove preset buttons
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("groove-btn")) {
        const grooveType = e.target.dataset.groove;
        this.applyGroove(grooveType);
      }
    });

    // Swing amount slider
    const swingSlider = document.getElementById("swingAmount");
    if (swingSlider) {
      swingSlider.addEventListener("input", (e) => {
        const value = parseInt(e.target.value);
        this.sequencer.setSwingAmount(value);
        document.getElementById("swingValue").textContent = `${value}%`;
        this.updateCurrentGrooveDisplay();
      });
    }

    // Humanize slider
    const humanizeSlider = document.getElementById("humanizeAmount");
    if (humanizeSlider) {
      humanizeSlider.addEventListener("input", (e) => {
        const value = parseInt(e.target.value);
        this.sequencer.setHumanizeAmount(value);
        document.getElementById("humanizeValue").textContent = `${value}%`;
      });
    }

    // Velocity variation slider
    const velocitySlider = document.getElementById("velocityVariation");
    if (velocitySlider) {
      velocitySlider.addEventListener("input", (e) => {
        const value = parseInt(e.target.value);
        this.sequencer.setVelocityVariation(value);
        document.getElementById("velocityValue").textContent = `${value}%`;
      });
    }

    // Accent pattern sliders
    document.querySelectorAll(".accent-slider").forEach((slider) => {
      slider.addEventListener("input", (e) => {
        this.updateAccentPattern();
      });
    });

    // Random accents button
    const randomBtn = document.getElementById("randomAccentBtn");
    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        const pattern = this.sequencer.generateRandomAccentPattern(8, 0.4);
        this.updateAccentSliders(pattern);
      });
    }

    // Clear accents button
    const clearBtn = document.getElementById("clearAccentBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const pattern = Array(8).fill(1.0);
        this.sequencer.setAccentPattern(pattern);
        this.updateAccentSliders(pattern);
      });
    }

    // Reset groove button
    const resetBtn = document.getElementById("resetGrooveBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.sequencer.setGroove("none");
        this.updateUI();
      });
    }

    // Save custom groove button
    const saveBtn = document.getElementById("saveGrooveBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        this.saveCustomGroove();
      });
    }
  }

  applyGroove(grooveType) {
    this.sequencer.setGroove(grooveType);
    this.updateUI();

    // Update active button
    document.querySelectorAll(".groove-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`[data-groove="${grooveType}"]`)
      .classList.add("active");
  }

  updateAccentPattern() {
    const pattern = [];
    document.querySelectorAll(".accent-slider").forEach((slider) => {
      pattern.push(parseFloat(slider.value));
    });
    this.sequencer.setAccentPattern(pattern);
  }

  updateAccentSliders(pattern) {
    document.querySelectorAll(".accent-slider").forEach((slider, index) => {
      if (pattern[index] !== undefined) {
        slider.value = pattern[index];
      }
    });
  }

  updateUI() {
    const grooveInfo = this.sequencer.getCurrentGrooveInfo();

    // Update sliders
    document.getElementById("swingAmount").value = grooveInfo.swingAmount;
    document.getElementById(
      "swingValue"
    ).textContent = `${grooveInfo.swingAmount}%`;

    document.getElementById("humanizeAmount").value = grooveInfo.humanizeAmount;
    document.getElementById(
      "humanizeValue"
    ).textContent = `${grooveInfo.humanizeAmount}%`;

    document.getElementById("velocityVariation").value =
      grooveInfo.velocityVariation;
    document.getElementById(
      "velocityValue"
    ).textContent = `${grooveInfo.velocityVariation}%`;

    // Update current groove display
    this.updateCurrentGrooveDisplay();

    // Update accent pattern if it exists
    if (grooveInfo.hasAccentPattern) {
      const pattern = this.sequencer.swingEngine.accentPattern;
      this.updateAccentSliders(pattern);
    }
  }

  updateCurrentGrooveDisplay() {
    const grooveInfo = this.sequencer.getCurrentGrooveInfo();
    const display = document.getElementById("currentGrooveDisplay");
    if (display) {
      display.textContent = this.formatGrooveName(grooveInfo.type);
    }
  }

  formatGrooveName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    const content = document.querySelector(".swing-content");
    const icon = document.querySelector(".expand-icon");

    if (content && icon) {
      content.style.display = this.isExpanded ? "block" : "none";
      icon.textContent = this.isExpanded ? "▼" : "▶";
    }
  }

  saveCustomGroove() {
    const name = prompt("Enter a name for this custom groove:");
    if (name && name.trim()) {
      const settings = this.sequencer.swingEngine.export();
      this.sequencer.swingEngine.createCustomGroove(name.trim(), settings);
      alert(`Custom groove "${name}" saved!`);
    }
  }
}

// Global reference for onclick handlers
let swingUI;
