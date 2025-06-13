/**
 * SwingEngine - Manages swing/groove timing adjustments for musical feel
 */
class SwingEngine {
  constructor() {
    this.swingAmount = 0; // 0-100, where 0 = straight, 50 = triplet swing, 100 = extreme swing
    this.grooveType = "none"; // none, swing, shuffle, latin, funk, trap
    this.humanizeAmount = 0; // 0-100, adds random micro-timing variations
    this.accentPattern = []; // Array of accent strengths for each step
    this.velocityVariation = 0; // 0-100, adds random velocity variations

    // Pre-defined groove templates
    this.grooveTemplates = {
      none: {
        swingAmount: 0,
        humanizeAmount: 0,
        accentPattern: [],
        description: "Straight timing",
      },
      swing: {
        swingAmount: 35,
        humanizeAmount: 5,
        accentPattern: [1.0, 0.7, 0.9, 0.7], // Strong on 1 and 3
        description: "Classic jazz swing",
      },
      shuffle: {
        swingAmount: 50,
        humanizeAmount: 8,
        accentPattern: [1.0, 0.6, 0.8, 0.6],
        description: "Heavy shuffle feel",
      },
      latin: {
        swingAmount: 15,
        humanizeAmount: 3,
        accentPattern: [1.0, 0.7, 0.8, 0.9, 0.7, 0.6, 0.8, 0.7],
        description: "Latin groove",
      },
      funk: {
        swingAmount: 20,
        humanizeAmount: 10,
        accentPattern: [1.0, 0.6, 0.8, 0.9, 0.7, 0.5, 0.8, 0.6],
        description: "Funk pocket",
      },
      trap: {
        swingAmount: 8,
        humanizeAmount: 15,
        accentPattern: [1.0, 0.5, 0.6, 0.8, 0.7, 0.5, 0.9, 0.6],
        description: "Modern trap feel",
      },
      dilla: {
        swingAmount: 25,
        humanizeAmount: 20,
        accentPattern: [1.0, 0.6, 0.7, 0.8, 0.6, 0.5, 0.8, 0.7],
        description: "J Dilla-style laid back",
      },
    };
  }

  /**
   * Apply groove template
   */
  applyGrooveTemplate(templateName) {
    const template = this.grooveTemplates[templateName];
    if (!template) return false;

    this.grooveType = templateName;
    this.swingAmount = template.swingAmount;
    this.humanizeAmount = template.humanizeAmount;
    this.accentPattern = [...template.accentPattern];

    return true;
  }

  /**
   * Calculate timing offset for a given step
   */
  calculateTimingOffset(stepIndex, stepResolution = "16n") {
    let offset = 0;

    // Base swing calculation
    if (this.swingAmount > 0) {
      const isOffBeat = stepIndex % 2 === 1;
      if (isOffBeat) {
        // Convert swing amount to timing offset
        const maxOffset = this.getMaxSwingOffset(stepResolution);
        offset += (this.swingAmount / 100) * maxOffset;
      }
    }

    // Add humanization (random micro-timing)
    if (this.humanizeAmount > 0) {
      const maxHumanize = this.getMaxHumanizeOffset(stepResolution);
      const randomOffset =
        (Math.random() - 0.5) * 2 * maxHumanize * (this.humanizeAmount / 100);
      offset += randomOffset;
    }

    return offset;
  }

  /**
   * Calculate velocity/accent multiplier for a given step
   */
  calculateAccentMultiplier(stepIndex) {
    let multiplier = 1.0;

    // Apply accent pattern
    if (this.accentPattern.length > 0) {
      const patternIndex = stepIndex % this.accentPattern.length;
      multiplier *= this.accentPattern[patternIndex];
    }

    // Add velocity variation
    if (this.velocityVariation > 0) {
      const variation =
        (Math.random() - 0.5) * 2 * (this.velocityVariation / 100) * 0.3;
      multiplier += variation;
      multiplier = Math.max(0.1, Math.min(1.0, multiplier));
    }

    return multiplier;
  }

