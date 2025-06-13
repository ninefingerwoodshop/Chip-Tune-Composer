/**
 * PatternChainUI - UI components and integration for PatternChain
 * Handles the pattern management interface and integrates with the main sequencer
 */
class PatternChainUI {
  constructor(patternChain, containerSelector) {
    this.patternChain = patternChain;
    this.container = document.querySelector(containerSelector);

    window.addEventListener("DOMContentLoaded", () => {
      if (!this.container) return;
      this.setupUI();
      setTimeout(() => {
        this.setupEventListeners();
      }, 0);
    });

    // Bind pattern chain callbacks
    this.patternChain.onPatternChange = (pattern, index) => {
      this.updatePatternDisplay();
      this.updateCurrentPatternIndicator();
    };

    this.patternChain.onStepChange = (step, length) => {
      this.updateStepCounter(step, length);
    };
  }

  setupUI() {
    if (!this.container) {
      console.warn("PatternChainUI: container not found for selector.");
      return;
    }

    this.container.innerHTML = `
            <div class="pattern-chain-section">
                <div class="pattern-chain-header">
                    <h3>🎼 Pattern Chain</h3>
                    <div class="pattern-chain-controls">
                        <button id="addPatternBtn" class="pattern-btn">➕ Add Pattern</button>
                        <button id="duplicatePatternBtn" class="pattern-btn">📋 Duplicate</button>
                        <button id="savePatternBtn" class="pattern-btn">💾 Save Current</button>
                        <label class="loop-control">
                            <input type="checkbox" id="loopChainBtn" ${
                              this.patternChain.loop ? "checked" : ""
                            }>
                            🔁 Loop Chain
                        </label>
                    </div>
                </div>
                
                <div class="pattern-chain-info">
                    <div class="chain-stats">
                        <span>Total Patterns: <span id="totalPatterns">0</span></span>
                        <span>Total Length: <span id="totalLength">0</span> steps</span>
                        <span>Current: <span id="currentPatternName">-</span></span>
                    </div>
                </div>
                
                <div class="pattern-list" id="patternList">
                    <!-- Pattern items will be dynamically generated -->
                </div>
                
                <div class="pattern-navigation">
                    <button id="prevPatternBtn" class="nav-btn">⬅️ Previous</button>
                    <span class="pattern-position">
                        Pattern <span id="currentPatternIndex">1</span> of <span id="totalPatternsNav">1</span>
                    </span>
                    <button id="nextPatternBtn" class="nav-btn">➡️ Next</button>
                </div>
            </div>
        `;

    this.addStyles();
    this.updatePatternDisplay();
  }

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
            .pattern-chain-section {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .pattern-chain-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 10px;
            }

            .pattern-chain-header h3 {
                margin: 0;
                color: #4fc3f7;
                font-size: 1.5em;
            }

            .pattern-chain-controls {
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
            }

            .pattern-btn, .nav-btn {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 15px;
                font-size: 0.9em;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: inherit;
            }

