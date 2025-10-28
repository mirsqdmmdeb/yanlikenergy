/* ============================================================
   YANLIK 5.0 • Boot & Guard (chat_boot.js)
   Ensures modules loaded • basic health checks • welcome ping
   ============================================================ */

(function (global) {
  "use strict";
  const VERSION = "5.0-boot";

  function assert(name, cond){
    if(!cond) { console.error(`[Yanlik Boot] Missing: ${name}`); throw new Error(`Missing module: ${name}`); }
  }

  function welcome(){
    try{
      const list = global.YanlikStorage.list();
      if(list.length===0){
        const c = global.YanlikCore.createConversation();
        global.YanlikCore.assistantReply("Merhaba! Yeni Yanlik 5.0 yüklemesi tamam. ✨ Normal konuşma, empatik destek ve komutlar için hazırım. (/help)", { mode:"system", lang:"tr" });
      }
    }catch(e){ console.warn("welcome failed", e); }
  }

  function boot(){
    assert("YanlikCore", !!global.YanlikCore);
    assert("YanlikBus", !!global.YanlikBus);
    assert("YanlikLang", !!global.YanlikLang);
    assert("YanlikSmalltalk", !!global.YanlikSmalltalk);
    assert("YanlikEmpathy", !!global.YanlikEmpathy);
    assert("YanlikCrisis", !!global.YanlikCrisis);
    assert("YanlikUI", !!global.YanlikUI);
    assert("YanlikMemory", !!global.YanlikMemory);
    assert("YanlikPlugins", !!global.YanlikPlugins);

    console.log("%cYanlik 5.0 – all modules present ✔", "color:#22b4ff");
    welcome();
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded", boot, { once:true });
  } else {
    boot();
  }

  global.YanlikBoot = { version: VERSION };
})(window);