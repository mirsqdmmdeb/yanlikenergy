/* ============================================================
   YANLIK 5.1 • Empathy Module (chat_empathetic.js)
   Multilingual, emotion-aware supportive responses
   Requires: chat_core.js, chat_lang.js
   ============================================================ */

(function (global) {
  "use strict";
  const VERSION = "5.1-empathy";

  const CFG = {
    minDelayMs: 350,
    maxDelayMs: 1200,
    maxReflectLen: 140,
    enableProbing: true,
    enableCopingTips: true,
    enableNormalization: true,
    langFallback: "tr",
    crisisHints: [
      "intihar","kendime zarar","yaşamak istemiyorum","ölmek istiyorum",
      "suicide","kill myself","self-harm","hurt myself","me quiero morir","ich will sterben"
    ],
    neutralBlock: ["ok","tamam","merhaba","selam","hi","hello","hey","sa","naber","nbr","eyvallah"]
  };

  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sanitize = (s) => (s || "").replace(/\s+/g, " ").trim();
  const short = (t, n = CFG.maxReflectLen) => t.length <= n ? t : t.slice(0, n - 1) + "…";
  const hasHint = (txt) => CFG.crisisHints.some(k => (txt||"").toLowerCase().includes(k));

  const PK = {
    tr: {
      ack: [
        "Seni duyuyorum; bu gerçekten yorucu olabilir.",
        "Paylaştığın için teşekkür ederim; kolay olmadığını biliyorum.",
        "Buradasın ve anlatıyorsun—bu değerli."
      ],
      reflect: (u) => `Şuna benzer mi: “${short(u)}”?`,
      validate: [
        "Böyle hissetmen anlaşılır.",
        "Şartlara bakınca çok normal.",
        "Bunu fark etmen başlı başına bir adım."
      ],
      normalize: [
        "Zorlanmak insana dairdir; yalnız değilsin.",
        "Duygular yoğun ve geçici olabilir; böyle hissetmen normal."
      ],
      offer: [
        "İstersen küçük ve yapılabilir bir plan çıkaralım.",
        "Adım adım gidebiliriz—en küçük sonraki adımı seçelim mi?",
        "İstersen kısa bir nefes egzersizi anlatabilirim."
      ],
      probe: [
        "Bu his ne zaman başladı; tetikleyen bir şey oldu mu?",
        "Şu an en çok ne değişse iyi gelir?",
        "Bugün için %1’lik küçük bir iyileştirme ne olabilir?"
      ],
      coping: [
        "4-7-8 nefes: 4 al, 7 tut, 8 ver ×4.",
        "Topraklanma 5-4-3-2-1: 5 gör, 4 dokun, 3 ses, 2 koku, 1 tat.",
        "10 dakikalık mikro-plan seç; bitince küçük ödül."
      ],
      close: [
        "Hazırsan beraber devam edebiliriz; ben buradayım.",
        "Küçük adımlarla ilerleriz.",
        "Şimdi gerçekçi bir hedef belirleyelim mi?"
      ]
    },
    en: {
      ack: ["I hear you; this can be exhausting.", "Thanks for sharing; it’s not easy.", "You’re here and opening up—that matters."],
      reflect: (u) => `Is it something like: “${short(u)}”?`,
      validate: ["Your feelings make sense.", "Given the situation, it’s normal.", "Noticing this is already a step."],
      normalize: ["Struggling is human; you’re not alone.", "Feelings can be intense and temporary."],
      offer: ["We can craft a small, doable plan.", "Step by step—shall we pick the tiniest next step?", "I can guide a short breathing exercise."],
      probe: ["When did this start—was there a trigger?", "What change would help most now?", "What’s a 1% improvement for today?"],
      coping: ["4-7-8 breathing ×4.", "5-4-3-2-1 grounding.", "Pick a 10-minute micro-task."],
      close: ["If you’re ready, we can continue—I'm here.", "We’ll go with small steps.", "Shall we set a realistic goal now?"]
    }
  };
  const pack = (lang) => PK[lang] || PK.en;

  function composeEmpathicReply(userText, lang, emotion) {
    const P = pack(lang);
    const s = [];

    s.push(pick(P.ack));
    if (userText) s.push(P.reflect(userText));
    s.push(pick(P.validate));
    if (CFG.enableNormalization && P.normalize) s.push(pick(P.normalize));

    if (emotion) {
      const e = (emotion + "").toLowerCase();
      if (["üzgün","sad"].includes(e)) {
        s.push(lang==="tr" ? "Küçük ve güvenli bir adımla başlayabiliriz." : "Let’s start with a small, safe step.");
      } else if (["sinirli","angry"].includes(e)) {
        s.push(lang==="tr" ? "Önce bedeni sakinleştirmek zihni de rahatlatır." : "Calming the body can help settle the mind.");
      }
    }

    s.push(pick(P.offer));
    if (CFG.enableCopingTips && P.coping) s.push(pick(P.coping));
    if (CFG.enableProbing) s.push(pick(P.probe));
    s.push(pick(P.close));

    return sanitize(s.join(" "));
  }

  async function respondEmpathically(msg) {
    try {
      const lang = msg.lang || global.YanlikLang?.detectLanguage(msg.text) || CFG.langFallback;
      const emo = msg.emotion || global.YanlikLang?.detectEmotion(msg.text, lang) || "neutral";

      // Pozitif + çok kısa/nötr durumları empati yerine hafif cevapla kapatalım
      const t = (msg.text || "").trim().toLowerCase();
      if (t.length < 3 || CFG.neutralBlock.includes(t)) return; // smalltalk zaten cevapladı
      if (["mutlu","happy"].includes(emo)) {
        const alt = lang === "tr"
          ? "Ne güzel! 😊 Böyle şeyler duymak beni de mutlu ediyor."
          : "Nice! 😊 Hearing that makes me happy too.";
        global.YanlikCore.assistantReply(alt, { mode:"friendly", lang, emotion:emo });
        return;
      }

      if (hasHint(msg.text)) {
        YanlikBus.emit("empathy:crisisHint", { msg, lang, emo });
        return;
      }

      const reply = composeEmpathicReply(msg.text, lang, emo);
      const delay = Math.max(200, Math.min(rand(CFG.minDelayMs, CFG.maxDelayMs), 1500));
      await new Promise(r => setTimeout(r, delay));
      global.YanlikCore.assistantReply(reply, { mode: "empathetic", lang, emotion: emo });
    } catch (e) {
      console.error("[Empathy] respond error:", e);
      global.YanlikCore.assistantReply(
        "Şu an yanıt verirken zorlandım ama buradayım; tekrar dener misin?",
        { mode: "empathetic-fallback", lang: "tr" }
      );
    }
  }

  YanlikBus.on("user:send", (msg) => {
    try {
      const text = (msg.text || "").trim();
      if (text.startsWith("/")) return; // komutları başka modül alır
      // Smalltalk önce çalışır; burada sadece gerekli durumlarda cevaplarız
      global.YanlikCore.queue.push(() => respondEmpathically(msg));
    } catch (e) {
      console.error("[Empathy] bus error:", e);
    }
  });

  global.YanlikEmpathy = { compose: composeEmpathicReply, respond: respondEmpathically, version: VERSION };
  console.log("Yanlik Empathy loaded:", VERSION);
})(window);