/* ============================================================
   YANLIK 5.0 • Empathy Module (chat_empathetic.js)
   Multilingual, emotion-aware supportive responses
   Requires: chat_core.js, chat_lang.js
   ============================================================ */

(function (global) {
  "use strict";
  const VERSION = "5.0-empathy";

  // ------- Config -------
  const CFG = {
    minDelayMs: 350,
    maxDelayMs: 1200,
    maxReflectLen: 140,
    enableProbing: true,
    enableCopingTips: true,
    enableNormalization: true,
    langFallback: "en",
    // bu anahtar kelimeler görülürse kriz modülüne sinyal gönderir (ayrık kriz modülü yine kontrol edecek)
    crisisHints: [
      "intihar", "kendime zarar", "yaşamak istemiyorum", "ölmek istiyorum",
      "suicide", "kill myself", "self-harm", "hurt myself",
      "me quiero morir", "ich will sterben"
    ],
  };

  // ------- Utils -------
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sanitize = (s) => (s || "").replace(/\s+/g, " ").trim();

  const short = (t, n = CFG.maxReflectLen) =>
    t.length <= n ? t : t.slice(0, n - 1) + "…";

  const hasHint = (txt) => {
    const lo = (txt || "").toLowerCase();
    return CFG.crisisHints.some((k) => lo.includes(k));
  };

  // ------- Language Packs -------
  // Not: Basit şablonlar; dil modülün (chat_lang.js) tespitiyle çalışır.
  const PK = {
    tr: {
      ack: [
        "Seni duyuyorum, bunu hissetmenin zor olduğunu anlıyorum.",
        "Bunu paylaştığın için teşekkür ederim; kolay olmadığını biliyorum.",
        "Buradasın ve anlatıyorsun—bu değerli."
      ],
      reflect: (user) => `Şöyle mi hissediyorsun: “${short(user)}”?`,
      validate: [
        "Böyle hissetmen çok anlaşılır.",
        "Koşullara bakınca bu duyguların olması normal.",
        "Kendini suçlamadan fark etmen güzel bir adım."
      ],
      normalize: [
        "Zorlanmak, kırılmak insana dairdir; yalnız değilsin.",
        "Bu duygular gelip geçici olabilir; şu an yoğun hissetmen normal."
      ],
      offer: [
        "İstersen küçük, yapılabilir bir plan çıkaralım.",
        "Birlikte adım adım bakabiliriz—önce en küçük adımı seçelim mi?",
        "İstersen nefes egzersizi ya da kısa bir odaklanma denemesi anlatabilirim."
      ],
      probe: [
        "Şu an en çok ne değişse iyi gelir sence?",
        "Bu his ne zaman başladı; tetikleyen bir şey oldu mu?",
        "Bugün için seni biraz rahatlatacak ufak bir şey ne olabilir?"
      ],
      coping: [
        "1) 4-7-8 nefes: 4 sn al, 7 sn tut, 8 sn ver; 4 tur.",
        "2) Topraklanma: Etrafında görebildiğin 5 şey, dokunabildiğin 4 şey, duyduğun 3 ses, kokladığın 2 şey, tattığın 1 şey.",
        "3) Mikro-plan: 10 dakikalık tek bir iş seç; bitince küçük ödül."
      ],
      close: [
        "Hazırsan birlikte devam edebiliriz. Ben buradayım.",
        "Küçük adımlar atarak ilerleyebiliriz.",
        "İstersen şimdi bir hedef belirleyelim."
      ]
    },

    en: {
      ack: [
        "I hear you—this sounds genuinely tough.",
        "Thanks for sharing; I know it’s not easy.",
        "You’re here and opening up—that matters."
      ],
      reflect: (user) => `Are you feeling something like: “${short(user)}”?`,
      validate: [
        "Your feelings make sense.",
        "Given the circumstances, it’s completely understandable.",
        "Noticing and naming this is already a step forward."
      ],
      normalize: [
        "Struggling is human—you’re not alone.",
        "Feelings can be intense and temporary; it’s okay to feel this way."
      ],
      offer: [
        "We can craft a small, doable plan.",
        "We can go step by step—shall we pick the smallest next step?",
        "If you want, I can suggest a short breathing exercise."
      ],
      probe: [
        "What change would help most right now?",
        "When did this feeling start—was there a trigger?",
        "What tiny thing could make today 1% easier?"
      ],
      coping: [
        "1) 4-7-8 breathing: inhale 4, hold 7, exhale 8; repeat ×4.",
        "2) Grounding: 5 things you see, 4 you can touch, 3 sounds, 2 smells, 1 taste.",
        "3) Micro-plan: pick a 10-minute task; reward yourself after."
      ],
      close: [
        "If you’re ready, we can continue together—I’m here.",
        "We can move forward with small steps.",
        "We can set one realistic goal now."
      ]
    },

    es: {
      ack: [
        "Te escucho; suena realmente difícil.",
        "Gracias por contarlo; sé que no es fácil.",
        "Estás aquí y compartiendo—eso importa."
      ],
      reflect: (u) => `¿Sientes algo como: “${short(u)}”?`,
      validate: [
        "Tus sentimientos tienen sentido.",
        "Con lo que estás viviendo, es comprensible.",
        "Reconocerlo ya es un paso."
      ],
      normalize: [
        "Luchar es humano; no estás solo/a.",
        "Las emociones pueden ser intensas y temporales."
      ],
      offer: [
        "Podemos crear un plan pequeño y posible.",
        "Paso a paso—¿elegimos el paso más pequeño?",
        "Si quieres, te guío con una respiración breve."
      ],
      probe: [
        "¿Qué cambio ayudaría más ahora?",
        "¿Cuándo empezó esta sensación?",
        "¿Qué cosa pequeña haría el día un 1% mejor?"
      ],
      coping: [
        "1) Respiración 4-7-8.",
        "2) Técnica de enraizamiento 5-4-3-2-1.",
        "3) Micro-plan de 10 minutos."
      ],
      close: [
        "Si quieres, seguimos; estoy aquí.",
        "Avancemos con pasos pequeños.",
        "Podemos fijar una meta realista ahora."
      ]
    },

    de: {
      ack: ["Ich höre dich—das ist wirklich schwer.", "Danke fürs Teilen.", "Du öffnest dich—das zählt."],
      reflect: (u) => `Fühlst du dich in etwa so: „${short(u)}“?`,
      validate: ["Deine Gefühle sind nachvollziehbar.", "Angesichts der Lage ist das verständlich."],
      normalize: ["Kämpfen ist menschlich; du bist nicht allein."],
      offer: ["Wir können einen kleinen, machbaren Plan machen."],
      probe: ["Welche kleine Veränderung würde jetzt helfen?"],
      coping: ["4-7-8-Atmung • 5-4-3-2-1 Grounding • 10-Min-Aufgabe"],
      close: ["Wenn du magst, machen wir weiter."]
    },

    ja: {
      ack: ["お話ししてくれてありがとう。大変でしたね。", "ここにいてくれて、気持ちを伝えてくれてうれしいです。"],
      reflect: (u) => `「${short(u)}」という気持ちでしょうか。`,
      validate: ["その気持ちは自然なことです。"],
      normalize: ["つらい気持ちは誰にでもあります。"],
      offer: ["小さな一歩から一緒に考えましょう。"],
      probe: ["今いちばん変わると助かることは何ですか？"],
      coping: ["4-7-8 呼吸・グラウンディング・10分タスク"],
      close: ["よければ、続けていきましょう。"]
    }
  };

  function packFor(lang) {
    if (PK[lang]) return PK[lang];
    // dil desteklenmiyorsa İngilizceye düş
    return PK[CFG.langFallback] || PK.en;
  }

  // ------- Composer -------
  function composeEmpathicReply(userText, lang, emotion) {
    const P = packFor(lang);
    const pieces = [];

    // 1) Acknowledge
    pieces.push(pick(P.ack));

    // 2) Reflect (özellikle kısa yansıma güven verir)
    if (userText) pieces.push(P.reflect(userText));

    // 3) Validate + Normalize (isteğe bağlı)
    pieces.push(pick(P.validate));
    if (CFG.enableNormalization && P.normalize) pieces.push(pick(P.normalize));

    // 4) Emotion-aware micro tweak
    if (emotion && typeof emotion === "string") {
      const lo = emotion.toLowerCase();
      if (["üzgün", "sad"].includes(lo)) {
        // küçük, nazik öneri
        pieces.push(
          lang === "tr"
            ? "Bu hissi hafifletmek için küçük ve güvenli bir şeyle başlayabiliriz."
            : "We can start with something small and safe to ease this feeling."
        );
      } else if (["sinirli", "angry"].includes(lo)) {
        pieces.push(
          lang === "tr"
            ? "Önce bedeni sakinleştirmek bazen zihni de rahatlatır."
            : "Calming the body first can help the mind settle."
        );
      }
    }

    // 5) Offer help
    pieces.push(pick(P.offer));

    // 6) Coping tips (opsiyonel)
    if (CFG.enableCopingTips && P.coping) pieces.push(pick(P.coping));

    // 7) Probe question (devamı açmak için)
    if (CFG.enableProbing) pieces.push(pick(P.probe));

    // 8) Close
    pieces.push(pick(P.close));

    // tek paragraf halinde, cümle aralarına boşluk
    return sanitize(pieces.join(" "));
  }

  // ------- Orchestrator -------
  async function respondEmpathically(msg) {
    try {
      const lang = msg.lang || global.YanlikLang?.detectLanguage(msg.text) || CFG.langFallback;
      const emo = msg.emotion || global.YanlikLang?.detectEmotion(msg.text, lang) || "neutral";
      const reply = composeEmpathicReply(msg.text, lang, emo);

      // kriz ipucu varsa olayı yayınla (asıl kriz modülü devralır)
      if (hasHint(msg.text)) {
        YanlikBus.emit("empathy:crisisHint", { msg, lang, emo });
      }

      // “yazıyor” efekti için gecikmeli gönder (queue ile çakışmaz)
      const delay = clamp(rand(CFG.minDelayMs, CFG.maxDelayMs), 200, 1500);
      await new Promise((r) => setTimeout(r, delay));
      global.YanlikCore.assistantReply(reply, { mode: "empathetic", lang, emotion: emo });
    } catch (e) {
      console.error("[Empathy] respond error:", e);
      global.YanlikCore.assistantReply(
        "Şu an yanıt verirken zorlandım ama buradayım; tekrar dener misin?",
        { mode: "empathetic-fallback", lang: "tr" }
      );
    }
  }

  // ------- Wiring to Event Bus -------
  // Kullanıcı mesajı geldiğinde empatik mod varsayılan olarak devrede.
  YanlikBus.on("user:send", (msg) => {
    // Diğer modüller (practical/command) devreye girmediyse empati yanıtla
    // Basit bir devre: soru/komut değilse empati; soru ise yine empati + yönlendirme olabilir.
    const text = (msg.text || "").trim();
    const isCommand = text.startsWith("/");
    if (isCommand) return; // komutları başka modüller ele alsın

    // Çok kısa ve nötr mesajlarda empati tetiklemeyelim (ör: "ok")
    if (text.length < 2) return;

    // Empati yanıtını kuyruğa koy (diğer üretimler ile yarışmasın)
    global.YanlikCore.queue.push(() => respondEmpathically(msg));
  });

  // Dışarı aktarım (gerekirse manuel çağırmak için)
  global.YanlikEmpathy = {
    compose: composeEmpathicReply,
    respond: respondEmpathically,
    version: VERSION,
  };

  console.log("Yanlik Empathy loaded:", VERSION);
})(window);