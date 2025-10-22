// ===== Tema Sistemi =====
function setTheme(theme) {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('yanlik-theme', theme);
}

// Yüklendiğinde kayıtlı temayı uygula
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('yanlik-theme') || 'blue';
    setTheme(savedTheme);
});

// ===== Dil Sistemi =====
let currentLang = 'tr';
function loadLang(lang) {
    fetch(`lang_${lang}.json`)
        .then(res => res.json())
        .then(data => {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if(data[key]) el.innerText = data[key];
            });
        });
    currentLang = lang;
    localStorage.setItem('yanlik-lang', lang);
}

// Sayfa yüklendiğinde dil uygula
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('yanlik-lang') || 'tr';
    loadLang(savedLang);
});

// ===== Mesaj Sistemi =====
let chatHistory = [];

function addMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    const msg = document.createElement('div');
    msg.className = 'card';
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    chatHistory.push({sender, text});
}

// ===== Gönder Fonksiyonu =====
function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if(!text) return;
    addMessage('Sen', text);
    input.value = '';

    addMessage('Yanlik', 'Düşünüyor...');
    setTimeout(() => {
        addMessage('Yanlik', 'Selam! Ben Yanlik 2.5, Quantum Update öncesi sürüm 😎');
    }, 1000);
}

// ===== Geçmiş Temizleme =====
function clearHistory() {
    chatHistory = [];
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
}