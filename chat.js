(function () {
  const $ = (s) => document.querySelector(s);
  const chatList = $("#chatList") || document.body;
  const input = $("#messageInput");
  const sendBtn = $("#sendBtn");
  let typingEl = $("#typing");

  const getSettings = () =>
    (window.__yanlik?.getSettings
      ? window.__yanlik.getSettings()
      : { language:"tr", typingIndicator:true, sendSound:false, sendBehavior:"enter", temperature:0.7, systemPrompt:"" });

  function ensureTypingEl() {
    if (!typingEl) {
      typingEl = document.createElement("div");
      typingEl.id = "typing";
      typingEl.className = "muted";
      typingEl.style.display = "none";
      typingEl.textContent = "Yazıyor…";
      chatList.after(typingEl);
    }
  }
  ensureTypingEl();

  // Ses
  let audioCtx = null;
  function playSendBeep() {
    const { sendSound } = getSettings();
    if (!sendSound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle"; o.frequency.value = 880; g.gain.value = 0.05;
      o.connect(g); g.connect(audioCtx.destination); o.start();
      setTimeout(()=>{ o.stop(); o.disconnect(); g.disconnect(); }, 90);
    } catch {}
  }

  function refreshSendState() {
    const val = (input?.value || "").trim();
    if (sendBtn) sendBtn.disabled = val.length === 0;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  }

  function appendMessage(role, text) {
    const item = document.createElement("div");
    item.className = `msg msg-${role}`;
    item.innerHTML = `<strong>${role === "user" ? "Sen" : "Yanlik"}:</strong> ${escapeHtml(text)}`;
    chatList.appendChild(item);
    chatList.scrollTop = chatList.scrollHeight;
  }

  function showTyping(on) {
    if (!getSettings().typingIndicator) return;
    ensureTypingEl();
    typingEl.style.display = on ? "block" : "none";
    typingEl.textContent = on ? "Yazıyor…" : "";
  }

  // --- STUB CEVAP ÜRETİCİ (API YOK) ---
  function makeStubReply(userText) {
    const { temperature, systemPrompt, language } = getSettings();
    const tag = temperature >= 0.8 ? "💡" : temperature <= 0.3 ? "📌" : "✨";
    const sys = systemPrompt ? " (özel mod)" : "";
    const langMap = {
      tr: `${tag}${sys} ${userText.slice(0, 120)}${userText.length>120?"…":""}`,
      en: `${tag}${sys} ${userText.slice(0, 120)}${userText.length>120?"…":""}`,
      de: `${tag}${sys} ${userText.slice(0, 120)}${userText.length>120?"…":""}`
    };
    return langMap[language] || langMap.tr;
  }

  async function sendMessage() {
    const text = (input?.value || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    if (sendBtn) {
      sendBtn.disabled = true;
      const old = sendBtn.textContent;
      sendBtn.textContent = "Gönderiliyor…";
      setTimeout(()=> sendBtn.textContent = old, 600);
    }
    appendMessage("user", text);
    playSendBeep();
    if (input) { input.value = ""; refreshSendState(); input.focus(); }

    showTyping(true);
    await new Promise(r => setTimeout(r, 400 + Math.random()*600));
    const reply = makeStubReply(text);
    showTyping(false);
    appendMessage("assistant", reply);
  }

  function onKeyDown(e) {
    const { sendBehavior } = getSettings();
    if (sendBehavior === "enter") {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    } else {
      if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); sendMessage(); }
    }
  }

  if (input) {
    input.addEventListener("keydown", onKeyDown);
    input.addEventListener("input", refreshSendState);
    refreshSendState();
  }
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);

  window.__yanlik?.onSettingsChange?.((s)=>{
    const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const isDark = s.theme === "dark" || (s.theme === "system" && sysDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  });
})();