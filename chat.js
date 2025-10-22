import { getYanlikReply } from "./dialogue.js";
import { YanlikState } from "./state.js";

export const yanlikState = new YanlikState();
let chatBox, input, sendBtn, typingEl;

export function bindUI({chatBoxEl,inputEl,sendBtnEl,typingEl:te}){
  chatBox=chatBoxEl; input=inputEl; sendBtn=sendBtnEl; typingEl=te;
}

export function createMessage(text,sender='bot',id=null){
  const el=document.createElement('div');
  el.className='chat-msg '+(sender==='user'?'user':'bot');
  el.dataset.id=id||Date.now();
  const p=document.createElement('p'); p.textContent=text;
  const del=document.createElement('span');
  del.textContent='🗑️'; del.className='delete-btn';
  del.addEventListener('click',()=>el.remove());
  el.appendChild(p); el.appendChild(del);
  return el;
}

export function renderMessage(role,text){
  const el=createMessage(text,role);
  chatBox.appendChild(el);
  chatBox.scrollTop=chatBox.scrollHeight;
  yanlikState.remember(role,text);
}

export async function botReplySimulate(userText){
  typingEl.style.display='block';
  const reply=getYanlikReply(userText,yanlikState);
  const delay=yanlikState.getDelayMs();
  await new Promise(r=>setTimeout(r,delay+Math.random()*500));
  typingEl.style.display='none';
  renderMessage('bot',reply);
}