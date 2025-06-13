/**
 * PatternChain - Manages multiple patterns for longer compositions
 */
class PatternChain {
  constructor(sequencer) {
    this.sequencer = sequencer;
    this.patterns = [];
    this.currentPatternIndex = 0;
    this.currentStep = 0;
    this.loop = true;
    this.onPatternChange = null;
    this.onStepChange = null;

    // Create default pattern from current sequencer state
    this.addPattern("Pattern 1", this.sequencer.export());
  }

  addPattern(name, sequencerData = null) {
    const pattern = {
      id: Date.now() + Math.random(),
      name: name || `Pattern ${this.patterns.length + 1}`,
      data: sequencerData || this.sequencer.export(),
      length: 32,
      enabled: true,
    };

    this.patterns.push(pattern);
    return pattern;
  }

  duplicatePattern(patternId) {
    const pattern = this.patterns.find((p) => p.id === patternId);
    if (!pattern) return null;

    const newPattern = {
      id: Date.now() + Math.random(),
      name: pattern.name + " Copy",
      data: JSON.parse(JSON.stringify(pattern.data)), // Deep copy
      length: pattern.length,
      enabled: pattern.enabled,
    };

    this.patterns.push(newPattern);
    return newPattern;
  }

  removePattern(patternId) {
    const index = this.patterns.findIndex((p) => p.id === patternId);
    if (index === -1 || this.patterns.length <= 1) return false;

    this.patterns.splice(index, 1);

    if (this.currentPatternIndex >= this.patterns.length) {
      this.currentPatternIndex = this.patterns.length - 1;
    }

    return true;
  }

  getCurrentPattern() {
    return this.patterns[this.currentPatternIndex];
  }

  switchToPattern(patternId) {
    const index = this.patterns.findIndex((p) => p.id === patternId);
    if (index === -1) return false;

    this.saveCurrentState();
    this.currentPatternIndex = index;
    this.currentStep = 0;
    this.loadPatternToSequencer();

    if (this.onPatternChange) {
      this.onPatternChange(this.getCurrentPattern(), this.currentPatternIndex);
    }

    return true;
  }

  previousPattern() {
    if (this.patterns.length <= 1) return false;

    let prevIndex = this.currentPatternIndex - 1;

    while (prevIndex >= 0 && !this.patterns[prevIndex].enabled) {
      prevIndex--;
    }

    if (prevIndex < 0) {
      if (this.loop) {
        prevIndex = this.patterns.length - 1;
        while (prevIndex >= 0 && !this.patterns[prevIndex].enabled) {
          prevIndex--;
        }
        if (prevIndex < 0) return false;
      } else {
        return false;
      }
    }

    this.saveCurrentState();
    this.currentPatternIndex = prevIndex;
    this.currentStep = 0;
    this.loadPatternToSequencer();

    if (this.onPatternChange) {
      this.onPatternChange(this.getCurrentPattern(), this.currentPatternIndex);
    }

    return true;
  }

  nextPattern() {
    if (this.patterns.length <= 1) return false;

    let nextIndex = this.currentPatternIndex + 1;

    while (
      nextIndex < this.patterns.length &&
      !this.patterns[nextIndex].enabled
    ) {
      nextIndex++;
    }

    if (nextIndex >= this.patterns.length) {
      if (this.loop) {
        nextIndex = 0;
        while (
          nextIndex < this.patterns.length &&
          !this.patterns[nextIndex].enabled
        ) {
          nextIndex++;
        }
        if (nextIndex >= this.patterns.length) return false;
      } else {
        return false;
      }
    }

    this.saveCurrentState();
    this.currentPatternIndex = nextIndex;
    this.currentStep = 0;
    this.loadPatternToSequencer();

    if (this.onPatternChange) {
      this.onPatternChange(this.getCurrentPattern(), this.currentPatternIndex);
    }

    return true;
  }

  saveCurrentState() {
    const currentPattern = this.getCurrentPattern();
    if (currentPattern) {
      currentPattern.data = this.sequencer.export();
    }
  }

  saveCurrentTracksToPattern() {
    // Alias for saveCurrentState for UI compatibility
    this.saveCurrentState();
  }

  loadPatternToSequencer() {
    const currentPattern = this.getCurrentPattern();
    if (currentPattern) {
      this.sequencer.import(currentPattern.data);
    }
  }

  togglePatternEnabled(patternId) {
    const pattern = this.patterns.find((p) => p.id == patternId);
    if (pattern) {
      pattern.enabled = !pattern.enabled;
      return pattern.enabled;
    }
    return false;
  }

  setPatternLength(patternId, length) {
    const pattern = this.patterns.find((p) => p.id == patternId);
    if (pattern) {
      pattern.length = Math.max(1, Math.min(64, length));
      return pattern.length;
    }
    return false;
  }

  getPatternSummary() {
    return this.patterns.map((pattern, index) => ({
      id: pattern.id,
      name: pattern.name,
      length: pattern.length,
      enabled: pattern.enabled,
      isCurrent: index === this.currentPatternIndex,
      hasNotes: this.patternHasNotes(pattern),
    }));
  }

  patternHasNotes(pattern) {
    if (!pattern.data || !pattern.data.tracks) return false;

    return pattern.data.tracks.some(
      (track) => track.sequence && track.sequence.some((note) => note !== null)
    );
  }

  getTotalLength() {
    return this.patterns
      .filter((p) => p.enabled)
      .reduce((total, pattern) => total + pattern.length, 0);
  }

  playStep() {
    this.currentStep++;

    if (this.onStepChange) {
      this.onStepChange(this.currentStep, this.getCurrentPattern().length);
    }

    if (this.currentStep >= this.getCurrentPattern().length) {
      this.currentStep = 0;
      return false; // Signal to advance to next pattern
    }

    return true;
  }

  exportData() {
    this.saveCurrentState();
    return {
      patterns: this.patterns.map((pattern) => ({ ...pattern })),
      currentPatternIndex: this.currentPatternIndex,
      loop: this.loop,
    };
  }

  importData(data) {
    if (!data.patterns || !Array.isArray(data.patterns)) return false;

    this.patterns = data.patterns.map((pattern) => ({ ...pattern }));
    this.currentPatternIndex = data.currentPatternIndex || 0;
    this.loop = data.loop !== undefined ? data.loop : true;
    this.currentStep = 0;

    if (this.currentPatternIndex >= this.patterns.length) {
      this.currentPatternIndex = 0;
    }

    this.loadPatternToSequencer();

    if (this.onPatternChange) {
      this.onPatternChange(this.getCurrentPattern(), this.currentPatternIndex);
    }

    return true;
  }

  // Legacy export/import methods for backward compatibility
  export() {
    return this.exportData();
  }

  import(data) {
    return this.importData(data);
  }
}
