import { getYanlikReply } from './dialogue.js';
import { YanlikState } from './state.js';

const state = new YanlikState();

// --- CHAT ---
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function renderMessage(role, text) {
  const el = document.createElement('div');
  el.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  el.textContent = text;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
  state.remember(`${role}:${text}`);
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  renderMessage('user', text);
  input.value = '';
  setTimeout(() => {
    const reply = getYanlikReply(text, state);
    renderMessage('bot', reply);
  }, state.getDelay());
}

sendBtn.onclick = sendMessage;
input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

// --- PAGE NAVIGATION ---
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('nav li');

navItems.forEach(li => {
  li.onclick = () => {
    navItems.forEach(n => n.classList.remove('active'));
    li.classList.add('active');
    const target = li.getAttribute('data-page');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  };
});

// --- THEME SWITCH ---
const themeBtns = document.querySelectorAll('[data-theme]');
themeBtns.forEach(btn => {
  btn.onclick = () => {
    const theme = btn.getAttribute('data-theme');
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('yanlik_theme', theme);
  };
});

// --- SETTINGS ---
const delayRange = document.getElementById('delay-range');
const delayDisplay = document.getElementById('delay-display');
delayRange.oninput = () => {
  delayDisplay.textContent = delayRange.value;
  localStorage.setItem('yanlik_delay', delayRange.value);
};
state.delay = localStorage.getItem('yanlik_delay') || 5;
delayRange.value = state.delay;
delayDisplay.textContent = state.delay;

// --- ENERGY ---
const energyBtn = document.getElementById('energy-btn');
const energyOut = document.getElementById('energy-out');
energyBtn.onclick = () => {
  const active = !state.isEnergy();
  state.setEnergy(active);
  energyOut.textContent = active ? '⚡ Energy aktif!' : '💤 Energy kapalı.';
};

// --- MEMORY RESET ---
document.getElementById('reset-memory').onclick = () => {
  localStorage.removeItem('yanlik_memory');
  alert('Hafıza sıfırlandı.');
  location.reload();
};

// --- LOAD THEME ON START ---
const savedTheme = localStorage.getItem('yanlik_theme');
if (savedTheme) document.body.setAttribute('data-theme', savedTheme);

// --- INITIAL GREETING ---
if (state.memory.length === 0)
  renderMessage('bot', 'Merhaba! Ben Yanlik 2.1 (Leopar). Sohbete başla.');
else
  state.memory.slice(-6).forEach(m => {
    const [role, msg] = m.split(':');
    renderMessage(role, msg);
  });