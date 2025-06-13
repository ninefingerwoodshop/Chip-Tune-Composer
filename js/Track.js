/**
 * Track - Represents a single track with its sequence and settings
 */
class Track {
  constructor(name, type, volume = 0.7, muted = false, sequence = null) {
    this.name = name;
    this.type = type;
    this.volume = volume;
    this.muted = muted;
    this.sequence = sequence || Array(32).fill(null);
  }

  setNote(stepIndex, note) {
    if (stepIndex >= 0 && stepIndex < this.sequence.length) {
      this.sequence[stepIndex] = note;
    }
  }

  removeNote(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.sequence.length) {
      this.sequence[stepIndex] = null;
    }
  }

  getNote(stepIndex) {
    return this.sequence[stepIndex];
  }

  clear() {
    this.sequence = Array(this.sequence.length).fill(null);
  }

  clone() {
    return new Track(this.name, this.type, this.volume, this.muted, [
      ...this.sequence,
    ]);
  }

  hasNotes() {
    return this.sequence.some((note) => note !== null);
  }

  export() {
    return {
      name: this.name,
      type: this.type,
      volume: this.volume,
      muted: this.muted,
      sequence: [...this.sequence],
    };
  }

  import(data) {
    this.name = data.name;
    this.type = data.type;
    this.volume = data.volume;
    this.muted = data.muted;
    this.sequence = [...data.sequence];
  }
}
