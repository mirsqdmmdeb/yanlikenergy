/* main.js - Yanlik 2.6 (Vercel /api/hf entegre, offline fallback, hafıza, çoklu yanıt) */

/* ---------------------------
   Ayarlar
   --------------------------- */
const MEMORY_KEY = 'yanlik-memory-v2';
const MEMORY_LIMIT = 2000; // istersen 10000 yap ama localStorage fazla dolabilir
let memory = JSON.parse(localStorage.getItem(MEMORY_KEY)) || [];

let currentLang = 'tr';

/* ---------------------------
   Tema sistemi
   --------------------------- */
function setTheme(theme) {
  document.body.className = `theme-${theme}`;
  localStorage.setItem('yanlik-theme', theme);
}

document.addEventListener('DOMContentLoaded', () => {
  // Tema uygula
  const savedTheme = localStorage.getItem('yanlik-theme') || 'blue';
  setTheme(savedTheme);

  // Dil uygula
  const savedLang = localStorage.getItem('yanlik-lang') || 'tr';
  loadLang(savedLang);

  // Hafızayı (gerekirse) UI'ye bağla
  renderMemoryIndicator();
});

/* ---------------------------
   Dil sistemi (lang_tr.json, lang_en.json, lang_de.json beklenir)
   --------------------------- */
async function loadLang(lang) {
  try {
    const res = await fetch(`lang_${lang}.json`);
    const data = await res.json();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (data[key]) el.innerText = data[key];
    });
    currentLang = lang;
    localStorage.setItem('yanlik-lang', lang);
  } catch (e) {
    console.warn('Dil dosyası yüklenemedi:', e);
  }
}

/* ---------------------------
   Hafıza (memory) fonksiyonları
   --------------------------- */
function persistMemory() {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  renderMemoryIndicator();
}

function addToMemory(sender, text) {
  memory.push({ sender, text, ts: Date.now() });
  if (memory.length > MEMORY_LIMIT) memory.shift();
  persistMemory();
}

function clearMemory() {
  memory = [];
  persistMemory();
}

/* Basit gösterge (isteğe göre HTML elemanı bağla) */
function renderMemoryIndicator() {
  const el = document.getElementById('memory-indicator');
  if (!el) return;
  el.innerText = `Hafıza: ${memory.length}/${MEMORY_LIMIT}`;
}

/* ---------------------------
   Chat UI: mesaj ekleme
   --------------------------- */
function addMessage(sender, text, options = {}) {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;

  const msg = document.createElement('div');
  msg.className = 'card ' + (sender === 'Sen' ? 'msg-user' : 'msg-yanlik');

  // Eğer "thinking" flag gelirse özel görünüm
  if (options.thinking) {
    msg.innerHTML = `<strong>${sender}:</strong> <span class="thinking">Düşünüyor<span class="dots">...</span></span>`;
  } else {
    msg.innerHTML = `<strong>${sender}:</strong> ${escapeHtml(text)}`;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Hafızaya ekle (düşünme mesajları hariç)
  if (!options.noMemory) addToMemory(sender, text);
}

/* Güvenlik: basit HTML escape */
function escapeHtml(unsafe) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ---------------------------
   Offline knowledge fallback
   --------------------------- */
async function generateResponseFromKnowledge(userInput) {
  try {
    const res = await fetch('knowledge.json');
    const data = await res.json();
    const lower = userInput.toLowerCase();

    // Öncelikli: tam anahtar eşleşmeleri
    for (const key in data) {
      if (lower.includes(key)) {
        const answers = data[key];
        return answers[Math.floor(Math.random() * answers.length)];
      }
    }

    // Basit duygu/anahtar kuralları (örnek)
    if (lower.match(/\b(üzgün|mutsuz|kötü)\b/)) {
      return "Üzülme dostum, buradayım. İstersen anlat.";
    }
    if (lower.match(/\b(mutlu|sevinç|harika)\b/)) {
      return "Harika! Enerjin yayılıyor ⚡";
    }

    // default fallback
    return "Hmm... bunu tam anlamadım ama daha fazla yaz, birlikte çözelim 😅";
  } catch (e) {
    console.warn('knowledge.json load error', e);
    return "Üzgünüm, şu an bilgim kısıtlı.";
  }
}

/* ---------------------------
   Hugging Face (Vercel /api/hf) çağrısı
   --------------------------- */
async function fetchHFResponseViaProxy(userInput) {
  try {
    const res = await fetch('/api/hf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userInput })
    });

    if (!res.ok) {
      const txt = await res.text();
      console.warn('Proxy hata:', res.status, txt);
      throw new Error('Proxy error');
    }

    const data = await res.json();
    // Beklenen: { response: "..." }
    if (data && data.response) return data.response;
    // Bazı modeller farklı format dönebilir, kontrol et
    if (data && data[0] && data[0].generated_text) return data[0].generated_text;
    return null;
  } catch (e) {
    console.warn('fetchHFResponseViaProxy failed', e);
    return null;
  }
}

