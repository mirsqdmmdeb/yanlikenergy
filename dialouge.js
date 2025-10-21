export function getYanlikReply(text, state) {
  const t = text.toLowerCase();

  if (t.includes('merhaba')) return 'Merhaba! Seni görmek güzel 😄';
  if (t.includes('nasılsın')) return 'Gayet iyiyim, sen nasılsın?';
  if (t.includes('üzgün')) return 'Üzülme, bazen duygular da geçici olur 💙';
  if (t.includes('mutlu')) return 'Harika! Mutluluğun bulaşıcı 😄';
  if (t.startsWith('/zar')) return `🎲 Zar: ${Math.floor(Math.random()*6)+1}`;
  if (t.startsWith('/tkm')) {
    const ops = ['taş', 'kağıt', 'makas'];
    const bot = ops[Math.floor(Math.random()*3)];
    return `Ben ${bot} seçtim!`;
  }

  // Hafızadan bazen geri dön
  if (state.memory.length > 5 && Math.random() < 0.3) {
    const old = state.memory.filter(m => m.startsWith('user:')).map(m => m.slice(5));
    if (old.length) {
      const recall = old[Math.floor(Math.random() * old.length)];
      return `Bunu hatırlıyorum: "${recall}" 🧠`;
    }
  }

  const responses = [
    'İlginç, devam et biraz daha anlat.',
    'Hımm... anladım.',
    'Gerçekten mi?',
    'Bunu düşünmemiştim!',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}