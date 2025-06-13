/**
 * Sequencer - Manages playback timing and track coordination with swing support
 */
class Sequencer {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.swingEngine = new SwingEngine();
    this.tracks = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.tempo = 120;
    this.stepResolution = "16n";
    this.mainLoop = null;
    this.onStepChange = null;

    this.initializeDefaultTracks();
  }

  initializeDefaultTracks() {
    this.tracks = [
      new Track("Lead", "square", 0.7),
      new Track("Bass", "fmBass", 0.8),
      new Track("Arp", "pulse25", 0.6),
      new Track("Perc", "whiteSnare", 0.5),
      new Track("Pad", "padWash", 0.4),
      new Track("FX", "fmBell", 0.3),
    ];
  }

  async start() {
    if (this.isPlaying || !this.audioEngine.isInitialized) return;

    this.isPlaying = true;
    Tone.Transport.bpm.value = this.tempo;

    // Initialize synths for all tracks
    this.audioEngine.initializeTracks(this.tracks);

    this.mainLoop = Tone.Transport.scheduleRepeat((time) => {
      this.playStep(time);
    }, this.stepResolution);

    Tone.Transport.start();
  }

  stop() {
    this.isPlaying = false;
    this.currentStep = 0;
    Tone.Transport.stop();
    Tone.Transport.cancel();

    if (this.onStepChange) {
      this.onStepChange(this.currentStep);
    }
  }

  playStep(time) {
    // Calculate swing timing offset for this step
    const timingOffset = this.swingEngine.calculateTimingOffset(
      this.currentStep,
      this.stepResolution
    );

    // Calculate accent multiplier for this step
    const accentMultiplier = this.swingEngine.calculateAccentMultiplier(
      this.currentStep
    );

    this.tracks.forEach((track, trackIndex) => {
      if (track.muted) return;

      const note = track.getNote(this.currentStep);
      if (note && note !== "REST") {
        // Apply swing timing and accent
        const adjustedTime = time + timingOffset;
        const adjustedVolume = track.volume * accentMultiplier;

        // Temporarily adjust the synth volume for this note
        if (this.audioEngine.synths[trackIndex]) {
          const originalVolume =
            this.audioEngine.synths[trackIndex].volume.value;
          this.audioEngine.synths[trackIndex].volume.value =
            Tone.gainToDb(adjustedVolume);

          this.audioEngine.playNote(trackIndex, note, "8n", adjustedTime);

          // Restore original volume after a short delay
          setTimeout(() => {
            if (this.audioEngine.synths[trackIndex]) {
              this.audioEngine.synths[trackIndex].volume.value = originalVolume;
            }
          }, 50);
        }
      }
    });

    if (this.onStepChange) {
      this.onStepChange(this.currentStep);
    }

    this.currentStep = (this.currentStep + 1) % 32;
  }

  setTempo(bpm) {
    this.tempo = bpm;
    if (this.audioEngine.isInitialized) {
      Tone.Transport.bpm.value = bpm;
    }
  }

  setStepResolution(resolution) {
    this.stepResolution = resolution;
  }

  // Swing/Groove methods
  setGroove(grooveType) {
    return this.swingEngine.applyGrooveTemplate(grooveType);
  }

  setSwingAmount(amount) {
    this.swingEngine.setSwingAmount(amount);
  }

  setHumanizeAmount(amount) {
    this.swingEngine.setHumanizeAmount(amount);
  }

  setVelocityVariation(amount) {
    this.swingEngine.setVelocityVariation(amount);
  }

  setAccentPattern(pattern) {
    this.swingEngine.setAccentPattern(pattern);
  }

  generateRandomAccentPattern(length, intensity) {
    return this.swingEngine.generateRandomAccentPattern(length, intensity);
  }

  getAvailableGrooves() {
    return this.swingEngine.getAvailableGrooves();
  }

  previewGroove(grooveType) {
    this.swingEngine.previewGroove(grooveType, () => {
      // Optional: trigger a short playback preview
      console.log(`Previewing groove: ${grooveType}`);
    });
  }

  getCurrentGrooveInfo() {
    return {
      type: this.swingEngine.grooveType,
      swingAmount: this.swingEngine.swingAmount,
      humanizeAmount: this.swingEngine.humanizeAmount,
      velocityVariation: this.swingEngine.velocityVariation,
      hasAccentPattern: this.swingEngine.accentPattern.length > 0,
    };
  }

  // Original methods remain unchanged
  getTrack(index) {
    return this.tracks[index];
  }

  updateTrackSynth(trackIndex, type) {
    if (this.tracks[trackIndex]) {
      this.tracks[trackIndex].type = type;
      if (this.audioEngine.isInitialized) {
        this.audioEngine.updateSynthForTrack(
          trackIndex,
          type,
          this.tracks[trackIndex].volume
        );
      }
    }
  }

  updateTrackVolume(trackIndex, volume) {
    if (this.tracks[trackIndex]) {
      this.tracks[trackIndex].volume = volume;
      if (
        this.audioEngine.isInitialized &&
        this.audioEngine.synths[trackIndex]
      ) {
        this.audioEngine.synths[trackIndex].volume.value =
          Tone.gainToDb(volume);
      }
    }
  }

  toggleTrackMute(trackIndex) {
    if (this.tracks[trackIndex]) {
      this.tracks[trackIndex].muted = !this.tracks[trackIndex].muted;
      return this.tracks[trackIndex].muted;
    }
    return false;
  }

  clearAllTracks() {
    this.tracks.forEach((track) => track.clear());
  }

  async recordToMp3() {
    if (this.isPlaying) return null;

    await this.audioEngine.startRecording();

    // Play through once for recording
    let stepsRecorded = 0;
    const recordLoop = Tone.Transport.scheduleRepeat((time) => {
      this.playStep(time);
      stepsRecorded++;
      if (stepsRecorded >= 32) {
        Tone.Transport.stop();
        Tone.Transport.clear(recordLoop);
        Tone.Transport.cancel();
      }
    }, this.stepResolution);

    Tone.Transport.start();

    // Wait for recording to complete
    await new Promise((resolve) => {
      const checkComplete = () => {
        if (stepsRecorded >= 32) {
          resolve();
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    });

    return await this.audioEngine.stopRecording();
  }

  export() {
    return {
      tracks: this.tracks.map((track) => track.export()),
      tempo: this.tempo,
      stepResolution: this.stepResolution,
      swing: this.swingEngine.export(),
    };
  }

  import(data) {
    if (data.tracks) {
      this.tracks = data.tracks.map((trackData) => {
        const track = new Track();
        track.import(trackData);
        return track;
      });
    }
    if (data.tempo) this.tempo = data.tempo;
    if (data.stepResolution) this.stepResolution = data.stepResolution;
    if (data.swing) this.swingEngine.import(data.swing);

    // Reinitialize audio if needed
    if (this.audioEngine.isInitialized) {
      this.audioEngine.initializeTracks(this.tracks);
    }
  }
}