/* ---------------------------
   Cevap üretme: karma (online öncelik, offline fallback)
   --------------------------- */
async function generateResponse(userInput) {
  // 1) Hafızaya göre çok basit bağlam yaklaşımı (örnek)
  const lastUser = [...memory].reverse().find(m => m.sender === 'Sen');
  if (lastUser && lastUser.text && lastUser.text.toLowerCase().includes('merhaba') && userInput.toLowerCase().includes('nasılsın')) {
    // hafızaya dayalı küçük kural
    return 'Daha önce merhaba demiştin, tekrar merhaba! Ben iyiyim, sen?';
  }

  // 2) Önce online dene (proxy)
  const online = await fetchHFResponseViaProxy(userInput);
  if (online) return online;

  // 3) Offline knowledge fallback
  const offline = await generateResponseFromKnowledge(userInput);
  return offline;
}

/* ---------------------------
   "Düşünüyor..." ve gönderme mantığı
   --------------------------- */
async function sendMessage() {
  const inputEl = document.getElementById('user-input');
  if (!inputEl) return;
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage('Sen', text);
  inputEl.value = '';

  // 1. Düşünüyor mesajını ekle (noMemory: true, hafızaya yazmasın)
  addMessage('Yanlik', 'Düşünüyor...', { thinking: true, noMemory: true });

  // 2. Cevabı üret
  const response = await generateResponse(text);

  // 3. Gecikme hesapla (yazma hızı simülasyonu)
  const delay = Math.min(response.length * 30 + 400, 2500);

  setTimeout(() => {
    // son "düşünüyor" mesajını güncelle
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    const lastMsg = Array.from(chatBox.children).reverse().find(n => n.classList && n.classList.contains('msg-yanlik'));
    if (lastMsg) {
      lastMsg.innerHTML = `<strong>Yanlik:</strong> ${escapeHtml(response)}`;
      // hafızaya ekle
      addToMemory('Yanlik', response);
    } else {
      addMessage('Yanlik', response);
    }
  }, delay);
}

/* ---------------------------
   Ek fonksiyonlar: temizle, dışa aktar
   --------------------------- */
function clearHistory() {
  const chatBox = document.getElementById('chat-box');
  if (chatBox) chatBox.innerHTML = '';
  memory = [];
  persistMemory();
}

function exportChatAsTxt() {
  const text = memory.map(m => `${new Date(m.ts).toLocaleString()} [${m.sender}] ${m.text}`).join('\n\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'yanlik_chat.txt';
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------
   Kısa kullanım kılavuzu (console)
   --------------------------- */
console.log('Yanlik main.js yüklendi. sendMessage(), clearHistory(), exportChatAsTxt(), setTheme(), loadLang() kullanılabilir.');

/* ---------------------------
   Event listeners (buton bağlama)
   --------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('send-btn');
  const inputEl = document.getElementById('user-input');
  const clearBtn = document.getElementById('clear-btn');
  const exportBtn = document.getElementById('export-btn');

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (inputEl) {
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  if (clearBtn) clearBtn.addEventListener('click', clearHistory);
  if (exportBtn) exportBtn.addEventListener('click', exportChatAsTxt);
});