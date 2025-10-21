// settings.js — Yanlik 2.1 (Leopar) Ultimate Edition 💙
// © 2025 mirsqdmmdevs

document.addEventListener("DOMContentLoaded", () => {
  const themeSelect = document.getElementById("theme-select");
  const soundToggle = document.getElementById("sound-toggle");
  const autoMsgToggle = document.getElementById("auto-toggle");
  const clearMemoryBtn = document.getElementById("clear-memory");

  // 🔹 Tema değiştirme
  themeSelect.addEventListener("change", e => {
    const selected = e.target.value;
    document.body.className = selected;
    localStorage.setItem("yanlik-theme", selected);
  });

  // 🔹 Ses aç/kapat
  soundToggle.addEventListener("change", e => {
    localStorage.setItem("yanlik-sound", e.target.checked);
  });

  // 🔹 Otomatik mesaj sistemi
  autoMsgToggle.addEventListener("change", e => {
    localStorage.setItem("yanlik-auto", e.target.checked);
  });

  // 🔹 Hafızayı temizleme
  clearMemoryBtn.addEventListener("click", () => {
    localStorage.removeItem("yanlik-memory");
    alert("🧠 Yanlik hafızası başarıyla sıfırlandı!");
  });

  // 🔹 Kayıtlı ayarları yükle
  window.addEventListener("load", () => {
    const savedTheme = localStorage.getItem("yanlik-theme");
    const savedSound = localStorage.getItem("yanlik-sound") === "true";
    const savedAuto = localStorage.getItem("yanlik-auto") === "true";

    if (savedTheme) {
      document.body.className = savedTheme;
      themeSelect.value = savedTheme;
    }

    soundToggle.checked = savedSound;
    autoMsgToggle.checked = savedAuto;
  });
});