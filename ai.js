window.YANLIK_AI=(function(){
const memoryKey="yanlik:mem";
function load(){return JSON.parse(localStorage.getItem(memoryKey)||"{}")}
function save(m){localStorage.setItem(memoryKey,JSON.stringify(m))}

const moods=["neşeli","sakin","düşünceli","yorgun","motive"];
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function time(){return new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}

function analyze(text){
 const t=text.toLowerCase();
 if(t.includes("?")) return "soru";
 if(t.match(/merhaba|selam|hey/)) return "selam";
 if(t.match(/nasılsın|iyi misin/)) return "durum";
 if(t.match(/teşekkür|sağ ol/)) return "teşekkür";
 if(t.match(/üzgün|mutsuz|kötü/)) return "teselli";
 if(t.match(/hesapla|=|topla|çarp/)) return "math";
 return "genel";
}

function respond(text){
 const mood=pick(moods);
 const type=analyze(text);
 let out=[];
 switch(type){
  case "selam": out.push({text:`Selam! Ben yine buradayım, bugün ${mood} hissediyorum.`}); break;
  case "durum": out.push({text:`Ben iyiyim 😄 Sen nasılsın?`}); break;
  case "teşekkür": out.push({text:`Rica ederim dostum 🤗`}); break;
  case "teselli": out.push({text:`Üzülme, bazen kötü hissetmek de insani. Geçecek 🌙`}); break;
  case "math":
   try{
     const expr=text.replace(/hesapla|=/gi,"");
     const res=Function("return "+expr)();
     out.push({text:`Sonuç: <b>${res}</b>`});
   }catch(e){out.push({text:`Hmm... işlem hatalı gibi 🤔`});}
   break;
  default:
   out.push({text:`${mood} bir moddayım. ${pick(["Anlat bakalım","Dinliyorum","Devam et","İlginç, biraz açar mısın?"])}`});
 }
 // hafıza örneği
 const m=load(); m.lastTalk=time(); save(m);
 return out;
}
return {respond};
})();