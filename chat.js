// chat.js — Yanlik v2 (statik, API yok)
// Özellikler:
// - Konuşma listesi (oluştur, yeniden adlandır, sil, kopyala)
// - Mesaj balonları, zaman damgası, kopyala, sil
// - Enter→Gönder / Shift+Enter→Satır (ayar kontrollü)
// - Yazıyor… göstergesi, gönderme sesi
// - Dışa/İçe aktarma (JSON)
// - Basit “akıllı” yanıt motoru (anahtar kelime kuralları + şablonlar)
// - i18n yerinde kalır (i18n.js yüklü)

(function(){
  // ------- yardımcılar -------
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  const fmt = (d)=> new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'}).format(d);
  const esc = (s)=> s.replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  const uid = ()=> Math.random().toString(36).slice(2,10);

  // ------- state erişimi -------
  const getSettings = ()=> window.__yanlik?.getSettings?.() || {
    theme:"system", language:"tr", memory:true, typingIndicator:true,
    sendSound:false, sendBehavior:"enter", temperature:0.7, systemPrompt:""
  };

  // ------- DOM -------
  const chatList = $("#chatList");
  const input = $("#messageInput");
  const sendBtn = $("#sendBtn");
  const clearBtn = $("#clearBtn");
  const typingEl = $("#typing");
  const titleEl = $("#threadTitle");
  const statusPill = $("#statusPill");
  const newChatBtn = $("#newChatBtn");
  const threadList = $("#threadList");
  const exportBtn = $("#exportBtn");
  const importBtn = $("#importBtn");
  const importFile = $("#importFile");

  // modal kısayol
  const modal = $("#settingsModal");
  const m = {
    theme: $("#m_theme"), language: $("#m_language"), memory: $("#m_memory"),
    typingIndicator: $("#m_typingIndicator"), sendSound: $("#m_sendSound"),
    sendBehavior: $("#m_sendBehavior"), temperature: $("#m_temperature"),
    systemPrompt: $("#m_systemPrompt"),
    open: $("#settingsOpen"), close: $("#settingsClose"),
    save: $("#m_save"), reset: $("#m_reset")
  };

  // ------- büyütülmüş “konuşmalar” store’u -------
  const store = window.__yanlikThreads = {
    key: "yanlik.threads.v2",
    read(){
      try{
        const raw = localStorage.getItem(this.key);
        if(!raw) return { active:null, items:[] };
        const data = JSON.parse(raw);
        if(!data.items) data.items = [];
        return data;
      }catch{ return { active:null, items:[] }; }
    },
    write(data){ localStorage.setItem(this.key, JSON.stringify(data)); },
    ensureFirst(){
      const db = this.read();
      if(db.items.length===0){
        const id = uid();
        db.items.push({ id, name:"Yeni Konuşma", messages:[] });
        db.active = id;
        this.write(db);
      }
    },
    active(){ return this.read().active; },
    setActive(id){ const db=this.read(); db.active=id; this.write(db); },
    list(){ return this.read().items; },
    get(id){ return this.list().find(x=>x.id===id) || null; },
    saveThread(thread){
      const db=this.read();
      const i=db.items.findIndex(x=>x.id===thread.id);
      if(i>-1) db.items[i]=thread; else db.items.push(thread);
      this.write(db);
    },
    newThread(){
      const db=this.read();
      const id=uid();
      db.items.unshift({ id, name:"Yeni Konuşma", messages:[] });
      db.active=id; this.write(db);
      return id;
    },
    rename(id, name){
      const db=this.read();
      const t=db.items.find(x=>x.id===id); if(!t) return;
      t.name = name || "Adsız"; this.write(db);
    },
    remove(id){
      const db=this.read();
      db.items = db.items.filter(x=>x.id!==id);
      if(db.active===id) db.active = db.items[0]?.id || null;
      this.write(db);
    },
    clearMessages(id){
      const t=this.get(id); if(!t) return;
      t.messages=[]; this.saveThread(t);
    },
    pushMessage(id, msg){
      const t=this.get(id); if(!t) return;
      t.messages.push(msg); this.saveThread(t);
    }
  };

  // ------- renderers -------
  function renderThreads(){
    const db = store.read();
    threadList.innerHTML = "";
    db.items.forEach(t=>{
      const row = document.createElement("div");
      row.className = "thread";
      row.dataset.id = t.id;
      row.innerHTML = `
        <div class="name" title="${esc(t.name)}">${esc(t.name)}</div>
        <div class="mini">${t.messages.length} msj</div>
        <div class="ops">
          <button class="btn ghost btn-rename">Ad</button>
          <button class="btn ghost btn-copy">Kopya</button>
          <button class="btn ghost btn-del">Sil</button>
        </div>`;
      row.addEventListener("click", (e)=>{
        if(e.target.closest(".ops")) return;
        store.setActive(t.id); loadActive();
      });
      $(".btn-rename",row).addEventListener("click",(e)=>{
        e.stopPropagation();
        const name = prompt("Konuşma adı:", t.name) || t.name;
        store.rename(t.id,name); renderThreads(); if(store.active()===t.id) titleEl.textContent=name;
      });
      $(".btn-copy",row).addEventListener("click",(e)=>{
        e.stopPropagation();
        const copy = { ...t, id: uid(), name: t.name+" (kopya)" };
        const db = store.read(); db.items.unshift(copy); store.write(db); renderThreads();
      });
      $(".btn-del",row).addEventListener("click",(e)=>{
        e.stopPropagation();
        if(confirm("Bu konuşma silinsin mi?")){ store.remove(t.id); renderThreads(); loadActive(); }
      });
      if(store.active()===t.id) row.style.outline = "2px solid var(--border)";
      threadList.appendChild(row);
    });
  }

  function renderMessages(thread){
    chatList.innerHTML = "";
    thread.messages.forEach(m=> appendMsgEl(m.role,m.text,new Date(m.time)));
    chatList.scrollTop = chatList.scrollHeight;
    titleEl.textContent = thread.name;
  }

  function appendMsgEl(role, text, time=new Date()){
    const item = document.createElement("div");
    item.className = `msg msg-${role}`;
    item.innerHTML = `
      <div class="body">${linkifyMarkdown(esc(text))}</div>
      <div class="meta">${role==="user"?"Sen":"Yanlik"} • ${fmt(time)}
        <span class="ops">
          <button class="btn ghost btn-copy">Kopyala</button>
          <button class="btn ghost btn-del">Sil</button>
        </span>
      </div>`;
    $(".btn-copy",item).addEventListener("click",()=> navigator.clipboard.writeText(text).catch(()=>{}));
    $(".btn-del",item).addEventListener("click",()=>{
      item.remove(); // görsel sil
      // store'dan da temizle
      const t = store.get(store.active());
      const ix = t.messages.findIndex(m=> m._id === item._id);
      if(ix>-1){ t.messages.splice(ix,1); store.saveThread(t); }
    });
    // mesaj id'si (store eşleştirme)
    item._id = uid();
    chatList.appendChild(item);
    return item;
  }

  // minimal markdown linkifier (http/https)
  function linkifyMarkdown(s){
    return s
      .replace(/```([\s\S]*?)```/g, (m,code)=> `<pre><code>${code}</code></pre>`)
      .replace(/`([^`]+)`/g, (m,code)=> `<code>${code}</code>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/(https?:\/\/[^\s)]+)(?![^<]*>)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  // ------- typing + ses -------
  let audioCtx=null;
  function playBeep(){
    if(!getSettings().sendSound) return;
    try{
      if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.type="triangle"; o.frequency.value=880; g.gain.value=.06;
      o.connect(g); g.connect(audioCtx.destination); o.start();
      setTimeout(()=>{ o.stop(); o.disconnect(); g.disconnect(); },100);
    }catch{}
  }
  function showTyping(on){
    if(!getSettings().typingIndicator) return;
    typingEl.style.display = on ? "block" : "none";
    typingEl.textContent = on ? "Yazıyor…" : "";
  }

  // ------- “Akıllı” yanıt motoru (kurallı) -------
  function smartReply(user, ctx){
    const t = getSettings().temperature;
    const lower = user.toLowerCase();
    // basit niyetler
    if(/^(selam|merhaba|hi|hey)\b/.test(lower)) return "Merhaba! Nasıl yardımcı olabilirim?";
    if(/\bhava\b/.test(lower)) return "Hava durumunu çevrimdışı bilemiyorum; ama istersen şehir yaz, örnek: “Ankara hava”.";
    if(/\bankara hava\b/.test(lower)) return "Ankara: API yokken tahmin yapamam; ama hava uygulamana bakmanı öneririm.";
    if(/\bsaat kaç\b/.test(lower)) return `Saat: ${fmt(new Date())}`;
    if(/\b(temizle|clear)\b/.test(lower)) return "Üstteki “Temizle” ile tüm konuşma mesajlarını silebilirsin.";
    if(/\b(ayar|settings)\b/.test(lower)) return "Ayarlar için sağ üstten “Ayarlar” butonuna tıkla. Tema, dil, ses vb. var.";
    // “özetle” basit şablon
    if(/^özet(le)?\b/.test(lower)){
      const last = ctx.slice(-4).map(m=> (m.role==="user"?"Sen: ":"Yanlik: ")+m.text).join("\n");
      return last ? "Son konuşmanın özeti:\n" + last : "Özetlenecek içerik bulamadım.";
    }
    // eko + sıcaklık etiketi
    const tag = t>=0.8?"💡":t<=0.3?"📌":"✨";
    return `${tag} ${user.length>180 ? user.slice(0,180)+"…" : user}`;
  }

  // ------- gönderim akışı -------
  async function sendMessage(){
    const text = (input.value||"").replace(/\s+/g," ").trim();
    if(!text) return;
    sendBtn.disabled = true; status("Gönderiliyor…");
    appendAndStore("user", text);
    playBeep();
    input.value=""; input.focus(); refreshSendState();

    try{
      showTyping(true);
      await sleep(350 + Math.random()*450);
      // bağlam: son 10 mesaj
      const ctx = (store.get(store.active())?.messages || []).slice(-10);
      const reply = smartReply(text, ctx);
      appendAndStore("assistant", reply);
    } finally {
      showTyping(false);
      status("Hazır");
      sendBtn.disabled = false;
    }
  }

  function appendAndStore(role,text){
    const now = new Date();
    const el = appendMsgEl(role,text,now);
    const id = store.active();
    const t = store.get(id);
    const msg = { _id: el._id, role, text, time: now.toISOString() };
    store.pushMessage(id, msg);
    // otomatik başlık
    if(t.name==="Yeni Konuşma" && role==="user"){
      const name = text.slice(0,32) + (text.length>32?"…":"");
      store.rename(id,name); titleEl.textContent=name; renderThreads();
    }
    chatList.scrollTop = chatList.scrollHeight;
  }

  // ------- UI bağları -------
  function refreshSendState(){
    const val=(input.value||"").trim();
    sendBtn.disabled = val.length===0;
  }
  input.addEventListener("input", refreshSendState);
  input.addEventListener("keydown",(e)=>{
    const s=getSettings();
    if(s.sendBehavior==="enter"){
      if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendMessage(); }
    } else {
      if(e.key==="Enter" && e.ctrlKey){ e.preventDefault(); sendMessage(); }
    }
  });
  sendBtn.addEventListener("click", sendMessage);

  clearBtn.addEventListener("click", ()=>{
    if(!confirm("Bu konuşmadaki tüm mesajlar silinsin mi?")) return;
    const id=store.active(); store.clearMessages(id); loadActive();
  });

  newChatBtn.addEventListener("click", ()=>{ store.newThread(); renderThreads(); loadActive(); });

  // export / import
  exportBtn.addEventListener("click", ()=>{
    const data = store.read();
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="yanlik_threads.json"; a.click();
    URL.revokeObjectURL(url);
  });
  importBtn.addEventListener("click", ()=> importFile.click());
  importFile.addEventListener("change", (e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    const fr=new FileReader();
    fr.onload = ()=>{
      try{
        const data = JSON.parse(fr.result);
        if(!data || !Array.isArray(data.items) && !Array.isArray(data.threads)) throw 0;
        // Eski/alternatif şema desteği
        const normalized = data.items ? data : { active:null, items:data.threads||[] };
        localStorage.setItem(store.key, JSON.stringify(normalized));
        renderThreads(); loadActive();
        alert("Konuşmalar içe aktarıldı.");
      }catch{ alert("Geçersiz dosya."); }
    };
    fr.readAsText(file);
  });

  // modal
  m.open.addEventListener("click", ()=>{ fillModalFromSettings(); modal.showModal(); });
  m.close.addEventListener("click", ()=> modal.close());
  m.reset.addEventListener("click",(e)=>{
    e.preventDefault();
    const DEF=window.__yanlik?.DEFAULTS || {};
    setModal(DEF);
  });
  m.save.addEventListener("click",(e)=>{
    e.preventDefault();
    const next = modalValues();
    window.__yanlik?.setSettings?.(next);
    applyTheme(next.theme);
    modal.close();
  });

  // ------- tema & ayarlar sync -------
  function applyTheme(theme){
    const root=document.documentElement;
    const sysDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme==="dark" || (theme==="system" && sysDark);
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  }
  window.__yanlik?.onSettingsChange?.((s)=> applyTheme(s.theme));
  applyTheme(getSettings().theme);

  function fillModalFromSettings(){
    const s=getSettings();
    m.theme.value=s.theme; m.language.value=s.language; m.memory.checked=!!s.memory;
    m.typingIndicator.checked=!!s.typingIndicator; m.sendSound.checked=!!s.sendSound;
    m.sendBehavior.value=s.sendBehavior; m.temperature.value=String(s.temperature);
    m.systemPrompt.value=s.systemPrompt||"";
  }
  function setModal(s){
    m.theme.value=s.theme||"system"; m.language.value=s.language||"tr";
    m.memory.checked=!!s.memory; m.typingIndicator.checked=!!s.typingIndicator;
    m.sendSound.checked=!!s.sendSound; m.sendBehavior.value=s.sendBehavior||"enter";
    m.temperature.value=String(s.temperature ?? 0.7); m.systemPrompt.value=s.systemPrompt||"";
  }
  function modalValues(){
    return {
      theme:m.theme.value, language:m.language.value, memory:m.memory.checked,
      typingIndicator:m.typingIndicator.checked, sendSound:m.sendSound.checked,
      sendBehavior:m.sendBehavior.value, temperature:Number(m.temperature.value),
      systemPrompt:m.systemPrompt.value.trim()
    };
  }

  // ------- yükleme -------
  function loadActive(){
    store.ensureFirst();
    const id = store.active();
    const t = store.get(id);
    if(!t){ store.ensureFirst(); return loadActive(); }
    renderThreads();
    renderMessages(t);
    titleEl.textContent = t.name;
  }

  function status(s){ statusPill.textContent = "● " + s; }

  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

  // init
  loadActive();
  refreshSendState();
})();