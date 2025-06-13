// main.js

// Global variables
let audioEngine;
let sequencer;
let patternChain;
let patternChainUI;
let swingUIInstance;

// Initialize everything when DOM and all scripts are ready
function initializeApp() {
  // Create core instances
  audioEngine = new AudioEngine();
  sequencer = new Sequencer(audioEngine);
  patternChain = new PatternChain(sequencer);
  patternChainUI = new PatternChainUI(patternChain, "#patternChainUI");
  swingUIInstance = new SwingUI(sequencer, "#swingUI");

  // Expose globally for other components
  window.audioEngine = audioEngine;
  window.sequencer = sequencer;
  window.patternChain = patternChain;
  window.patternChainUI = patternChainUI;
  window.swingUI = swingUIInstance;
  window.createTrackUI = createTrackUI;

  // Initialize UI
  createTrackUI();
  setupEventListeners();

  // Select default note
  const defaultNoteBtn = document.querySelector('.note-btn[data-note="C"]');
  if (defaultNoteBtn) defaultNoteBtn.classList.add("selected");

  // Step resolution dropdown
  const resolutionSelect = document.getElementById("resolutionSelect");
  if (resolutionSelect) {
    resolutionSelect.addEventListener("change", (e) => {
      sequencer.setStepResolution(e.target.value);
    });
  }

  console.log("App initialized successfully!");
}

// Wait for all scripts to load
function waitForDependencies() {
  return new Promise((resolve) => {
    const checkDependencies = () => {
      if (
        typeof AudioEngine !== "undefined" &&
        typeof Sequencer !== "undefined" &&
        typeof PatternChain !== "undefined" &&
        typeof PatternChainUI !== "undefined" &&
        typeof Track !== "undefined" &&
        typeof SwingEngine !== "undefined" &&
        typeof SwingUI !== "undefined" &&
        typeof createTrackUI === "function" &&
        typeof setupEventListeners === "function"
      ) {
        resolve();
      } else {
        setTimeout(checkDependencies, 50);
      }
    };
    checkDependencies();
  });
}

// Initialize when everything is ready
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await waitForDependencies();
    initializeApp();
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
});
