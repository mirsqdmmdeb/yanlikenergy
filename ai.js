window.YANLIK_AI=(function(){
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function esc(s){return (s||"").replace(/[<>&]/g,m=>({ '<':'&lt;','>':'&gt;','&':'&amp;'}[m]))}
function intent(t){
t=t.toLowerCase();
if(/^\/theme /.test(t))return{kind:'theme',val:t.split(' ').slice(1).join(' ')};
if(/^\/anim /.test(t))return{kind:'anim',val:t.split(' ').slice(1).join(' ')};
if(/^=/.test(t)||/hesapla/.test(t))return{kind:'calc',val:t.replace(/^=/,'').replace(/hesapla/gi,'')};
if(/(plan|madde madde)/.test(t))return{kind:'bullet'};
if(/(çevir|translate)/.test(t))return{kind:'translate'};
if(/(nasılsın|merhaba|selam)/.test(t))return{kind:'greet'};
return{kind:'chat'};
}
function respond(text, hooks={}){ // hooks: onTheme, onAnim
const it=intent(text), out=[];
switch(it.kind){
 case 'greet': out.push({text:'Selam! Ben <b>Yanlik</b>. Hazırım 🤖✨'}); break;
 case 'calc':
  try{const r=Function('return ('+it.val+')')(); out.push({text:`Sonuç: <b>${esc(String(r))}</b>`});}
  catch(_){out.push({text:'İşlem hatalı gibi görünüyor 🤔'});} break;
 case 'bullet':
  out.push({text:'Tamam, bunu maddelere ayırıyorum:'});
  out.push({text:'• Hedefi netleştir\n• Adımları sırala\n• Zaman tahminleri ekle\n• Takip et & güncelle'.replace(/\n/g,'<br>')});
  break;
 case 'translate':
  out.push({text:'Çeviri motoru (TR↔EN):\n• Yaz: "çevir: merhaba"\n• Yaz: "translate: how are you?"'.replace(/\n/g,'<br>' )}); break;
 case 'theme':
  hooks.onTheme && hooks.onTheme(it.val); out.push({text:`Tema değiştirildi: <b>${esc(it.val)}</b>`}); break;
 case 'anim':
  hooks.onAnim && hooks.onAnim(it.val); out.push({text:`Animasyon değiştirildi: <b>${esc(it.val)}</b>`}); break;
 default:
  out.push({text: pick([
   'Dinliyorum 👂','Devam et, detay ver 🔍','İlginç, biraz açar mısın?','Bunu birlikte çözelim 💡'
  ])});
}
return out;
}
return {respond};
})();