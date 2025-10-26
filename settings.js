const SETTINGS_KEY = "yanlik.settings";
const DEFAULTS = {
  theme: "system",
  language: "tr",
  memory: true,
  typingIndicator: true,
  sendSound: false,
  sendBehavior: "enter",
  temperature: 0.7,
  systemPrompt: ""
};

function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}
function writeSettings(next) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  if (window.__yanlik?.setSettings) window.__yanlik.setSettings(next);
}
function applyTheme(theme) {
  const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && sysDark);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}

const $ = (s) => document.querySelector(s);
const el = {
  theme: $("#theme"),
  language: $("#language"),
  memory: $("#memory"),
  typingIndicator: $("#typingIndicator"),
  sendSound: $("#sendSound"),
  sendBehavior: $("#sendBehavior"),
  temperature: $("#temperature"),
  temperatureValue: $("#temperatureValue"),
  systemPrompt: $("#systemPrompt"),
  saveBtn: $("#saveBtn"),
  resetBtn: $("#resetBtn")
};

const initial = readSettings();
el.theme.value = initial.theme;
el.language.value = initial.language;
el.memory.checked = !!initial.memory;
el.typingIndicator.checked = !!initial.typingIndicator;
el.sendSound.checked = !!initial.sendSound;
el.sendBehavior.value = initial.sendBehavior;
el.temperature.value = String(initial.temperature);
el.temperatureValue.textContent = Number(initial.temperature).toFixed(2);
el.systemPrompt.value = initial.systemPrompt || "";
applyTheme(initial.theme);

el.theme.addEventListener("change", () => applyTheme(el.theme.value));
el.temperature.addEventListener("input", () => {
  el.temperatureValue.textContent = Number(el.temperature.value).toFixed(2);
});

el.saveBtn.addEventListener("click", () => {
  const next = {
    theme: el.theme.value,
    language: el.language.value,
    memory: el.memory.checked,
    typingIndicator: el.typingIndicator.checked,
    sendSound: el.sendSound.checked,
    sendBehavior: el.sendBehavior.value,
    temperature: Number(el.temperature.value),
    systemPrompt: el.systemPrompt.value.trim()
  };
  writeSettings(next);
  el.saveBtn.textContent = "Kaydedildi ✓";
  setTimeout(()=> el.saveBtn.textContent="Kaydet", 900);
});

el.resetBtn.addEventListener("click", () => {
  writeSettings(DEFAULTS);
  el.theme.value = DEFAULTS.theme;
  el.language.value = DEFAULTS.language;
  el.memory.checked = DEFAULTS.memory;
  el.typingIndicator.checked = DEFAULTS.typingIndicator;
  el.sendSound.checked = DEFAULTS.sendSound;
  el.sendBehavior.value = DEFAULTS.sendBehavior;
  el.temperature.value = String(DEFAULTS.temperature);
  el.temperatureValue.textContent = Number(DEFAULTS.temperature).toFixed(2);
  el.systemPrompt.value = DEFAULTS.systemPrompt;
  applyTheme(DEFAULTS.theme);
});