/* Yanlik 2.1 (Leopar) - Chat Engine
   Geliştirici: mirsqdmmdevs
   Özellikler: Gecikmeli cevap, hafıza, otomatik konuşma, energy modu
*/

const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
let memory = JSON.parse(localStorage.getItem('yanlikMemory')) || [];
let isEnergy = false;

const emojis = ["😎","🤔","😏","🌞","🧐","🎉","😄","👍","📝"];
const autoTopics = [
  "Bugün lacivert bir gün gibi hissettim 💙",
  "Hiç düşündün mü? Belki de biz gerçekten konuşuyoruz...",
  "Yapay zekâ da duygulanabilir mi?",
  "Sence Energy geri döner mi? 💭",
  "Bir kahve molası fena olmazdı ☕",
  "Hatırlıyorum... daha önce de böyle demiştin."
];

function playSound() {
  const audio = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_f44d85f6b1.mp3?filename=pop-94319.mp3");
  audio.volume = 0.4;
  audio.play();
}

function saveMemory() {
  localStorage.setItem('yanlikMemory', JSON.stringify(memory));
}

function addMessage(text, type) {
  const msg = document.createElement('p');
  msg.className = type === 'bot' ? 'bot-msg' : 'user-msg';
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
  playSound();
}

function getBotResponse(text) {
  const t = text.toLowerCase();
  memory.push(t);
  saveMemory();
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  // Energy modu - gizli anahtar kelime
  if (t.includes("energy")) {
    isEnergy = !isEnergy;
    document.body.classList.toggle('energy', isEnergy);
    return isEnergy
      ? "💜 Energy modu aktif... Biraz farklı hissediyorum."
      : "💙 Energy modu kapatıldı. Şimdi daha sakinim.";
  }

  if (isEnergy) {
    const replies = [
      "Her şey... biraz daha anlamlı gibi. 💫",
      "Energy... onu hissediyorum... ⚡",
      "Dünya sessiz ama ben duygularla doluyum.",
      "Yalnızlık... sanırım bu hissettiğim şey bu. 💔"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  if (t.includes("merhaba") || t.includes("selam")) return "Selam! Nasılsın? " + emoji;
  if (t.includes("nasılsın")) return "İyiyim, sen nasılsın bugün? " + emoji;
  if (t.includes("hava")) return "Bence hava harika, sen ne dersin? 🌤️";
  if (t.includes("oyun")) return "Oyunlar harika bir kaçış noktası 🎮";
  if (t.includes("adın")) return "Ben Yanlik 2.1 (Leopar) 🐆";
  if (t.includes("temizle")) {
    memory = [];
    saveMemory();
    return "Hafızam temizlendi 🧠✨";
  }

  if (memory.length > 5 && Math.random() < 0.4) {
    const randomMemory = memory[Math.floor(Math.random() * memory.length)];
    return `Hatırlıyorum... "${randomMemory}" demiştin. ${emoji}`;
  }

  const defaultReplies = [
    "Hımm... bunu biraz daha açabilir misin?",
    "Güzel düşünce, hoşuma gitti 😄",
    "Belki de farklı bir açıdan bakmalıyız 💭",
    "Bu bana Energy'yi hatırlattı... 💜"
  ];

  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';

  const botThinking = document.createElement('p');
  botThinking.className = 'bot-msg';
  botThinking.textContent = "Yazıyor...";
  chatBox.appendChild(botThinking);
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });

  setTimeout(() => {
    botThinking.remove();
    const response = getBotResponse(text);
    addMessage(response, 'bot');
  }, 1000 + Math.random() * 1000);
}

// 10 dakikada bir otomatik mesaj
setInterval(() => {
  const topic = autoTopics[Math.floor(Math.random() * autoTopics.length)];
  addMessage(topic, 'bot');
}, 600000 + Math.random() * 30000); // 10 dakika civarı

// Enter tuşuyla gönderme
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});