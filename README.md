# 🎵 Chiptune Composer

A powerful web-based chiptune music composer that brings the nostalgic sounds of 8-bit video games to your browser. Create authentic retro music with a comprehensive sequencer, pattern chain system, and advanced swing/groove controls.

![chiptune](https://github.com/user-attachments/assets/1dd9bc06-eb29-46c2-8869-7a75b82e5f98)

## ✨ Features

### 🎹 **Core Sequencer**
- **6 Multi-Track Sequencer**: Lead, Bass, Arp, Percussion, Pad, and FX tracks
- **32-Step Patterns**: Classic step sequencer with visual feedback
- **Real-time Playback**: Live editing while playing
- **Individual Track Controls**: Volume, mute, clear, and wave selection per track

### 🎛️ **Comprehensive Sound Engine**
- **25+ Authentic Waveforms**:
  - Classic waves (Square, Sawtooth, Triangle, Sine)
  - Chip waves (Pulse variations, Fat Saw, PWM)
  - Percussion (White/Pink/Brown noise variants, Hi-hat)
  - FM Synthesis (Bell, Bass, Brass, Wobble)
  - Effects (LP/HP sweeps, Resonant filters, Bitcrush)
  - Atmospheric (Pads, Crystal bells, Wind, Digital rain)

### 🎼 **Pattern Chain System**
- **Multi-Pattern Compositions**: Chain patterns for full songs
- **Pattern Management**: Add, duplicate, delete, and reorder patterns
- **Individual Pattern Settings**: Custom lengths (1-64 steps), enable/disable
- **Loop Control**: Seamless pattern transitions with loop options
- **Pattern Navigation**: Previous/Next controls with visual indicators

### 🎵 **Advanced Groove Engine**
- **7 Built-in Groove Presets**: 
  - Jazz Swing, Heavy Shuffle, Latin, Funk, Trap, J Dilla-style
- **Manual Swing Control**: 0-100% adjustable swing timing
- **Humanization**: Add natural micro-timing variations
- **Velocity Variation**: Dynamic volume changes for organic feel
- **8-Step Accent Patterns**: Custom rhythmic emphasis
- **Custom Groove Creation**: Save your own groove combinations

### 🎚️ **Professional Features**
- **Variable Tempo**: 60-200 BPM with real-time adjustment
- **Step Resolution**: 16th notes, 8th triplets, 16th triplets
- **MP3 Export**: Record and download your creations
- **Save/Load System**: JSON-based project storage
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites
- Modern web browser with Web Audio API support
- No installation required - runs entirely in the browser!

### Quick Start
1. **Clone the repository**:
   ```bash
   git clone https://github.com/ninefingerwoodshop/chiptune-composer.git
   cd chiptune-composer
   ```

2. **Open in browser**:
   ```bash
   # Simple local server (Python 3)
   python -m http.server 8000
   
   # Or use any local server
   # Then open http://localhost:8000
   ```

3. **Start composing**:
   - Click "🎧 Initialize Audio" to enable sound
   - Select notes and click on the step grid to create patterns
   - Press "▶ Play" to hear your creation
   - Experiment with different waveforms and groove settings

## 🎮 How to Use

### Basic Workflow
1. **Initialize Audio**: Click the audio initialization button
2. **Select Notes**: Choose notes (C, C#, D, etc.) and octave (2-6)
3. **Create Patterns**: Click on step grid to place notes
4. **Adjust Sounds**: Change waveforms, volume, and effects per track
5. **Add Groove**: Apply swing and humanization for musical feel
6. **Chain Patterns**: Create longer compositions with the pattern system
7. **Export**: Record to MP3 when satisfied

### Pro Tips
- **Use REST notes** for creating rhythmic gaps
- **Layer different waveforms** across tracks for rich textures  
- **Apply swing** to make rhythms feel more natural
- **Chain patterns** to build complete song structures
- **Experiment with accent patterns** for dynamic emphasis

## 🏗️ Architecture

### Core Components
```
├── js/
│   ├── AudioEngine.js      # Tone.js synthesis and effects
│   ├── Track.js           # Individual track logic
│   ├── Sequencer.js       # Main playback engine
│   ├── SwingEngine.js     # Groove and timing control
│   ├── PatternChain.js    # Pattern management
│   ├── PatternChainUI.js  # Pattern chain interface
│   ├── SwingUI.js         # Groove controls interface
│   ├── UIBindings.js      # Event handlers and UI logic
│   └── Main.js            # Application initialization
├── chiptuneCompose.html   # Main application
└── README.md
```

### Key Technologies
- **[Tone.js](https://tonejs.github.io/)**: Web Audio API framework for synthesis
- **[LameJS](https://github.com/zhuker/lamejs)**: MP3 encoding for audio export
- **Vanilla JavaScript**: No frameworks, maximum compatibility
- **CSS Grid/Flexbox**: Responsive layout system

## 🎨 Customization

### Adding New Waveforms
Add new synth types in `AudioEngine.js`:
```javascript
case "newWave":
  synth = new Tone.Synth({
    oscillator: { type: "your_wave_type" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 }
  }).connect(this.limiter);
  break;
```

### Creating Custom Groove Templates
Extend the groove system in `SwingEngine.js`:
```javascript
customGroove: {
  swingAmount: 30,
  humanizeAmount: 10,
  accentPattern: [1.0, 0.7, 0.8, 0.6],
  description: "Your custom groove"
}
```

## 📱 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 66+ | ✅ Full | Recommended |
| Firefox 60+ | ✅ Full | Complete support |
| Safari 14+ | ✅ Full | iOS Safari supported |
| Edge 79+ | ✅ Full | Chromium-based |

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and patterns
- Test across multiple browsers
- Add comments for complex audio/timing logic
- Update README if adding new features

## 🐛 Known Issues

- **Audio latency**: May vary by browser/device (use Chrome for best performance)
- **Mobile limitations**: Some mobile browsers have audio restrictions
- **Pattern length**: Currently limited to 64 steps per pattern

## 🔮 Roadmap

- [ ] **Keyboard shortcuts** for faster workflow
- [ ] **MIDI import/export** for DAW integration  
- [ ] **More synthesis types** (AM, Ring Mod, Granular)
- [ ] **Effects chain** per track (Reverb, Delay, Filter)
- [ ] **Song arrangement** view for full compositions
- [ ] **Community sharing** features
- [ ] **Audio sample import** for hybrid compositions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Tone.js](https://tonejs.github.io/)** - Incredible Web Audio framework
- **Chiptune community** - Inspiration and feedback
- **Classic video game composers** - Musical inspiration
- **8-bit era hardware** - Sound design reference

## 🔗 Links

- **Live Demo**: [Try Chiptune Composer](https://yourusername.github.io/chiptune-composer)
- **Issues**: [Report bugs or request features](https://github.com/ninefingerwoodshop/chiptune-composer/issues)
- **Discussions**: [Join the community](https://github.com/yourusername/chiptune-composer/discussions)

---

**Made with ❤️ for the chiptune community**

*Bring back the golden age of video game music - one beep at a time! 🎮*
