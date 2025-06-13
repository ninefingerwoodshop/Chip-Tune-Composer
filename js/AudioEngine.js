/**
 * AudioEngine - Manages all audio synthesis and effects
 */
class AudioEngine {
  constructor() {
    this.limiter = null;
    this.synths = [];
    this.previewSynths = {};
    this.recorder = new Tone.Recorder();
    this.isInitialized = false;

    // Connect recorder to destination
    Tone.Destination.connect(this.recorder);

    // Set Tone.js lookAhead for tighter scheduling
    Tone.context.lookAhead = 0.05;
  }

  async initialize() {
    if (this.isInitialized) return;

    await Tone.start();

    // Create limiter at the top and store globally
    this.limiter = new Tone.Limiter(-6).toDestination();

    // Initialize preview synths for game FX
    this.previewSynths.coin = this.createSynth("fmBell");
    this.previewSynths.jump = this.createSynth("square");
    this.previewSynths.laser = this.createSynth("square");
    this.previewSynths.powerup = this.createSynth("fmBell");

    this.isInitialized = true;
  }

  createSynth(type) {
    let synth;

    switch (type) {
      // Classic Waves
      case "square":
        synth = new Tone.Synth({
          oscillator: { type: "square" },
          envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
        }).connect(this.limiter);
        break;

      case "sawtooth":
        synth = new Tone.Synth({
          oscillator: { type: "sawtooth" },
          envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
        }).connect(this.limiter);
        break;

      case "triangle":
        synth = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
        }).connect(this.limiter);
        break;

      case "sine":
        synth = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 1.0 },
        }).connect(this.limiter);
        break;

      // Enhanced Chip Waves
      case "pulse25":
        synth = new Tone.Synth({
          oscillator: { type: "pulse", width: 0.25 },
          envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
        }).connect(this.limiter);
        break;

      case "pulse12":
        synth = new Tone.Synth({
          oscillator: { type: "pulse", width: 0.125 },
          envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
        }).connect(this.limiter);
        break;

      case "fatSaw":
        synth = new Tone.Synth({
          oscillator: { type: "fatsawtooth" },
          envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
        }).connect(this.limiter);
        break;

      case "pwmPulse":
        synth = new Tone.Synth({
          oscillator: { type: "pulse", width: 0.5 },
          envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
        }).connect(this.limiter);
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
        }).connect(this.limiter);
        break;

      case "pinkTom":
        synth = new Tone.NoiseSynth({
          noise: { type: "pink" },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0 },
        }).connect(this.limiter);
        break;

      case "brownKick":
        synth = new Tone.NoiseSynth({
          noise: { type: "brown" },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0 },
        }).connect(this.limiter);
        break;

      case "hihat":
        const hihatFilter = new Tone.Filter(8000, "highpass").connect(
          this.limiter
        );
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
        }).connect(this.limiter);
        break;

      case "fmBass":
        synth = new Tone.MonoSynth({
          oscillator: { type: "square" },
          envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.1 },
        }).connect(this.limiter);
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
        }).connect(this.limiter);
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
        }).connect(this.limiter);
        // Add wobble LFO
        const wobbleLFO = new Tone.LFO(8, 1, 20);
        wobbleLFO.connect(synth.modulationIndex);
        wobbleLFO.start();
        break;

      // Filtered & Effects
      case "lpSweep":
        const lpFilter = new Tone.Filter(200, "lowpass").connect(this.limiter);
        const lpLFO = new Tone.LFO(0.5, 100, 2000);
        lpLFO.connect(lpFilter.frequency);
        lpLFO.start();
        synth = new Tone.Synth({
          oscillator: { type: "sawtooth" },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 1 },
        }).connect(lpFilter);
        break;

      case "hpStab":
        const hpFilter = new Tone.Filter(1000, "highpass").connect(
          this.limiter
        );
        synth = new Tone.Synth({
          oscillator: { type: "square" },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
        }).connect(hpFilter);
        break;

      case "resonantSweep":
        const resonantFilter = new Tone.Filter(500, "lowpass", -24).connect(
          this.limiter
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
        const bitCrusher = new Tone.BitCrusher(4).connect(this.limiter);
        synth = new Tone.Synth({
          oscillator: { type: "square" },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.3 },
        }).connect(bitCrusher);
        break;

      // Atmospheric
      case "padWash":
        const reverb = new Tone.Reverb(8).connect(this.limiter);
        synth = new Tone.Synth({
          oscillator: { type: "sawtooth" },
          envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 },
        }).connect(reverb);
        break;

      case "crystalBell":
        const reverb2 = new Tone.Reverb(8).connect(this.limiter);
        synth = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: { attack: 0.01, decay: 2, sustain: 0.1, release: 3 },
        }).connect(reverb2);
        break;

      case "windSweep":
        const reverb3 = new Tone.Reverb(8).connect(this.limiter);
        synth = new Tone.NoiseSynth({
          noise: { type: "pink" },
          envelope: { attack: 1, decay: 2, sustain: 0.5, release: 4 },
        }).connect(reverb3);
        break;

      case "digitalRain":
        const reverb4 = new Tone.Reverb(8).connect(this.limiter);
        const digitalFilter = new Tone.Filter(2000, "bandpass").connect(
          reverb4
        );
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
        }).connect(this.limiter);
    }

    return synth;
  }

  initializeTracks(tracks) {
    this.synths = [];
    tracks.forEach((track) => {
      const synth = this.createSynth(track.type);
      synth.volume.value = Tone.gainToDb(track.volume);
      this.synths.push(synth);
    });
  }

  updateSynthForTrack(trackIndex, type, volume) {
    if (this.synths[trackIndex]) {
      this.synths[trackIndex].dispose();
    }
    this.synths[trackIndex] = this.createSynth(type);
    this.synths[trackIndex].volume.value = Tone.gainToDb(volume);
  }

  playNote(trackIndex, note, duration, time) {
    if (!this.synths[trackIndex]) return;

    if (this.synths[trackIndex] instanceof Tone.NoiseSynth) {
      this.synths[trackIndex].triggerAttackRelease(duration, time);
    } else {
      this.synths[trackIndex].triggerAttackRelease(note, duration, time);
    }
  }

  previewSound(soundType) {
    if (!this.isInitialized) return;

    switch (soundType) {
      case "coin":
        this.previewSynths.coin.triggerAttackRelease("C6", "16n");
        this.previewSynths.coin.triggerAttackRelease("E6", "16n", "+0.1");
        break;
      case "jump":
        this.previewSynths.jump.triggerAttackRelease("C5", "16n");
        break;
      case "laser":
        this.previewSynths.laser.triggerAttackRelease("C6", "8n");
        break;
      case "powerup":
        const notes = ["C5", "E5", "G5", "C6"];
        notes.forEach((note, i) => {
          this.previewSynths.powerup.triggerAttackRelease(
            note,
            "16n",
            "+" + i * 0.1
          );
        });
        break;
    }
  }

  async startRecording() {
    this.recorder.start();
  }

  async stopRecording() {
    const recording = await this.recorder.stop();
    return this.convertToMp3(recording);
  }

  async convertToMp3(recording) {
    const audioCtx = new AudioContext();
    const decoded = await audioCtx.decodeAudioData(
      await recording.arrayBuffer()
    );
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

    return new Blob(mp3Data, { type: "audio/mp3" });
  }

  dispose() {
    this.synths.forEach((synth) => synth.dispose());
    Object.values(this.previewSynths).forEach((synth) => synth.dispose());
    if (this.limiter) this.limiter.dispose();
  }
}
