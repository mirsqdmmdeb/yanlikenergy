export class YanlikState {
  constructor() {
    this.memory = JSON.parse(localStorage.getItem('yanlik_memory') || '[]');
  }

  remember(msg) {
    this.memory.push(msg);
    if (this.memory.length > 1000) this.memory.shift();
    localStorage.setItem('yanlik_memory', JSON.stringify(this.memory));
  }

  reset() {
    this.memory = [];
    localStorage.removeItem('yanlik_memory');
  }
}