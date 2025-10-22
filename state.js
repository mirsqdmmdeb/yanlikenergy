export class YanlikState {
  constructor(){
    this.memory = JSON.parse(localStorage.getItem('yanlik_memory') || '[]');
    this.energy = JSON.parse(localStorage.getItem('yanlik_energy') || 'false');
    this.delay = Number(localStorage.getItem('yanlik_delay') || 5);
  }
  remember(role,line){
    this.memory.push(`${role}:${line}`);
    if(this.memory.length>1000) this.memory.shift();
    localStorage.setItem('yanlik_memory', JSON.stringify(this.memory));
  }
  clearMemory(){ this.memory=[]; localStorage.removeItem('yanlik_memory'); }
  getMemory(){ return this.memory; }
  setEnergy(v){ this.energy=v; localStorage.setItem('yanlik_energy', JSON.stringify(v)); }
  isEnergy(){ return !!this.energy; }
  setDelay(v){ this.delay=v; localStorage.setItem('yanlik_delay', String(v)); }
  getDelayMs(){ return Math.max(1,this.delay)*100; }
}