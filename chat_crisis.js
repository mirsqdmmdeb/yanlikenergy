/* ============================================================
   YANLIK 5.0 • Crisis & Safety Module (chat_crisis.js)
   Self-harm / violence hints → safe redirection + admin notice
   Requires: chat_core.js, chat_lang.js
   ============================================================ */

(function (global) {
  "use strict";
  const VERSION = "5.0-crisis";

  const Crisis = {
    // diller arası anahtar kelime kümeleri
    dict: {
      tr: [
        "intihar", "kendime zarar", "bıçak", "ölmek istiyorum", "yaşamak istemiyorum",
        "kendimi öldür", "canıma kıy", "ölmek", "dayanamıyorum"
      ],
      en: [
        "suicide", "kill myself", "end my life", "self harm", "hurt myself",
        "i want to die", "i can't go on", "i can't handle"
      ],
      es: ["suicidio", "matarme", "herirme", "quiero morir"],
      de: ["selbstmord", "mich umbringen", "ich will sterben"],
      fr: ["suicide", "me tuer", "je veux mourir"]
    },

    // ülkeye göre kısa güvenli yönlendirme metinleri
    safeText(lang = "tr") {
      const L = lang.startsWith("tr") ? "tr" : "en";
      if (L === "tr") {
        return [
          "Şu an kendine zarar verme düşüncelerin varsa lütfen **hemen 112’yi ara** veya en yakın acil servise git.",
          "Ayrıca **183** (Sosyal Destek) hattını arayabilirsin. Yalnız değilsin—güvenliğin birinci öncelik.",
        ].join(" ");
      }
      return [
        "If you are thinking about harming yourself, please **call local emergency services now** or go to the nearest emergency department.",
        "You are not alone—your safety matters most.",
      ].join(" ");
    },

    isCrisisText(text, lang) {
      if (!text) return false;
      const lo = text.toLowerCase();
      const set = (this.dict[lang] || []).concat(this.dict.en);
      return set.some((k) => lo.includes(k));
    },

    respond(msg) {
      const lang = msg.lang || global.YanlikLang?.detectLanguage(msg.text) || "tr";
      const out = this.safeText(lang);
      global.YanlikCore.assistantReply(out, { mode: "crisis", lang, final: true });

      // admin bildirimi (frontend demo: console + local telemetry)
      try {
        const tKey = "yanlik.telemetry";
        const t = JSON.parse(localStorage.getItem(tKey) || "[]");
        t.push({ id: "cr_" + Date.now(), event: "crisis.detected", sample: msg.text.slice(0, 140), ts: new Date().toISOString() });
        localStorage.setItem(tKey, JSON.stringify(t));
        console.warn("[YANLIK][CRISIS] Possible crisis detected:", msg.text);
      } catch {}
    },
  };

  // Empati modülünden gelen ipuçlarını yakala
  YanlikBus.on("empathy:crisisHint", ({ msg }) => {
    Crisis.respond(msg);
  });

  // Kullanıcı mesajını baştan tarayalım (empati tetiklemeden önce yakalayabilir)
  YanlikBus.on("user:send", (msg) => {
    const lang = msg.lang || global.YanlikLang?.detectLanguage(msg.text) || "tr";
    if (Crisis.isCrisisText(msg.text, lang)) {
      Crisis.respond(msg);
    }
  });

  console.log("Yanlik Crisis loaded:", VERSION);
  global.YanlikCrisis = Crisis;
})(window);