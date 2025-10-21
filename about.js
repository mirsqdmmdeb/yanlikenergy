// about.js — Yanlik 2.1 (Leopar) Hakkında Sayfası 💙
// © 2025 mirsqdmmdevs

document.addEventListener("DOMContentLoaded", () => {
  const aboutBox = document.getElementById("about-box");
  const textLines = [
    "🦁 Yanlik 2.1 (Leopar) Başlatılıyor...",
    "💻 Kod çekirdeği: Stabil v2.1.9",
    "🎨 Tema sistemi: Lacivert, Koyu, Açık, Retro",
    "🧠 Yapay zeka yanıt motoru: Gelişmiş 4 katmanlı NLP",
    "🔊 Ses efektleri: Aktif (Beta)",
    "🌐 Bağlantı durumu: Online",
    "👤 Geliştirici: mirsqdmmdevs",
    "📦 Platform: YanlikAI Web Alpha",
    "⚙️ Mod: Leopar (Deneysel UI + Akıllı Tepki)",
    "💬 Daha fazla bilgi için ayarlardan 'Hakkında' sekmesine göz at.",
    "🐾 Teşekkürler! Sen olmasan Yanlik olmazdı 💙"
  ];

  let index = 0;

  function typeLine() {
    if (index < textLines.length) {
      const line = document.createElement("p");
      line.textContent = textLines[index];
      line.classList.add("fade-in");
      aboutBox.appendChild(line);
      index++;
      setTimeout(typeLine, 700);
    } else {
      const done = document.createElement("p");
      done.classList.add("fade-in", "highlight");
      done.textContent = "✅ Sistem Tanıtımı Tamamlandı.";
      aboutBox.appendChild(done);
    }
  }

  typeLine();
});