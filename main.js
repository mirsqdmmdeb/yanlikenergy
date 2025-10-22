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