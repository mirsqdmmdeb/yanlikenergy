/* ============================================================
   YANLIK 5.0 • UI Module (chat_ui.js)
   8×12 chat viewport • robust send binding • typing indicator
   Requires: chat_core.js, chat_lang.js, chat_empathetic.js, chat_crisis.js
   ============================================================ */

(function (global) {
  "use strict";
  const VERSION = "5.0-ui";

  // ---- DOM helpers ----
  const $ = (s, r = document) => r.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // ---- Elements (lazily resolved) ----
  let E = {};
  function bindElements() {
    E.chatList   = $("#chatList");
    E.input      = $("#messageInput");
    E.send       = $("#sendBtn");
    E.typing     = $("#typing") || (function(){ const d=document.createElement("div"); d.id="typing"; d.className="typing"; d.style.display="none"; d.textContent="Yanıt hazırlanıyor..."; (E.chatList?.parentElement||document.body).appendChild(d); return d; })();
    E.statusPill = $("#statusPill");
  }

  // ---- Basic rendering ----
  function sanitizeHtml(s) {
    return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  }
  function lineify(s){
    return sanitizeHtml(s).replace(/```([\s\S]*?)```/g, (_,c)=>`<pre><code>${c}</code></pre>`).replace(/\n/g,"<br/>")
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function renderMessage(msg) {
    if (!E.chatList) return;
    const el = document.createElement("div");
    el.className = `msg msg-${msg.role === "user" ? "user" : "assistant"}`;
    el.dataset.id = msg.id;
    el.innerHTML = `
      <div class="body">${lineify(msg.text)}</div>
      <div class="meta">${msg.role === "user" ? "Sen" : "Yanlık"} • ${new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
    `;
    E.chatList.appendChild(el);
    E.chatList.scrollTop = E.chatList.scrollHeight;
    return el;
  }

  // ---- Typing indicator ----
  function setTyping(onOff){
    if(!E.typing) return;
    E.typing.style.display = onOff ? "block" : "none";
  }

  function setStatus(text){
    if(E.statusPill) E.statusPill.textContent = "● " + text;
  }

  // ---- Send flow (robust) ----
  async function doSend() {
    const txt = (E.input?.value || "").trim();
    if (!txt) return;
    // clean input immediately for snappy feel
    E.input.value = "";
    UI && UI.loading && UI.loading(E.send, true);
    setStatus("Gönderiliyor…");

    try {
      // render user
      const m = global.YanlikCore.addMessage("user", txt);
      renderMessage(m);

      // show typing while other modules work
      setTyping(true);

      // emit bus event (this triggers empathy/crisis/etc.)
      YanlikBus.emit("user:send", m);
    } catch (e) {
      console.error(e);
      UI && UI.toast && UI.toast("Gönderirken hata oluştu.", "error");
    } finally {
      // typing indicator kapanışı asistan cevabı geldiğinde yapılır (event ile)
      UI && UI.loading && UI.loading(E.send, false);
      setStatus("Hazır");
    }
  }

  // Enter behavior per settings
  function bindInputHotkeys() {
    if (!E.input) return;
    on(E.input, "keydown", (e) => {
      const s = JSON.parse(localStorage.getItem("yanlik.settings") || "{}");
      const mode = s.sendBehavior || "enter";
      if (mode === "enter" && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        E.send?.click();
      } else if (mode === "ctrl" && e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        E.send?.click();
      }
    });
  }

  // ---- Aspect-ratio (8×12) enforce ----
  function ensureAspect() {
    if (!E.chatList) return;
    // 12/8 yatay oranı; yükseklik taşmasın
    E.chatList.style.aspectRatio = "12 / 8";
    E.chatList.style.maxHeight = "80vh";
    E.chatList.style.margin = "auto";
  }

  // ---- Event wiring with Core/Bus ----
  function wireBus() {
    // assistant reply: render + stop typing
    YanlikBus.on("assistant:reply", (m) => {
      renderMessage(m);
      setTyping(false);
    });

    // new conversation (on boot)
    YanlikBus.on("conversation:new", (c) => {
      // clear list, show fresh
      if(E.chatList) E.chatList.innerHTML = "";
    });
  }

  // ---- Boot sequence ----
  function boot() {
    bindElements();
    ensureAspect();
    // send click (robust to late load)
    if (!E.send || !E.input) {
      document.addEventListener("DOMContentLoaded", boot, { once: true });
      return;
    }
    on(E.send, "click", doSend);
    bindInputHotkeys();
    wireBus();

    // İlk konuşmayı hazırla (yoksa)
    const list = global.YanlikStorage.list();
    const conv = list[0] ? global.YanlikStorage.load(list[0]) : global.YanlikCore.createConversation();
    // son 60 mesajı yükle
    if (conv && E.chatList) {
      const last = (conv.messages || []).slice(-60);
      last.forEach(renderMessage);
    }

    setStatus("Hazır");
    console.log("Yanlik UI loaded:", VERSION);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // expose (optional)
  global.YanlikUI = { renderMessage, setTyping, setStatus, boot, version: VERSION };
})(window);