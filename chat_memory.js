/* ============================================================
   YANLIK 5.0 • Memory Module (chat_memory.js)
   Topic tagging • fast summary • lightweight context memory
   Requires: chat_core.js, chat_lang.js
   ============================================================ */

(function (global) {
  "use strict";
  const VERSION = "5.0-memory";
  const KEY = "yanlik.memory.state";

  const MAX_CTX = 24;      // son kaç mesajı bağlamda tutalım
  const MAX_SNIPPET = 80;  // özet parçaları
  const SAVE_WINDOW = 90 * 1000; // 90 sn'de bir snapshot

  const Topics = [
    { tag: "duygu", kw: ["üzgün","moral","mutlu","sinir","panik","anxious","sad","happy","angry"]},
    { tag: "okul",  kw: ["ders","ödev","sınav","quiz","lecture","hocam","not","assignment","exam"]},
    { tag: "iş",    kw: ["iş","mesai","toplantı","deadline","project","deploy","bug","ticket"]},
    { tag: "sağlık", kw:["hastane","hekim","ilaç","ağrı","şeker","tansiyon","bp","pulse","migren"]},
    { tag: "spor",  kw: ["spor","gym","koşu","set","tekrar","kardiyo","protein","bench"]},
    { tag: "genel", kw: [] }
  ];

  function nowIso(){ return new Date().toISOString(); }
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"{}"); }catch{return {};} }
  function save(obj){ try{ localStorage.setItem(KEY, JSON.stringify(obj)); }catch{} }
  function clip(s,n){ return s.length<=n? s : s.slice(0,n-1)+"…"; }

  function tagFor(text){
    const t = text.toLowerCase();
    for(const tdef of Topics){
      if(tdef.kw.some(k=>t.includes(k))) return tdef.tag;
    }
    return "genel";
  }

  function summarize(messages, lang="tr"){
    // çok hızlı, yüzeysel özet: son N mesajdan user & assistant cümlelerinden kırp
    const take = messages.slice(-Math.min(messages.length, MAX_CTX));
    const lines = [];
    for(const m of take){
      const who = m.role === "user" ? (lang==="en"?"U":"K") : (lang==="en"?"A":"Y");
      const snip = clip((m.text||"").replace(/\s+/g," "), MAX_SNIPPET);
      if(!snip) continue;
      lines.push(`${who}:${snip}`);
      if(lines.length>=8) break;
    }
    return lines.join(" | ");
  }

  // küçük bilgi depolama (anahtar-değer)
  function rememberKV(k,v){
    const s = load();
    s.kv = s.kv || {};
    s.kv[k] = v;
    s.updatedAt = nowIso();
    save(s);
  }
  function recallKV(k){
    const s = load();
    return s.kv?.[k] || null;
  }

  // konuşma snapshot
  function snapshotConversation(conv){
    const lang = (conv.messages.slice(-1)[0]?.lang) || "tr";
    const topic = tagFor(conv.messages.slice(-1)[0]?.text || "");
    const sum = summarize(conv.messages, lang);
    const s = load();
    s.snapshots = s.snapshots || [];
    s.snapshots.unshift({ id: conv.id, at: nowIso(), topic, summary: sum });
    s.snapshots = s.snapshots.slice(0, 50);
    s.updatedAt = nowIso();
    save(s);
  }

  // — Bus wiring —
  let lastSaved = 0;

  YanlikBus.on("assistant:reply", ()=>{
    const conv = global.YanlikCore.current || global.YanlikStorage.load(global.YanlikStorage.list().slice(-1)[0]);
    if(!conv) return;
    const now = Date.now();
    if(now - lastSaved > SAVE_WINDOW){
      snapshotConversation(conv);
      lastSaved = now;
    }
  });

  // dışa aktarım
  global.YanlikMemory = {
    tagFor, summarize, rememberKV, recallKV, snapshotConversation, version: VERSION
  };

  console.log("Yanlik Memory loaded:", VERSION);
})(window);