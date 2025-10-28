/* ============================================================
   YANLIK 5.0 • Language & Emotion Module
   Multi-language detection, lightweight translation & tone
   ============================================================ */

(function(global){
  "use strict";

  const VERSION = "5.0-lang";

  // Dil kısaltmaları
  const SUPPORTED = {
    tr: "Türkçe",
    en: "English",
    es: "Español",
    de: "Deutsch",
    fr: "Français",
    ja: "日本語",
    ru: "Русский",
    ar: "العربية"
  };

  // Basit dil tespiti (anahtar kelimeler + karakter aralığı)
  function detectLanguage(text){
    text = text.trim();
    if(!text) return "tr";

    const t = text.toLowerCase();

    if(/[ığüşöç]/.test(t)) return "tr";
    if(/[а-яё]/.test(t)) return "ru";
    if(/[áéíóúñü]/.test(t)) return "es";
    if(/[äöüß]/.test(t)) return "de";
    if(/[àâçéèêëîïôûùüÿœ]/.test(t)) return "fr";
    if(/[\u3040-\u30ff]/.test(t)) return "ja";
    if(/[\u0600-\u06ff]/.test(t)) return "ar";
    if(/\b(the|you|and|is|are|what|how|why|please)\b/i.test(text)) return "en";

    return "en"; // varsayılan
  }

  // Temel çeviri sözlüğü (offline)
  const Lexicon = {
    tr: {
      hello: "merhaba",
      hi: "selam",
      how_are_you: "nasılsın",
      good: "iyi",
      bad: "kötü",
      yes: "evet",
      no: "hayır",
      thanks: "teşekkürler",
      sorry: "üzgünüm"
    },
    en: {
      merhaba: "hello",
      nasılsın: "how are you",
      evet: "yes",
      hayır: "no",
      teşekkürler: "thanks",
      üzgünüm: "sorry"
    },
    es: {
      hello: "hola",
      how_are_you: "¿cómo estás?",
      thanks: "gracias",
      sorry: "lo siento"
    },
    de: {
      hello: "hallo",
      thanks: "danke",
      sorry: "entschuldigung"
    }
  };

  // Basit kelime tabanlı çeviri
  function translateWord(word, from, to){
    if(from === to) return word;
    const fromDict = Lexicon[from];
    const toDict = Lexicon[to];
    if(!fromDict || !toDict) return word;

    // kaynak -> ingilizce -> hedef
    let en = null;
    for(const [k,v] of Object.entries(fromDict)){
      if(word.toLowerCase() === v.toLowerCase() || word.toLowerCase() === k.toLowerCase()){
        en = k;
        break;
      }
    }
    if(!en && from !== "en") return word;
    const translated = toDict[en] || word;
    return translated;
  }

  function simpleTranslate(text, from, to){
    if(from === to) return text;
    const words = text.split(/\s+/);
    const mapped = words.map(w => translateWord(w, from, to));
    return mapped.join(" ");
  }

  // Duygu analizi (anahtar kelime + emoji)
  const EmotionLex = {
    tr: {
      mutlu:["mutlu","iyi","harika","şahane","güzel","sevindim","😍","😊"],
      üzgün:["üzgün","kötü","mutsuz","ağladım","😢","🥺"],
      sinirli:["sinirli","kızgınım","öfkeliyim","lanet","😡"],
      korkmuş:["korktum","endişeliyim","panik","😰"]
    },
    en: {
      happy:["happy","good","great","awesome","love","😍","😊"],
      sad:["sad","cry","depressed","😭","😢"],
      angry:["angry","mad","furious","😡"],
      scared:["scared","afraid","worried","😰"]
    }
  };

  function detectEmotion(text, lang="en"){
    text = text.toLowerCase();
    const dict = EmotionLex[lang] || EmotionLex.en;
    for(const [emo, list] of Object.entries(dict)){
      if(list.some(k=>text.includes(k))) return emo;
    }
    return "neutral";
  }

  // Çoklu dil desteği nesnesi
  const Lang = {
    detectLanguage,
    translateWord,
    simpleTranslate,
    detectEmotion,
    SUPPORTED,
    Lexicon,
    EmotionLex,

    summarize(text, lang){
      const words = text.split(/\s+/).length;
      if(words < 6) return text;
      const s = text.slice(0,80);
      if(lang==="tr") return s+"...";
      if(lang==="en") return s+"...";
      return s+"...";
    }
  };

  // EventBus ile bağlan
  YanlikBus.on("user:send", (msg)=>{
    const lang = detectLanguage(msg.text);
    msg.lang = lang;
    msg.emotion = detectEmotion(msg.text, lang);
    YanlikBus.emit("lang:detected", msg);
  });

  console.log("Yanlik Lang loaded:", VERSION);

  global.YanlikLang = Lang;

})(window);