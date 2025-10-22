export function getYanlikReply(text,state){
  const t=text.toLowerCase().trim();
  if(!t) return "Bir şey yazmadın :)";
  if(t==="energy on"){ state.setEnergy(true); return "⚡ Energy Mode aktif!"; }
  if(t==="energy off"){ state.setEnergy(false); return "💤 Energy kapatıldı."; }
  if(t.startsWith("/tkm")){
    const secenek=["taş","kağıt","makas"];
    const user=t.split(" ")[1];
    const cpu=secenek[Math.floor(Math.random()*3)];
    if(!user) return "Kullanım: /tkm taş|kağıt|makas";
    if(!secenek.includes(user)) return "Geçerli seçenek: taş / kağıt / makas";
    if(user===cpu) return `Berabere 😎 (${cpu})`;
    if((user==="taş"&&cpu==="makas")||(user==="kağıt"&&cpu==="taş")||(user==="makas"&&cpu==="kağıt"))
      return `Kazandın! Ben: ${cpu}`;
    return `Kaybettin! Ben: ${cpu}`;
  }
  if(state.isEnergy()) return "⚡ Enerji titreşimi hissediliyor...";
  const replies=["Hmm...","Anladım.","Devam et.","İlginç...","Bunu not ettim."];
  return replies[Math.floor(Math.random()*replies.length)];
}