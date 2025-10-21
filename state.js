export class YanlikState {
  constructor() {
    this.memory = JSON.parse(localStorage.getItem('yanlik_memory') || '[]');
    this.energy = JSON.parse(localStorage.getItem('yanlik_energy') || 'false');
  }
  remember(line) {
    this.memory.push(line);
    if (this.memory.length > 2000) this.memory.shift();
    localStorage.setItem('yanlik_memory', JSON.stringify(this.memory));
  }
  isEnergy() { return !!this.energy; }
  setEnergy(v) { this.energy = !!v; localStorage.setItem('yanlik_energy', JSON.stringify(v)); }
}