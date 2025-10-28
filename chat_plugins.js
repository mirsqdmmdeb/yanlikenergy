/* ============================================================
   YANLIK 5.0 • Plugins & Commands (chat_plugins.js)
   /help • /mode • /clear • /export • /joke • /fact • personas
   Requires: chat_core.js, chat_lang.js, chat_memory.js
   ============================================================ */

(function (global) {
  "use strict";
  const VERSION = "5.0-plugins";
  const EXPORT_NAME = "yanlik_export_"+Date.now()+".json";

  const Personas = {
    friend:  { tr: "samimi, neşeli, günlük dil", en: "friendly, upbeat" },
    formal:  { tr: "resmi, net, kısa",           en: "formal, concise" },
    mentor:  { tr: "öğretici, adım adım",        en: "mentor-like, stepwise" }
  };

  let currentPersona = "friend";

  const Jokes = {
    tr: [
      "Bilgisayarım çok ağırlaştı, sanırım duygusal yük bindirdim 😄",
      "Bit’ler birleşmiş, byte olmuş; biz de birleşsek kahve olur mu? ☕"
    ],
    en: [
      "Why did the function break up with the loop? It needed space.",
      "I told my computer I needed a break—now it won’t stop sending KitKat ads."
    ]
  };

  const Facts = {
    tr: [
      "İnsan beyninde yaklaşık 86 milyar nöron olduğu düşünülüyor.",
      "Günde 10 dakika yürümek bile stres hormonlarını anlamlı azaltabilir."
    ],
    en: [
      "Honey never spoils; archaeologists found edible honey in ancient tombs.",
      "Short walks can reduce stress hormones within minutes."
    ]
  };

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function reply(text, meta={}){ global.YanlikCore.assistantReply(text, meta); }

  function personaPrefix(lang="tr"){
    if(currentPersona==="formal") return lang==="tr" ? "[Resmi] " : "[Formal] ";
    if(currentPersona==="mentor") return lang==="tr" ? "[Mentor] " : "[Mentor] ";
    return ""; // friend
  }

  // ---- Commands ----
  function runCommand(raw, lang="tr"){
    const t = raw.trim();
    const out = [];
    if(/^\/help\b/.test(t)){
      const help = lang==="tr" ?
`Komutlar:
/help — bu yardımı göster
/mode <friend|formal|mentor> — kişilik modu
/joke — ufak espri
/fact — küçük bilgi
/clear — bu konuşmayı temizle
/export — konuşmayı JSON indir`
:
`Commands:
/help — show this help
/mode <friend|formal|mentor> — persona
/joke — a joke
/fact — a small fact
/clear — clear current conversation
/export — download conversation JSON`;
      out.push(help);
    } else if(/^\/mode\b/.test(t)){
      const p = t.split(/\s+/)[1] || "friend";
      if(!Personas[p]) {
        out.push(lang==="tr" ? "Bilinmeyen mod. Seçenekler: friend, formal, mentor" : "Unknown mode. Use: friend, formal, mentor");
      } else {
        currentPersona = p;
        out.push(lang==="tr" ? `Mod: ${p}` : `Mode: ${p}`);
      }
    } else if(/^\/joke\b/.test(t)){
      out.push(personaPrefix(lang) + (Jokes[lang]?.length ? pick(Jokes[lang]) : pick(Jokes.en)));
    } else if(/^\/fact\b/.test(t)){
      out.push(personaPrefix(lang) + (Facts[lang]?.length ? pick(Facts[lang]) : pick(Facts.en)));
    } else if(/^\/clear\b/.test(t)){
      global.YanlikCore.clear();
      global.YanlikCore.createConversation();
      out.push(lang==="tr" ? "Konuşma temizlendi." : "Conversation cleared.");
    } else if(/^\/export\b/.test(t)){
      const conv = global.YanlikCore.current;
      if(!conv){ out.push(lang==="tr" ? "Konuşma yok." : "No conversation."); }
      else{
        const blob = new Blob([JSON.stringify(conv,null,2)], {type:"application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = EXPORT_NAME; document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        out.push(lang==="tr" ? "JSON indirildi." : "JSON exported.");
      }
    } else {
      // unknown → help hint
      out.push(lang==="tr" ? "Bilinmeyen komut. /help yaz." : "Unknown command. Try /help.");
    }
    return out.join("\n");
  }

  // Small utility: light Q&A (no web, simple)
  function quickQA(text, lang){
    const lo = text.toLowerCase();
    if(/saat kaç|time is it/.test(lo)){
      const d = new Date();
      return lang==="tr" ? `Şu an saat ${d.toLocaleTimeString()}` : `It's ${d.toLocaleTimeString()}`;
    }
    if(/hava nasıl|weather/.test(lo)){
      return lang==="tr" ? "Hava bilgisi için şu an çevrim dışıyım; ama istersen bulunduğun şehri kaydedeyim." :
                           "I’m offline for weather; tell me your city and I’ll remember.";
    }
    return null;
  }

  // Bus wiring: Komutları yakala, basit QA’yı persona ile ver
  YanlikBus.on("user:send", (msg)=>{
    const lang = msg.lang || global.YanlikLang?.detectLanguage(msg.text) || "tr";
    const t = msg.text.trim();

    if(t.startsWith("/")){
      const r = runCommand(t, lang);
      reply(r, { mode: "command", lang });
      return;
    }

    const qa = quickQA(t, lang);
    if(qa){
      reply(personaPrefix(lang) + qa, { mode:"qa", lang });
      return;
    }
  });

  // expose
  global.YanlikPlugins = {
    runCommand, quickQA, personas: Personas, getPersona: ()=>currentPersona, version: VERSION
  };
  console.log("Yanlik Plugins loaded:", VERSION);
})(window);