  /**
   * Get maximum swing offset based on step resolution
   */
  getMaxSwingOffset(stepResolution) {
    const offsets = {
      "32n": 0.02, // 32nd notes - subtle swing
      "16n": 0.04, // 16th notes - standard swing
      "8n": 0.08, // 8th notes - heavy swing
      "16t": 0.03, // 16th triplets
      "8t": 0.06, // 8th triplets
    };
    return offsets[stepResolution] || 0.04;
  }

  /**
   * Get maximum humanize offset based on step resolution
   */
  getMaxHumanizeOffset(stepResolution) {
    const offsets = {
      "32n": 0.005,
      "16n": 0.01,
      "8n": 0.02,
      "16t": 0.008,
      "8t": 0.015,
    };
    return offsets[stepResolution] || 0.01;
  }

  /**
   * Set custom swing amount
   */
  setSwingAmount(amount) {
    this.swingAmount = Math.max(0, Math.min(100, amount));
    if (this.swingAmount === 0) {
      this.grooveType = "none";
    } else {
      this.grooveType = "custom";
    }
  }

  /**
   * Set humanization amount
   */
  setHumanizeAmount(amount) {
    this.humanizeAmount = Math.max(0, Math.min(100, amount));
  }

  /**
   * Set velocity variation amount
   */
  setVelocityVariation(amount) {
    this.velocityVariation = Math.max(0, Math.min(100, amount));
  }

  /**
   * Set custom accent pattern
   */
  setAccentPattern(pattern) {
    this.accentPattern = pattern.map((val) =>
      Math.max(0.1, Math.min(1.0, val))
    );
  }

  /**
   * Generate a random accent pattern
   */
  generateRandomAccentPattern(length = 8, intensity = 0.5) {
    const pattern = [];
    for (let i = 0; i < length; i++) {
      const isDownbeat = i % 4 === 0;
      const baseAccent = isDownbeat ? 1.0 : 0.6;
      const variation = (Math.random() - 0.5) * intensity;
      pattern.push(Math.max(0.3, Math.min(1.0, baseAccent + variation)));
    }
    this.setAccentPattern(pattern);
    return pattern;
  }

  /**
   * Create a custom groove and save it
   */
  createCustomGroove(name, settings) {
    this.grooveTemplates[name] = {
      swingAmount: settings.swingAmount || 0,
      humanizeAmount: settings.humanizeAmount || 0,
      accentPattern: settings.accentPattern || [],
      description: settings.description || "Custom groove",
    };
  }

  /**
   * Export current swing settings
   */
  export() {
    return {
      grooveType: this.grooveType,
      swingAmount: this.swingAmount,
      humanizeAmount: this.humanizeAmount,
      velocityVariation: this.velocityVariation,
      accentPattern: [...this.accentPattern],
    };
  }

  /**
   * Import swing settings
   */
  import(data) {
    if (data.grooveType) this.grooveType = data.grooveType;
    if (data.swingAmount !== undefined) this.swingAmount = data.swingAmount;
    if (data.humanizeAmount !== undefined)
      this.humanizeAmount = data.humanizeAmount;
    if (data.velocityVariation !== undefined)
      this.velocityVariation = data.velocityVariation;
    if (data.accentPattern) this.accentPattern = [...data.accentPattern];
  }

  /**
   * Get available groove templates
   */
  getAvailableGrooves() {
    return Object.keys(this.grooveTemplates).map((key) => ({
      name: key,
      description: this.grooveTemplates[key].description,
    }));
  }

  /**
   * Reset to straight timing
   */
  reset() {
    this.applyGrooveTemplate("none");
  }

  /**
   * Preview a groove by briefly applying it
   */
  previewGroove(templateName, callback) {
    const originalSettings = this.export();
    this.applyGrooveTemplate(templateName);

    if (callback) callback();

    // Restore original settings after a short delay
    setTimeout(() => {
      this.import(originalSettings);
    }, 2000);
  }
}
