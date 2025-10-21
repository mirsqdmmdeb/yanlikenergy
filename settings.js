/* Yanlik 2.1 (Leopar) — Ayarlar Sistemi
   Geliştirici: mirsqdmmdevs
   Özellikler: Tema, hız, energy, hafıza, efektler, kaydetme
*/

const settings = {
  theme: localStorage.getItem('theme') || 'lacivert',
  energy: localStorage.getItem('energy') === 'true',
  typingSpeed: localStorage.getItem('typingSpeed') || 'normal',
  autoChat: localStorage.getItem('autoChat') !== 'false',
  effects: localStorage.getItem('effects') !== 'false'
};

function applySettings() {
  // Tema
  document.body.classList.remove('theme-lacivert', 'theme-dark', 'theme-light', 'theme-retro');
  document.body.classList.add(`theme-${settings.theme}`);

  // Energy modu
  document.body.classList.toggle('energy', settings.energy);

  // Efektler
  if (!settings.effects) {
    document.querySelectorAll('.bot-msg, .user-msg').forEach(m => {
      m.style.animation = 'none';
    });
  }

  console.log("Ayarlar uygulandı:", settings);
}

function openSettingsPanel() {
  const panel = document.createElement('div');
  panel.className = 'settings-panel';
  panel.innerHTML = `
    <div class="settings-content">
      <h2>⚙️ Ayarlar</h2>

      <label>Tema:</label>
      <select id="theme-select">
        <option value="lacivert">Lacivert (Varsayılan)</option>
        <option value="dark">Koyu</option>
        <option value="light">Açık</option>
        <option value="retro">Retro</option>
      </select>

      <label>Energy Modu:</label>
      <input type="checkbox" id="energy-toggle" ${settings.energy ? 'checked' : ''}>

      <label>Yazma Hızı:</label>
      <select id="typing-select">
        <option value="slow">Yavaş</option>
        <option value="normal" selected>Normal</option>
        <option value="fast">Hızlı</option>
      </select>

      <label>Otomatik Konuşma:</label>
      <input type="checkbox" id="autoChat-toggle" ${settings.autoChat ? 'checked' : ''}>

      <label>Efektler:</label>
      <input type="checkbox" id="effects-toggle" ${settings.effects ? 'checked' : ''}>

      <button id="save-settings">💾 Kaydet</button>
      <button id="reset-settings">🧹 Sıfırla</button>
      <button id="close-settings">Kapat</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Stil
  const style = document.createElement('style');
  style.innerHTML = `
    .settings-panel {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      animation: fadeIn 0.4s ease;
    }
    .settings-content {
      background-color: #14213d;
      color: #fff;
      padding: 25px 35px;
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(0,180,216,0.3);
      max-width: 400px;
      width: 90%;
      text-align: left;
      animation: fadeIn 0.5s ease forwards;
    }
    .settings-content h2 {
      text-align: center;
      color: #00b4d8;
    }
    .settings-content label {
      display: block;
      margin-top: 12px;
      font-weight: bold;
    }
    .settings-content select, .settings-content input[type="checkbox"] {
      margin-top: 5px;
      margin-bottom: 10px;
      padding: 6px;
      border-radius: 6px;
      border: none;
      width: 100%;
      background-color: #1c2541;
      color: #fff;
    }
    .settings-content button {
      margin: 10px 5px 0 0;
      padding: 10px 15px;
      border-radius: 8px;
      border: none;
      background-color: #00b4d8;
      color: #fff;
      cursor: pointer;
      transition: 0.3s;
    }
    .settings-content button:hover {
      background-color: #48cae4;
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);

  // Buton olayları
  document.getElementById('save-settings').onclick = saveSettings;
  document.getElementById('reset-settings').onclick = resetSettings;
  document.getElementById('close-settings').onclick = () => panel.remove();
}

function saveSettings() {
  settings.theme = document.getElementById('theme-select').value;
  settings.energy = document.getElementById('energy-toggle').checked;
  settings.typingSpeed = document.getElementById('typing-select').value;
  settings.autoChat = document.getElementById('autoChat-toggle').checked;
  settings.effects = document.getElementById('effects-toggle').checked;

  for (const key in settings) {
    localStorage.setItem(key, settings[key]);
  }

  applySettings();
  alert("Ayarlar kaydedildi ✅");
  document.querySelector('.settings-panel')?.remove();
}

function resetSettings() {
  localStorage.clear();
  location.reload();
}

// Kısayol tuşu: “A” tuşuna basınca ayarlar açılır
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'a') openSettingsPanel();
});

// Uygulama başlarken ayarları uygula
applySettings();