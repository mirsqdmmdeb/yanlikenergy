import { getYanlikReply } from './dialogue.js';
import { YanlikState } from './state.js';

const state = new YanlikState();
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
  }, 800 + Math.random() * 800);
}

sendBtn.onclick = sendMessage;
input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

if (state.memory.length === 0)
  renderMessage('bot', 'Merhaba! Ben Yanlik 2.1 (Leopar). Sohbete başla.');
else
  state.memory.slice(-6).forEach(m => {
    const [role, msg] = m.split(':');
    renderMessage(role, msg);
  });