import { YanlikState } from './state.js';
import { getYanlikReply } from './dialogue.js';

const state = new YanlikState();

const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const pages = document.querySelectorAll('nav li');
const sections = document.querySelectorAll('section');
const themeToggle = document.getElementById('theme-toggle');
const typeEffect = document.getElementById('type-effect');
const soundEffect = document.getElementById('sound-effect');

let cfg = {
  type: true,
  sound: false
};

function switchPage(id) {
  pages.forEach(p => p.classList.remove('active'));
  sections.forEach(s => s.classList.remove('active'));
  document.querySelector(`[data-page="${id}"]`).classList.add('active');
  document.getElementById(id).classList.add('active');
}

pages.forEach(p => p.addEventListener('click', () => switchPage(p.dataset.page)));

function appendMsg(role, text) {
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  state.remember(`${role}:${text}`);
  if (cfg.sound) playSound();
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  appendMsg('user', text);
  input.value = '';

  setTimeout(() => {
    const reply = getYanlikReply(text, state);
    appendMsg('bot', reply);
  }, 700);
}

sendBtn.onclick = sendMessage;
input.onkeydown = e => e.key === 'Enter' && sendMessage();

typeEffect.onchange = () => cfg.type = typeEffect.checked;
soundEffect.onchange = () => cfg.sound = soundEffect.checked;

themeToggle.onclick = () => {
  const html = document.documentElement;
  const theme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️ Tema' : '🌙 Tema';
};

function playSound() {
  const ctx = new AudioContext();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = 'sine'; o.frequency.value = 600;
  g.gain.value = 0.03;
  o.start(); o.stop(ctx.currentTime + 0.07);
}

// İlk karşılama
appendMsg('bot', 'Merhaba! Ben Yanlik 2.1 (Leopar). Sohbet etmeye hazır mısın?');