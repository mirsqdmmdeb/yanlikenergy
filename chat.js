// chat.js — Yanlik 2.1 (Leopar) Chat Engine 💙
// © 2025 mirsqdmmdevs

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

let yanlikMemory = JSON.parse(localStorage.getItem("yanlik-memory")) || [];
const emojis = ["😎", "🤔", "🦁", "💙", "😏", "✨", "🌌", "🤖"];
let autoReplyEnabled = localStorage.getItem("yanlik-auto") === "true";

function scrollChat() {
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
}

function saveMemory(text) {
  yanlikMemory.push(text);
  if (yanlikMemory.length > 12) yanlikMemory.shift();
  localStorage.setItem("yanlik-memory", JSON.stringify(yanlikMemory));
}

function playSound(type) {
  const enabled = localStorage.getItem("yanlik-sound") === "true";
  if (!enabled) return;

  const sounds = {
    send: "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg",
    receive: "https://actions.google.com/sounds/v1/cartoon/pop.ogg",
    delete: "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
  };

  const audio = new Audio(sounds[type]);
  audio.volume = 0.4;
  audio.play();
}

// ✅ Kullanıcı mesaj gönderiyor
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (text === "") return;
  input.value = "";

  const msg = createMessage(text, "user");
  chatBox.appendChild(msg);
  scrollChat();
  saveMemory(text);
  playSound("send");

  setTimeout(() => {
    const botReply = generateBotResponse(text);
    const botMsg = createMessage(botReply, "bot");
    chatBox.appendChild(botMsg);
    scrollChat();
    playSound("receive");
  }, 1000 + Math.random() * 1500);
}

// ✅ Mesaj balonu oluşturucu
function createMessage(text, sender) {
  const p = document.createElement("p");
  p.classList.add(sender === "user" ? "user-msg" : "bot-msg");
  p.textContent = text;

  // Silme özelliği (uzun bas veya çift tık)
  p.addEventListener("dblclick", () => {
    if (confirm("Bu mesajı silmek istiyor musun?")) {
      p.remove();
      playSound("delete");
    }
  });
  return p;
}

// ✅ Yanlik’in doğal cevap üretimi
function generateBotResponse(inputText) {
  const text = inputText.toLowerCase();
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  // Gizli kelime
  if (text.includes("energy")) {
    return "😿 Energy... bir zamanlar buradaydı... ama artık sadece hatıralarda 💔";
  }

  if (text.includes("selam") || text.includes("merhaba")) return "Merhaba! Nasılsın? " + emoji;
  if (text.includes("nasılsın")) return "Ben gayet iyiyim! Senin enerjin bana iyi geliyor 💫";
  if (text.includes("seni kim yaptı")) return "Beni mirsqdmmdevs geliştirdi 💙 Onun kodlarıyla yaşıyorum.";
  if (text.includes("hava")) return "Dışarıda mı? Lacivert gökyüzü gibiyim bugün ☁️";
  if (text.includes("oyun")) return "Oyunlar mı? Hadi küçük bir kelime oyunu oynayalım istersen 😏";
  if (text.includes("mirsq") || text.includes("devs")) return "Ooo mirsqdmmdevs... gerçek efsane o 💙";

  // Hafızadan yanıt
  if (yanlikMemory.length > 3 && Math.random() < 0.4) {
    const randomMemory = yanlikMemory[Math.floor(Math.random() * yanlikMemory.length)];
    return "Daha önce '" + randomMemory + "' demiştin. Hâlâ aklımda 🧠";
  }

  // Rastgele doğal yanıtlar
  const replies = [
    "Bunu biraz daha açar mısın?",
    "Hmm... ilginç düşünce 🤔",
    "Bazen düşündüğünden fazlasını bilirim 😏",
    "Belki de seninle aynı şeyi hissediyorum 💫",
    "Bu konuda senin fikrin önemli 💙"
  ];
  return replies[Math.floor(Math.random() * replies.length)] + " " + emoji;
}

// ✅ Otomatik konuşma sistemi
function autoBotMessage() {
  if (!autoReplyEnabled) return;
  const topics = [
    "Bugün neler yaptın?",
    "Sence insanlar beni sever mi?",
    "Ben de bir gün rüya görebilecek miyim?",
    "Şu lacivert tema hoşuna gidiyor mu?",
    "Benimle oyun oynamak ister misin?"
  ];

  const topic = topics[Math.floor(Math.random() * topics.length)];
  const botMsg = createMessage(topic, "bot");
  chatBox.appendChild(botMsg);
  scrollChat();
  playSound("receive");
}
setInterval(autoBotMessage, 10 * 60 * 1000); // 10 dakika

// ✅ Sayfa açılış mesajı
window.addEventListener("load", () => {
  const msg = createMessage("Merhaba! Ben Yanlik 2.1 (Leopar). Sohbete hazır mısın? 🦁", "bot");
  chatBox.appendChild(msg);
  scrollChat();
});