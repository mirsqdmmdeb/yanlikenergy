(function () {
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

  function safeRead() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  let settings = safeRead();
  const listeners = new Set();

  function setSettings(next) {
    settings = { ...settings, ...next };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
    listeners.forEach((fn) => { try { fn(settings); } catch {} });
  }

  function onSettingsChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  window.__yanlik = window.__yanlik || {};
  window.__yanlik.DEFAULTS = DEFAULTS;
  window.__yanlik.getSettings = () => settings;
  window.__yanlik.setSettings = setSettings;
  window.__yanlik.onSettingsChange = onSettingsChange;
})();