// chat.js — Neon Tabs Edition (API yok; gelişmiş konuşma + sekme barı)
(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  const esc = (s)=> s.replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  const fmtTime = (d)=> new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'}).format(d||new Date());
  const uid = ()=> Math.random().toString(36).slice(2,10);
  const S = ()=> window.__yanlik?.getSettings?.() || { theme:"neon-blue", typingIndicator:true, sendSound:false, sendBehavior:"enter", temperature:.7, systemPrompt:"" };
  window.__yanlik?.applyTheme?.(S().theme);

  // DOM
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
  const tabBar = $("#tabBar");
  const addTabBtn = $("#addTabBtn");
  const searchInput = $("#searchInput");
  const suggestChips = $$(".chip");
  const multiSelBtn = $("#multiSelBtn");

  // Store: konuşmalar + sekme verisi
  const store = {
    key: "yanlik.threads.v3",
    read(){ try{ return JSON.parse(localStorage.getItem(this.key)) || {active:null, items:[], order:[], pins:{}} } catch { return {active:null, items:[], order:[], pins:{}} } },
    write(d){ localStorage.setItem(this.key, JSON.stringify(d)); },
    ensure(){
      const db=this.read();
      if(db.items.length===0){
        const id=uid();
        db.items=[{id,name:"Yeni Konuşma",messages:[]}];
        db.active=id;
        db.order=[id];
        db.pins={};
        this.write(db);
      }
    },
    list(){ return this.read().items },
    get(id){ return this.list().find(x=>x.id===id)||null },
    active(){ return this.read().active },
    setActive(id){ const db=this.read(); db.active=id; this.write(db); },
    saveThread(t){
      const db=this.read();
      const i=db.items.findIndex(x=>x.id===t.id);
      if(i>-1) db.items[i]=t; else { db.items.unshift(t); db.order.unshift(t.id); }
      this.write(db);
    },
    newThread(name="Yeni Konuşma"){
      const db=this.read(); const id=uid();
      db.items.unshift({id,name, messages:[]});
      db.order.unshift(id);
      db.active=id;
      this.write(db); return id;
    },
    rename(id,name){
      const db=this.read(); const t=db.items.find(x=>x.id===id); if(!t) return;
      t.name=name||"Adsız"; this.write(db);
    },
    remove(id){
      const db=this.read();
      db.items = db.items.filter(x=>x.id!==id);
      db.order = db.order.filter(x=>x!==id);
      delete db.pins[id];
      if(db.active===id) db.active = db.order[0] || db.items[0]?.id || null;
      this.write(db);
    },
    clearMessages(id){
      const t=this.get(id); if(!t) return; t.messages=[]; this.saveThread(t);
    },
    pushMessage(id,msg){
      const t=this.get(id); if(!t) return; t.messages.push(msg); this.saveThread(t);
    },
    order(){ return this.read().order },
    setOrder(arr){ const db=this.read(); db.order=arr; this.write(db); },
    pin(id,on){ const db=this.read(); db.pins = db.pins||{}; db.pins[id]=!!on; this.write(db); },
    isPinned(id){ return !!this.read().pins?.[id]; }
  };

  // UI helpers
  function linkify(s){
    return s
      .replace(/```([\s\S]*?)```/g,(m,c)=>`<pre><code>${c}</code></pre>`)
      .replace(/`([^`]+)`/g,(m,c)=>`<code>${c}</code>`)
      .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g,"<em>$1</em>")
      .replace(/(https?:\/\/[^\s)]+)(?![^<]*>)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function appendMsg(role,text,time=new Date()){
    const item=document.createElement("div");
    item.className=`msg msg-${role} selectable`;
    item.innerHTML = `
      <div class="body">${linkify(esc(text))}</div>
      <div class="meta">${role==="user"?"Sen":"Yanlik"} • ${fmtTime(time)}
        <span class="ops">
          <button class="btn ghost btn-mini btn-edit">Düzenle</button>
          <button class="btn ghost btn-mini btn-copy">Kopyala</button>
          <button class="btn ghost btn-mini btn-del">Sil</button>
        </span>
      </div>`;
    item._id=uid();
    const id=store.active();
    item.querySelector(".btn-copy").onclick=()=>navigator.clipboard.writeText(text).catch(()=>{});
    item.querySelector(".btn-del").onclick=()=>deleteMessage(item._id);
    item.querySelector(".btn-edit").onclick=()=>editMessage(item._id, role, text);
    item.addEventListener("click",(e)=>{
      if(e.target.closest(".ops") || e.target.closest("textarea")) return;
      if(selectMode){
        item.classList.toggle("selected");
      }
    });
    chatList.appendChild(item);
    chatList.scrollTop=chatList.scrollHeight;
    return item;
  }

  function deleteMessage(mid){
    const t=store.get(store.active()); if(!t) return;
    const ix=t.messages.findIndex(m=>m._id===mid); if(ix>-1){ t.messages.splice(ix,1); store.saveThread(t); }
    const el = $(`.msg[data-id="${mid}"]`) || $$(".msg").find(x=>x._id===mid);
    if(el && el.remove) el.remove();
    renderMessages(t); // yeniden çiz (sade)
  }

  function editMessage(mid, role, text){
    // inline edit alanı
    const t=store.get(store.active()); if(!t) return;
    const host = $$(".msg").find(x=>x._id===mid);
    if(!host) return;
    const body = host.querySelector(".body");
    const oldHTML = body.innerHTML;
    body.innerHTML = `<textarea class="msg-edit">${text}</textarea>
      <div class="editbar">
        <button class="btn primary btn-save">Kaydet</button>
        <button class="btn ghost btn-cancel">Vazgeç</button>
        <button class="btn ghost btn-retry">Yeniden üret</button>
      </div>`;
    const ta = host.querySelector(".msg-edit");
    host.querySelector(".btn-cancel").onclick=()=>{ body.innerHTML=oldHTML; };
    host.querySelector(".btn-save").onclick=()=>{
      const val=ta.value.trim(); if(!val){ body.innerHTML=oldHTML; return; }
      // store güncelle
      const ix=t.messages.findIndex(m=>m._id===mid);
      if(ix>-1){ t.messages[ix].text = val; store.saveThread(t); }
      body.innerHTML = linkify(esc(val));
    };
    host.querySelector(".btn-retry").onclick=async()=>{
      // “yeniden üret” (assistant için daha doğal)
      if(role!=="assistant"){ alert("Yeniden üret sadece asistan mesajlarında mantıklı."); return;}
      const ctx=getContext(); // son mesajlar
      const newTxt = smartReply(ta.value || text, ctx);
      ta.value = newTxt;
    };
  }

  // Çoklu seçim
  let selectMode=false;
  multiSelBtn.addEventListener("click",()=>{
    selectMode=!selectMode;
    multiSelBtn.textContent = selectMode? "Sil (Seçilen)" : "Seç";
    if(!selectMode){
      // Sil
      const selected = $$(".msg.selected");
      if(selected.length){
        if(confirm(`${selected.length} mesaj silinsin mi?`)){
          const t=store.get(store.active());
          selected.forEach(el=>{
            const mid=el._id || el.dataset.id;
            const ix=t.messages.findIndex(m=>m._id===mid);
            if(ix>-1) t.messages.splice(ix,1);
            el.remove();
          });
          store.saveThread(t); renderMessages(t);
        }
      }
      $$(".msg.selected").forEach(el=>el.classList.remove("selected"));
    }
  });

  // Hesap makinesi (güvenli)
  function safeCalc(expr){
    if(!/^[\d+\-*/().\s]+$/.test(expr)) return null;
    try{ const fn=new Function(`return (${expr})`); const v=fn(); return Number.isFinite(v)? v : null; }catch{ return null; }
  }

  // Basit bot: komutlar + niyetler + eko
  function smartReply(user, ctx){
    const t=S().temperature;
    const lo=user.toLowerCase().trim();

    // tema komutu
    if(/tema.*neon.*alt[ıi]n/.test(lo)){ window.__yanlik?.setSettings?.({theme:"neon-gold"}); window.__yanlik?.applyTheme?.("neon-gold"); return "Tema **Neon Altın** yapıldı ✨"; }
    if(/tema.*neon.*mavi/.test(lo)){ window.__yanlik?.setSettings?.({theme:"neon-blue"}); window.__yanlik?.applyTheme?.("neon-blue"); return "Tema **Neon Mavi** yapıldı 💎"; }

    if(lo.startsWith("/help")){
      return [
        "**Komutlar**",
        "`/help` yardım",
        "`/clear` konuşmayı temizle",
        "`/title Yeni Ad` sekme/konuşma başlığını değiştir",
        "`/pin` sekmeyi sabitle / `/unpin` çöz",
        "`/calc 12*(3+4)/5` basit hesap",
        "`özetle` son konuşmayı özetle",
        "“tema neon altın/mavi yap” hızlı tema değiştirir"
      ].join("\n");
    }
    if(lo.startsWith("/clear")){ clearCurrent(); return "Konuşma temizlendi."; }
    if(lo.startsWith("/title ")){ const name=user.slice(7).trim()||"Adsız"; store.rename(store.active(),name); renderTabs(); renderThreads(); titleEl.textContent=name; return `Başlık **${name}** olarak güncellendi.`; }
    if(lo.startsWith("/pin")){ store.pin(store.active(),true); renderTabs(); return "Sekme sabitlendi 📌"; }
    if(lo.startsWith("/unpin")){ store.pin(store.active(),false); renderTabs(); return "Sekme sabiti kaldırıldı"; }
    if(lo.startsWith("/calc ")){ const r=safeCalc(user.slice(6).trim()); return r===null? "Geçersiz ifade." : `Sonuç: **${r}**`; }

    if(/^(selam|merhaba|hey|hi)\b/.test(lo)) return "Merhaba! Nasıl yardımcı olabilirim?";
    if(/\bsaat kaç\b/.test(lo)) return `Saat: **${fmtTime(new Date())}**`;
    if(lo.startsWith("özetle")){
      const last = ctx.slice(-8).map(m=> (m.role==="user"?"Sen: ":"Yanlik: ")+m.text).join("\n");
      return last? "Özet:\n"+last : "Özetlenecek içerik yok.";
    }
    const tag = t>=0.8?"💡": t<=0.3?"📌":"✨";
    return `${tag} ${user.length>220? user.slice(0,220)+"…" : user}`;
  }

  // Konuşma göndermek
  async function send(){
    const text=(input.value||"").replace(/\s+/g," ").trim();
    if(!text) return;
    lockSend(true); status("Gönderiliyor…");
    addMessage("user", text);
    input.value=""; input.focus();

    try{
      typing(true); await sleep(320 + Math.random()*480);
      const reply = smartReply(text, getContext());
      addMessage("assistant", reply);
    } finally {
      typing(false); status("Hazır"); lockSend(false);
    }
  }

  function addMessage(role,text){
    const t = store.get(store.active()); if(!t) return;
    const now=new Date(); const el=appendMsg(role,text,now);
    el.dataset.id = el._id; // seçime yardımcı
    t.messages.push({_id: el._id, role, text, time: now.toISOString()});
    store.saveThread(t);
    if(t.name==="Yeni Konuşma" && role==="user"){
      const name = text.slice(0,32) + (text.length>32?"…":"");
      store.rename(t.id,name); titleEl.textContent=name; renderTabs(); renderThreads();
    }
  }

  function getContext(){
    const t=store.get(store.active()); return t? t.messages.slice(-10) : [];
  }

  // Yazıyor + ses
  let audioCtx=null;
  function typing(on){ if(!S().typingIndicator) return; typingEl.style.display=on?"block":"none"; }
  function lockSend(on){ sendBtn.disabled=!!on; }
  function status(s){ statusPill.textContent="● "+s; }
  function beep(){
    if(!S().sendSound) return;
    try{
      if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.type="triangle"; o.frequency.value=880; g.gain.value=.06;
      o.connect(g); g.connect(audioCtx.destination); o.start();
      setTimeout(()=>{o.stop();o.disconnect();g.disconnect();},100);
    }catch{}
  }

  // Sekmeler (tabs)
  function renderTabs(){
    const db=store.read();
    // temizle addTab hariç
    $$(".tab", tabBar).forEach(el=>{ if(el!==addTabBtn) el.remove(); });
    // sıralama: pinli olanlar başta
    const ids = [...db.order];
    ids.sort((a,b)=>{
      const pa=store.isPinned(a), pb=store.isPinned(b);
      if(pa && !pb) return -1; if(pb && !pa) return 1;
      return ids.indexOf(a)-ids.indexOf(b);
    });
    ids.forEach(id=>{
      const t=store.get(id); if(!t) return;
      const el=document.createElement("button");
      el.className="tab"; el.setAttribute("role","tab"); el.draggable=true;
      if(id===db.active) el.classList.add("active");
      el.innerHTML=`
        <span class="pin">${store.isPinned(id)?"📌":""}</span>
        <span class="name" title="${esc(t.name)}">${esc(t.name)}</span>
        <span class="ops">
          <span class="close" title="Kapat">✕</span>
        </span>`;
      el.addEventListener("click",(e)=>{ if(e.target.closest(".close")) return; store.setActive(id); loadActive(); });
      el.querySelector(".close").addEventListener("click",(e)=>{ e.stopPropagation(); if(confirm("Sekme kapatılsın mı?")){ store.remove(id); renderTabs(); renderThreads(); loadActive(); } });

      // sürükle-bırak ile sekme sırası
      el.addEventListener("dragstart",()=>{ el.classList.add("dragging"); el.dataset.drag=id; });
      el.addEventListener("dragend",()=> el.classList.remove("dragging"));
      tabBar.insertBefore(el, addTabBtn);
    });

    // drop mantığı (tabBar üzerinde)
    tabBar.addEventListener("dragover",(e)=>{
      const dragId = $$(".tab.dragging", tabBar)[0]?.dataset.drag; if(!dragId) return;
      e.preventDefault();
      const after = getTabAfter(tabBar, e.clientX);
      const dragging = $$(".tab.dragging", tabBar)[0];
      tabBar.insertBefore(dragging, after || addTabBtn);
    });
    tabBar.addEventListener("drop",()=>{
      const newOrder = $$(".tab", tabBar).filter(x=>x!==addTabBtn).map(x=>{
        const n = x.querySelector(".name")?.getAttribute("title");
        // başlıktan id'yi bulalım
        const db=store.read();
        const it = db.items.find(i=>i.name===n); return it?.id;
      }).filter(Boolean);
      if(newOrder.length) store.setOrder(newOrder);
    });
  }

  function getTabAfter(container, x){
    const els = $$(".tab", container).filter(el=>!el.classList.contains("dragging") && el!==addTabBtn);
    return els.reduce((closest, child)=>{
      const box=child.getBoundingClientRect();
      const offset = x - box.left - box.width/2;
      if(offset<0 && offset>closest.offset){ return {offset, element:child}; } else { return closest; }
    }, {offset:-Infinity, element:null}).element;
  }

  addTabBtn.addEventListener("click", ()=>{ store.newThread(); renderTabs(); renderThreads(); loadActive(); });
  newChatBtn.addEventListener("click", ()=>{ store.newThread(); renderTabs(); renderThreads(); loadActive(); });

  // Sol liste (eski özellikler)
  function renderThreads(){
    const db=store.read();
    threadList.innerHTML="";
    db.items.forEach(t=>{
      const row=document.createElement("div");
      row.className="thread"; row.dataset.id=t.id;
      row.innerHTML=`<div class="name" title="${esc(t.name)}">${esc(t.name)}</div>
                     <div class="mini">${t.messages.length} msj</div>
                     <div class="ops">
                       <button class="btn ghost btn-rename">Ad</button>
                       <button class="btn ghost btn-pin">${store.isPinned(t.id)?"Unpin":"Pin"}</button>
                       <button class="btn ghost btn-del">Sil</button>
                     </div>`;
      row.onclick=(e)=>{ if(e.target.closest(".ops")) return; store.setActive(t.id); loadActive(); };
      row.querySelector(".btn-rename").onclick=(e)=>{ e.stopPropagation(); const name=prompt("Konuşma adı:",t.name)||t.name; store.rename(t.id,name); renderThreads(); renderTabs(); if(store.active()===t.id) titleEl.textContent=name; };
      row.querySelector(".btn-pin").onclick=(e)=>{ e.stopPropagation(); store.pin(t.id,!store.isPinned(t.id)); renderThreads(); renderTabs(); };
      row.querySelector(".btn-del").onclick=(e)=>{ e.stopPropagation(); if(confirm("Silinsin mi?")){ store.remove(t.id); renderThreads(); renderTabs(); loadActive(); } };
      if(store.active()===t.id) row.style.outline="2px solid var(--border)";
      threadList.appendChild(row);
    });
  }

  // Arama
  searchInput.addEventListener("input", ()=>{
    const q = searchInput.value.toLowerCase().trim();
    const t=store.get(store.active()); if(!t){ chatList.innerHTML=""; return; }
    chatList.innerHTML="";
    t.messages.forEach(m=>{
      const text=m.text; const hit = !q || text.toLowerCase().includes(q);
      if(hit){
        const el=appendMsg(m.role,text,new Date(m.time));
        el.dataset.id=m._id;
        if(q){
          // basit highlight
          el.querySelector(".body").innerHTML = linkify(esc(text)).replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,"gi"),"<mark>$1</mark>");
        }
      }
    });
    chatList.scrollTop=chatList.scrollHeight;
  });

  // Öneri çipleri
  suggestChips.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      input.value = (btn.dataset.suggest || "").trim();
      input.focus();
    });
  });

  // Export / Import
  exportBtn.onclick=()=>{
    const data=store.read();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="yanlik_threads.json"; a.click(); URL.revokeObjectURL(url);
  };
  importBtn.onclick=()=>importFile.click();
  importFile.onchange=(e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    const fr=new FileReader();
    fr.onload=()=>{
      try{
        const data=JSON.parse(fr.result);
        if(!data || (!data.items && !data.threads)) throw 0;
        const norm = data.items ? data : {active:null, items:data.threads, order:(data.threads||[]).map(t=>t.id), pins:{}};
        localStorage.setItem(store.key, JSON.stringify(norm));
        renderTabs(); renderThreads(); loadActive(); alert("İçe aktarıldı.");
      }catch{ alert("Geçersiz dosya."); }
    };
    fr.readAsText(f);
  };

  // Composer
  function refreshSend(){ const v=(input.value||"").trim(); sendBtn.disabled = v.length===0; }
  input.addEventListener("input", refreshSend);
  input.addEventListener("keydown",(e)=>{
    const s=S();
    if(s.sendBehavior==="enter"){
      if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); }
    } else {
      if(e.key==="Enter" && e.ctrlKey){ e.preventDefault(); send(); }
    }
  });
  sendBtn.onclick=send;
  clearBtn.onclick=()=>{ if(confirm("Bu konuşmadaki tüm mesajlar silinsin mi?")){ store.clearMessages(store.active()); loadActive(); } };

  // Lifecycle
  function loadActive(){
    store.ensure();
    const id=store.active(); const t=store.get(id);
    renderTabs(); renderThreads();
    if(!t){ chatList.innerHTML=""; titleEl.textContent=""; return; }
    titleEl.textContent=t.name;
    renderMessages(t);
  }
  function renderMessages(t){
    chatList.innerHTML="";
    t.messages.forEach(m=>{
      const el=appendMsg(m.role,m.text,new Date(m.time));
      el.dataset.id=m._id;
    });
    chatList.scrollTop=chatList.scrollHeight;
  }

  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

  // init
  loadActive();
  refreshSend();
})();