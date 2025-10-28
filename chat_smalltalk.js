/* ============================================================
   YANLIK 5.0 • Smalltalk / Normal Conversation Module
   Multilingual greetings • chit-chat • quick follow-ups
   Requires: chat_core.js, chat_lang.js
   Place BEFORE chat_empathetic.js in script order.
   ============================================================ */

(function (global) {
  "use strict";
  const VERSION = "5.0-smalltalk";

  const CFG = {
    stateKey: "yanlik.smalltalk.state",
    followupWindowMs: 8 * 60 * 1000,
    maxMemory: 10,
    neutralSingles: ["merhaba","selam","sa","hi","hello","hey","hola","hallo","こんにちは","yo","naber","nasılsın","nbr"],
  };

  const nowIso = () => new Date().toISOString();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const save = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };
  const load = (k, d=null) => { try{ return JSON.parse(localStorage.getItem(k) || (d===null?"null":JSON.stringify(d))); }catch{ return d; } };

  function getState() {
    const s = load(CFG.stateKey, { lastAt: 0, mem: [] });
    if (!Array.isArray(s.mem)) s.mem = [];
    return s;
  }
  function remember(key, val) {
    const s = getState();
    s.mem.unshift({ key, val, at: nowIso() });
    s.mem = s.mem.slice(0, CFG.maxMemory);
    s.lastAt = Date.now();
    save(CFG.stateKey, s);
  }
  function recall(key) {
    const s = getState();
    const hit = s.mem.find((m) => m.key === key);
    return hit?.val || null;
  }

  const P = {
    tr: {
      greet: ["Merhaba! 🤝", "Selam! 👋", "Hey, hoş geldin!"],
      howare: ["Nasıl gidiyor?", "Nasılsın bugün?", "Keyifler nasıl?"],
      good: ["Harika! Böyle devam. ✨", "Süper, sevindim! 😄", "Güzel haber!"],
      bad: ["Üzüldüm. İstersen biraz konuşabiliriz.", "Zor olabilir—buradayım."],
      thanks: ["Rica ederim!", "Ne demek, her zaman.", "Memnun oldum. 🙌"],
      bye: ["Görüşürüz! 👋", "Kendine iyi bak!", "Sonra tekrar yaz. ✌️"],
      ask_name: ["Bu arada, adını nasıl hitap edeyim?", "Sana nasıl sesleneyim?"],
      ask_city: ["Hangi şehirde yaşıyorsun?", "Bu arada neredensin?"],
      saved_name: (n) => `Tanıştığımıza memnun oldum, ${n}!`,
      saved_city: (c) => `${c} güzel şehirdir!`,
      followups: [
        "Bugün planında ne var?",
        "Hobilerin neler?",
        "Şu an en çok ne ilgini çekiyor?"
      ],
      smalltalk: [
        "Ben buralardayım, bir şey lazım olursa yaz.",
        "İstersen küçük bir hedef belirleyebiliriz.",
        "Bir fincan su veya kahve alıp kısa bir mola iyi gelebilir."
      ]
    },
    en: {
      greet: ["Hello! 🤝", "Hi! 👋", "Hey, welcome!"],
      howare: ["How’s it going?", "How are you today?", "How do you feel?"],
      good: ["Awesome! Keep it up ✨", "Great to hear! 😄", "Nice!"],
      bad: ["I’m sorry to hear that. I’m here if you want to talk.", "That sounds tough—I'm here."],
      thanks: ["You’re welcome!", "Anytime.", "My pleasure. 🙌"],
      bye: ["See you! 👋", "Take care!", "Catch you later. ✌️"],
      ask_name: ["By the way, what should I call you?", "How may I address you?"],
      ask_city: ["Which city are you in?", "Where are you from?"],
      saved_name: (n) => `Nice to meet you, ${n}!`,
      saved_city: (c) => `${c} sounds lovely!`,
      followups: [
        "What’s on your plan today?",
        "What are your hobbies?",
        "What’s catching your interest lately?"
      ],
      smalltalk: [
        "I’m around—ping me anytime.",
        "We can set a tiny goal if you’d like.",
        "A glass of water or a short break might help."
      ]
    },
    es: {
      greet: ["¡Hola! 🤝", "¡Hey! 👋", "¡Bienvenido/a!"],
      howare: ["¿Cómo va todo?", "¿Cómo estás hoy?"],
      good: ["¡Genial! ✨", "¡Me alegra! 😄"],
      bad: ["Lo siento; si quieres hablamos.", "Suena duro—aquí estoy."],
      thanks: ["¡De nada!", "Cuando quieras."],
      bye: ["¡Nos vemos! 👋", "¡Cuídate!"],
      ask_name: ["¿Cómo te llamo?"],
      ask_city: ["¿De qué ciudad eres?"],
      saved_name: (n) => `¡Encantado/a, ${n}!`,
      saved_city: (c) => `¡${c} suena bien!`,
      followups: ["¿Qué planes tienes hoy?", "¿Aficiones?"],
      smalltalk: ["Estoy por aquí si necesitas."]
    },
    de: {
      greet: ["Hallo! 🤝", "Hi! 👋"],
      howare: ["Wie geht’s?", "Wie fühlst du dich heute?"],
      good: ["Super! ✨", "Freut mich! 😄"],
      bad: ["Das tut mir leid. Ich bin da.", "Klingt schwer—ich bin hier."],
      thanks: ["Gern geschehen!", "Immer gerne."],
      bye: ["Bis später! 👋", "Mach’s gut!"],
      ask_name: ["Wie soll ich dich nennen?"],
      ask_city: ["Aus welcher Stadt bist du?"],
      saved_name: (n) => `Freut mich, ${n}!`,
      saved_city: (c) => `${c} klingt schön!`,
      followups: ["Was steht heute an?", "Hobbys?"],
      smalltalk: ["Ich bin da, wenn du mich brauchst."]
    },
    ja: {
      greet: ["こんにちは！ 🤝", "やあ！ 👋"],
      howare: ["調子はどう？"],
      good: ["いいね！ ✨", "嬉しいです！ 😄"],
      bad: ["つらいですね。ここにいます。"],
      thanks: ["どういたしまして！"],
      bye: ["またね！ 👋"],
      ask_name: ["どう呼べばいいですか？"],
      ask_city: ["どちらにお住まいですか？"],
      saved_name: (n) => `はじめまして、${n}！`,
      saved_city: (c) => `${c}、素敵ですね。`,
      followups: ["今日は何をしますか？", "趣味は何ですか？"],
      smalltalk: ["必要ならいつでも話しかけてください。"]
    }
  };

  function pack(lang) {
    if (P[lang]) return P[lang];
    return P.en;
  }

  function detectIntent(text) {
    const t = text.toLowerCase().trim();
    if (t.startsWith("/")) return { intent: "command" };

    const greetWords = ["merhaba","selam","hi","hello","hola","hallo","hey","sa","こんにちは"];
    if (greetWords.some(w => t === w || t.startsWith(w+" "))) return { intent: "greet" };

    const byeWords = ["görüşürüz","bay","bye","see you","later","sonra görüşürüz","bb"];
    if (byeWords.some(w => t.includes(w))) return { intent: "bye" };

    const thanksWords = ["teşekkür","sagol","sağ ol","thanks","ty","gracias","danke","merci","arigato","ありがとう"];
    if (thanksWords.some(w => t.includes(w))) return { intent: "thanks" };

    const howWords = ["nasılsın","naber","nbr","how are you","como estas","wie gehts","wie geht's","調子はどう"];
    if (howWords.some(w => t.includes(w))) return { intent: "howare" };

    const goodWords = ["iyiyim","harika","süper","great","awesome","bien","gut","いい"];
    if (goodWords.some(w => t.includes(w))) return { intent: "good" };

    const badWords = ["kötüyüm","moralim bozuk","üzgün","sad","bad","mal","schlecht","つらい","しんどい"];
    if (badWords.some(w => t.includes(w))) return { intent: "bad" };

    const nameMatch =
      t.match(/\b(adım|benim adım|ben)\s+([a-zçğıöşü\-']{2,})\b/i) ||
      t.match(/\b(my name is|i am|i'm)\s+([a-z\-']{2,})\b/i);
    if (nameMatch) return { intent: "name", value: nameMatch[2] };

    const cityMatch =
      t.match(/\b(i'm in|i live in|yaşiyorum|şehrindeyim|deyim|dayım)\s+([a-zçğıöşü\-']{2,})\b/i) ||
      t.match(/\b(izmir|ankara|istanbul|berlin|madrid|london|tokyo|paris|rome)\b/i);
    if (cityMatch) return { intent: "city", value: cityMatch[2] || cityMatch[0] };

    if (CFG.neutralSingles.includes(t)) return { intent: "greet" };

    return { intent: "none" };
  }

  function compose(intent, lang, text) {
    const L = pack(lang);

    switch (intent.intent) {
      case "greet": {
        const name = recall("name");
        const head = name ? `${pick(L.greet)} ${L.saved_name(name)}` : pick(L.greet);
        const tail = [pick(L.howare), pick(L.ask_name)].join(" ");
        return `${head} ${tail}`;
      }
      case "howare": {
        const city = recall("city");
        const head = pick(L.howare);
        const plus = city ? L.saved_city(city) : pick(L.ask_city);
        return `${head} ${plus}`;
      }
      case "good":
        return `${pick(L.good)} ${pick(L.followups)}`;
      case "bad":
        return `${pick(L.bad)} ${pick(L.followups)}`;
      case "thanks":
        return `${pick(L.thanks)} ${pick(L.smalltalk)}`;
      case "bye":
        return pick(L.bye);
      case "name": {
        const n = intent.value.charAt(0).toUpperCase() + intent.value.slice(1);
        remember("name", n);
        return L.saved_name(n) + " " + pick(L.followups);
      }
      case "city": {
        const c = intent.value ? intent.value.replace(/['`"]/g,"") : "";
        remember("city", c);
        return L.saved_city(c) + " " + pick(L.followups);
      }
      default: {
        if (text.length <= 10) {
          return `${pick(L.greet)} ${pick(L.howare)}`;
        }
        return "";
      }
    }
  }

  function handleSmalltalk(msg) {
    const lang = msg.lang || global.YanlikLang?.detectLanguage(msg.text) || "tr";
    const intent = detectIntent(msg.text, lang);
    if (intent.intent === "command") return false;
    const reply = compose(intent, lang, msg.text);
    if (!reply) return false;
    global.YanlikCore.assistantReply(reply, { mode: "smalltalk", lang, intent: intent.intent });
    return true;
  }

  YanlikBus.on("user:send", (msg) => {
    try {
      const handled = handleSmalltalk(msg);
      if (handled) return;
    } catch (e) {
      console.error("[Smalltalk] error:", e);
    }
  });

  global.YanlikSmalltalk = { detectIntent, compose, handleSmalltalk, version: VERSION };
  console.log("Yanlik Smalltalk loaded:", VERSION);
})(window);