            .pattern-btn:hover, .nav-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }

            .pattern-btn:disabled, .nav-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .loop-control {
                display: flex;
                align-items: center;
                gap: 5px;
                color: white;
                cursor: pointer;
            }

            .loop-control input[type="checkbox"] {
                margin: 0;
            }

            .pattern-chain-info {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                padding: 10px;
                margin-bottom: 15px;
            }

            .chain-stats {
                display: flex;
                gap: 20px;
                font-size: 0.9em;
                flex-wrap: wrap;
            }

            .chain-stats span {
                color: #ffffff;
            }

            .pattern-list {
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                margin-bottom: 15px;
            }

            .pattern-item {
                display: flex;
                align-items: center;
                padding: 10px 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                cursor: pointer;
                transition: background-color 0.2s ease;
                position: relative;
            }

            .pattern-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .pattern-item.current {
                background: linear-gradient(45deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
                border-left: 4px solid #4fc3f7;
            }

            .pattern-item.disabled {
                opacity: 0.5;
            }

            .pattern-info {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .pattern-name {
                font-weight: bold;
                color: white;
                font-size: 1em;
            }

            .pattern-details {
                font-size: 0.8em;
                color: rgba(255, 255, 255, 0.7);
            }

            .pattern-controls {
                display: flex;
                gap: 5px;
                align-items: center;
            }

            .pattern-control-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 0.8em;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .pattern-control-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .pattern-control-btn.delete-pattern {
                background: rgba(255, 107, 107, 0.6);
            }

            .pattern-control-btn.delete-pattern:hover {
                background: rgba(255, 107, 107, 0.8);
            }

            .pattern-length-input {
                width: 50px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 5px;
                padding: 2px 5px;
                font-size: 0.8em;
            }

            .pattern-navigation {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
            }

            .pattern-position {
                color: #feca57;
                font-weight: bold;
            }

            .pattern-name-input {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 5px;
                padding: 2px 8px;
                font-size: 0.9em;
                width: 120px;
            }

            .has-notes-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4fc3f7;
                margin-left: 5px;
            }

            .no-notes-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                margin-left: 5px;
            }
        `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Add pattern button
    document.getElementById("addPatternBtn").addEventListener("click", () => {
      this.patternChain.saveCurrentTracksToPattern();
      const newPattern = this.patternChain.addPattern();
      this.updatePatternDisplay();
    });

    // Duplicate pattern button
    document
      .getElementById("duplicatePatternBtn")
      .addEventListener("click", () => {
        const currentPattern = this.patternChain.getCurrentPattern();
        if (currentPattern) {
          this.patternChain.duplicatePattern(currentPattern.id);
          this.updatePatternDisplay();
        }
      });

    // Save current pattern button
    document.getElementById("savePatternBtn").addEventListener("click", () => {
      this.patternChain.saveCurrentTracksToPattern();
      this.updatePatternDisplay();
    });

    // Loop chain checkbox
    document.getElementById("loopChainBtn").addEventListener("change", (e) => {
      this.patternChain.loop = e.target.checked;
    });

    // Navigation buttons
    document.getElementById("prevPatternBtn").addEventListener("click", () => {
      this.patternChain.saveCurrentTracksToPattern();
      this.patternChain.previousPattern();
      this.triggerTrackUIUpdate();
    });

    document.getElementById("nextPatternBtn").addEventListener("click", () => {
      this.patternChain.saveCurrentTracksToPattern();
      this.patternChain.nextPattern();
      this.triggerTrackUIUpdate();
    });

    // Pattern control buttons with event delegation
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("toggle-pattern")) {
        const patternId = e.target.dataset.patternId;
        this.togglePattern(patternId);
      } else if (e.target.classList.contains("select-pattern")) {
        const patternId = e.target.dataset.patternId;
        this.selectPattern(patternId);
      } else if (e.target.classList.contains("delete-pattern")) {
        const patternId = e.target.dataset.patternId;
        this.deletePattern(patternId);
      }
    });
  }

  updatePatternDisplay() {
    const patternList = document.getElementById("patternList");
    const patterns = this.patternChain.getPatternSummary();

    patternList.innerHTML = patterns
      .map(
        (pattern) => `
            <div class="pattern-item ${pattern.isCurrent ? "current" : ""} ${
          !pattern.enabled ? "disabled" : ""
        }" 
                 data-pattern-id="${pattern.id}">
                <div class="pattern-info">
                    <div class="pattern-name">
                        <input type="text" class="pattern-name-input" value="${
                          pattern.name
                        }" 
                               data-pattern-id="${pattern.id}">
                        <div class="${
                          pattern.hasNotes
                            ? "has-notes-indicator"
                            : "no-notes-indicator"
                        }"></div>
                    </div>
                    <div class="pattern-details">
                        Length: <input type="number" class="pattern-length-input" 
                                     value="${pattern.length}" min="1" max="64" 
                                     data-pattern-id="${pattern.id}"> steps
                    </div>
                </div>
                <div class="pattern-controls">
                    <button class="pattern-control-btn toggle-pattern" data-pattern-id="${
                      pattern.id
                    }">
                        ${pattern.enabled ? "🔊" : "🔇"}
                    </button>
                    <button class="pattern-control-btn select-pattern" data-pattern-id="${
                      pattern.id
                    }">
                        Select
                    </button>
                    <button class="pattern-control-btn delete-pattern" data-pattern-id="${
                      pattern.id
                    }">
                        🗑️
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    // Setup input event listeners
    this.setupPatternInputListeners();
    this.updateStatistics();
    this.updateCurrentPatternIndicator();
  }

  setupPatternInputListeners() {
    // Pattern name inputs
    document.querySelectorAll(".pattern-name-input").forEach((input) => {
      input.addEventListener("blur", (e) => {
        const patternId = e.target.dataset.patternId;
        const pattern = this.patternChain.patterns.find(
          (p) => p.id == patternId
        );
        if (pattern) {
          pattern.name = e.target.value || "Untitled";
          this.updateStatistics();
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      });
    });

    // Pattern length inputs
    document.querySelectorAll(".pattern-length-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const patternId = e.target.dataset.patternId;
        const length = parseInt(e.target.value);
        this.patternChain.setPatternLength(patternId, length);
        this.updateStatistics();
      });
    });
  }

  selectPattern(patternId) {
    this.patternChain.saveCurrentTracksToPattern();
    this.patternChain.switchToPattern(patternId);
    this.triggerTrackUIUpdate();
  }

  togglePattern(patternId) {
    this.patternChain.togglePatternEnabled(patternId);
    this.updatePatternDisplay();
  }

  deletePattern(patternId) {
    if (this.patternChain.patterns.length <= 1) {
      alert("Cannot delete the last pattern");
      return;
    }

    if (confirm("Are you sure you want to delete this pattern?")) {
      this.patternChain.removePattern(patternId);
      this.triggerTrackUIUpdate();
      this.updatePatternDisplay();
    }
  }

  updateStatistics() {
    document.getElementById("totalPatterns").textContent =
      this.patternChain.patterns.length;
    document.getElementById("totalLength").textContent =
      this.patternChain.getTotalLength();

    const currentPattern = this.patternChain.getCurrentPattern();
    document.getElementById("currentPatternName").textContent = currentPattern
      ? currentPattern.name
      : "-";
  }

  updateCurrentPatternIndicator() {
    document.getElementById("currentPatternIndex").textContent =
      this.patternChain.currentPatternIndex + 1;
    document.getElementById("totalPatternsNav").textContent =
      this.patternChain.patterns.length;
  }

  updateStepCounter(step, length) {
    // This could be used to show pattern-specific step counter
    // For now, we'll let the main step counter handle this
  }

  triggerTrackUIUpdate() {
    // This should trigger the main sequencer UI to update
    // You'll need to call createTrackUI() and setupEventListeners() from the main script
    if (window.createTrackUI && window.setupEventListeners) {
      window.createTrackUI();
      window.setupEventListeners();
    }
  }

  exportPatternChain() {
    return this.patternChain.exportData();
  }

  importPatternChain(data) {
    const success = this.patternChain.importData(data);
    if (success) {
      this.updatePatternDisplay();
      this.triggerTrackUIUpdate();
    }
    return success;
  }
}

// Integration with main playback loop
function integratePatternChainWithPlayback(patternChain, originalPlayStep) {
  return function playStepWithChain(time) {
    // Call original play step function
    originalPlayStep(time);

    // Check if we should advance to next pattern
    if (!patternChain.playStep()) {
      // Pattern finished, advance to next
      patternChain.nextPattern();

      // Trigger UI update for new pattern
      if (window.patternChainUI) {
        window.patternChainUI.triggerTrackUIUpdate();
      }
    }
  };
}
