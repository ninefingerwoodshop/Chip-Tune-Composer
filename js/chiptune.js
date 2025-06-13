let audioInitialized = false;
let synths = {};

async function initializeAudio() {
  await Tone.start();

  // Classic Chip Waves
  synths.pulse25 = new Tone.PWMOscillator({
    frequency: 200,
    modulationFrequency: 2,
  }).toDestination();
  synths.laser = new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.2 },
  }).toDestination();

  synths.fatSaw = new Tone.Synth({
    oscillator: { type: "fatsawtooth" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
  }).toDestination();

  synths.pwmPulse = new Tone.Synth({
    oscillator: { type: "pulse", width: 0.5 },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
  }).toDestination();

  // Add PWM LFO
  const pwmLFO = new Tone.LFO(2, 0.1, 0.9);
  pwmLFO.connect(synths.pwmPulse.oscillator.width);
  pwmLFO.start();

  // Percussion & Noise
  synths.whiteSnare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
  }).toDestination();

  synths.pinkTom = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0 },
  }).toDestination();

  synths.brownKick = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0 },
  }).toDestination();

  const hihatFilter = new Tone.Filter(8000, "highpass").toDestination();
  synths.hihat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.01, decay: 0.05, sustain: 0 },
  }).connect(hihatFilter);

  // FM Synthesis
  synths.fmBell = new Tone.FMSynth({
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
  }).toDestination();

  synths.fmBass = new Tone.FMSynth({
    harmonicity: 1,
    modulationIndex: 5,
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
    modulation: { type: "triangle" },
    modulationEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.2,
      release: 0.1,
    },
  }).toDestination();

  synths.fmBrass = new Tone.FMSynth({
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
  }).toDestination();

  synths.fmWobble = new Tone.FMSynth({
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
  }).toDestination();

  // Add wobble LFO
  const wobbleLFO = new Tone.LFO(8, 1, 20);
  wobbleLFO.connect(synths.fmWobble.modulationIndex);
  wobbleLFO.start();

  // Filtered & Effects
  const lpFilter = new Tone.Filter(200, "lowpass").toDestination();
  const lpLFO = new Tone.LFO(0.5, 100, 2000);
  lpLFO.connect(lpFilter.frequency);
  lpLFO.start();
  synths.lpSweep = new Tone.Synth({
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 1 },
  }).connect(lpFilter);

  const hpFilter = new Tone.Filter(1000, "highpass").toDestination();
  synths.hpStab = new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
  }).connect(hpFilter);

  const resonantFilter = new Tone.Filter(500, "lowpass", -24).toDestination();
  resonantFilter.Q.value = 15;
  const resLFO = new Tone.LFO(1, 200, 2000);
  resLFO.connect(resonantFilter.frequency);
  resLFO.start();
  synths.resonantSweep = new Tone.Synth({
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
  }).connect(resonantFilter);

  const bitCrusher = new Tone.BitCrusher(4).toDestination();
  synths.bitcrush = new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.3 },
  }).connect(bitCrusher);

  // Atmospheric
  const reverb = new Tone.Reverb(8).toDestination();
  synths.padWash = new Tone.Synth({
    oscillator: { type: "sawtooth" },
    envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 },
  }).connect(reverb);

  synths.crystalBell = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 2, sustain: 0.1, release: 3 },
  }).connect(reverb);

  synths.windSweep = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 1, decay: 2, sustain: 0.5, release: 4 },
  }).connect(reverb);

  const digitalFilter = new Tone.Filter(2000, "bandpass").connect(reverb);
  synths.digitalRain = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 1 },
  }).connect(digitalFilter);

  audioInitialized = true;
  document.getElementById("initBtn").textContent = "✅ Audio Ready!";
  document.getElementById("initBtn").disabled = true;
}

function playSound(soundType) {
  if (!audioInitialized) return;

  // Game FX sequences
  if (soundType === "coin") {
    synths.fmBell.triggerAttackRelease("C6", "16n");
    synths.fmBell.triggerAttackRelease("E6", "16n", "+0.1");
    synths.fmBell.triggerAttackRelease("G6", "16n", "+0.2");
    return;
  }

  if (soundType === "jump") {
    synths.laser.triggerAttackRelease("C5", "16n");
    synths.laser.triggerAttackRelease("G4", "16n", "+0.1");
    return;
  }

  if (soundType === "powerup") {
    const notes = ["C5", "E5", "G5", "B5", "C6"];
    notes.forEach((note, i) => {
      synths.fmBell.triggerAttackRelease(note, "16n", "+" + i * 0.1);
    });
    return;
  }

  if (soundType === "laser") {
    synths.laser.triggerAttackRelease("C6", "16n");
    return;
  }

  const synth = synths[soundType];
  if (!synth) return;

  if (synth instanceof Tone.NoiseSynth) {
    synth.triggerAttackRelease("4n");
  } else if (synth.triggerAttackRelease) {
    synth.triggerAttackRelease("C4", "4n");
  } else if (synth.start) {
    synth.start();
    synth.stop("+1");
  }
}

document.getElementById("initBtn").addEventListener("click", initializeAudio);
