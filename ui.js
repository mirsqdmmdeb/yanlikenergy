// ui.js — micro-interactions for buttons & toasts
(function(){
  // Ripple on .btn
  document.addEventListener("click", (e)=>{
    const btn = e.target.closest(".btn");
    if(!btn) return;
    const rect = btn.getBoundingClientRect();
    const r = document.createElement("span");
    r.className = "ripple";
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + "px";
    r.style.left = (e.clientX - rect.left - size/2) + "px";
    r.style.top  = (e.clientY - rect.top  - size/2) + "px";
    btn.appendChild(r);
    setTimeout(()=> r.remove(), 650);
  });

  // Loading helpers
  window.UI = window.UI || {};
  UI.loading = (el, on=true)=>{ if(!el) return; el.classList.toggle("loading", !!on); };
  // Toasts
  const host = document.createElement("div");
  host.className = "toasts";
  document.addEventListener("DOMContentLoaded", ()=> document.body.appendChild(host));
  UI.toast = (msg, type="")=>{
    const t = document.createElement("div");
    t.className = "toast " + (type||"");
    t.innerHTML = `<span>${msg}</span><button class="btn ghost icon" aria-label="Kapat">✕</button>`;
    t.querySelector("button").onclick = ()=> t.remove();
    host.appendChild(t);
    setTimeout(()=> t.remove(), 4000);
  };
})();