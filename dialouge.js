export function getYanlikReply(text, state) {
  const t = text.toLowerCase().trim();
  if (t === 'energy on') { state.setEnergy(true); return '⚡ Energy Mode aktif.'; }
  if (t === 'energy off') { state.setEnergy(false); return '💤 Energy kapalı.'; }

  if (t.startsWith('/tkm')) {
    const o = ['taş','kağıt','makas']; const cpu = o[Math.floor(Math.random()*3)];
    const user = t.split(' ')[1];
    if (!user) return 'Kullanım: /tkm taş|kağıt|makas';
    if (user === cpu) return `Berabere — ${cpu}`;
    if ((user==='taş'&&cpu==='makas')||(user==='kağıt'&&cpu==='taş')||(user==='makas'&&cpu==='kağıt'))
      return `Kazandın 🎉 Bot: ${cpu}`;
    return `Kaybettin 😅 Bot: ${cpu}`;
  }

  if (state.isEnergy()) {
    const list = ['⚡ Dalga yayıldı.','Enerji tınısı hissediliyor.','Matrix akışı seninle.'];
    return list[Math.floor(Math.random()*list.length)];
  }

  if (/merhaba|selam/.test(t)) return 'Selam! Nasılsın bugün?';
  if (/nasılsın/.test(t)) return 'Ben iyiyim, sen nasılsın?';
  if (/görüşürüz|bay/.test(t)) return 'Görüşürüz! ⚡';
  return ['Hmm... ilginç.','Devam et, dinliyorum.','Bunu biraz açar mısın?'][Math.floor(Math.random()*3)];
}