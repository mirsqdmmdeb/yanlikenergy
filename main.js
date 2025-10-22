import { bindUI, renderMessage, botReplySimulate, yanlikState } from "./chat.js";

document.addEventListener("DOMContentLoaded",()=>{
  const chatBox=document.getElementById("chat-box");
  const input=document.getElementById("user-input");
  const sendBtn=document.getElementById("send-btn");
  const typingEl=document.getElementById("typing-indicator");
  const themeSelect=document.getElementById("theme-select");
  const clearBtn=document.getElementById("clear-memory");
  const energyToggle=document.getElementById("energy-toggle");
  const speedRange=document.getElementById("speed-range");
  const saveBtn=document.getElementById("save-chat");

  bindUI({chatBoxEl:chatBox,inputEl:input,sendBtnEl:sendBtn,typingEl});

  // Load theme & energy & delay
  const savedTheme=localStorage.getItem("yanlik_theme")||"lacivert";
  document.documentElement.setAttribute("data-theme",savedTheme);
  themeSelect.value=savedTheme;
  energyToggle.checked=yanlikState.isEnergy();
  speedRange.value=yanlikState.delay;

  function sendText(){
    const text=input.value.trim();
    if(!text) return;
    renderMessage("user",text);
    input.value="";
    botReplySimulate(text);
  }

  sendBtn.addEventListener("click",sendText);
  input.addEventListener("keydown",e=>{if(e.key==="Enter")sendText();});

  themeSelect.addEventListener("change",e=>{
    const t=e.target.value;
    document.documentElement.setAttribute("data-theme",t);
    localStorage.setItem("yanlik_theme",t);
  });

  clearBtn.addEventListener("click",()=>{
    if(confirm("Hafızayı sıfırlamak istiyor musun?")){
      yanlikState.clearMemory(); location.reload();
    }
  });

  energyToggle.addEventListener("change",e=>{
    yanlikState.setEnergy(e.target.checked);
  });

  speedRange.addEventListener("input",e=>{
    const val=e.target.value;
    yanlikState.setDelay(val);
  });

  saveBtn.addEventListener("click",()=>{
    const mem=yanlikState.getMemory().join("\\n");
    const blob=new Blob([mem],{type:"text/plain"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="yanlik_chat.txt";
    a.click();
  });

  renderMessage("bot","Merhaba! Yanlik 2.1 (Leopar) başlatıldı ⚡");
});