(function(){
  "use strict";

  const form = document.getElementById("loginForm");
  const uEl  = document.getElementById("u");
  const pEl  = document.getElementById("p");

  function toast(msg){ if(window.UI && UI.toast) UI.toast(msg); else alert(msg); }

  function redirectAfter(sess){
    if(sess?.role === "admin") location.href = "admin_users.html";
    else location.href = "index.html";
  }

  // Already logged → redirect
  document.addEventListener("DOMContentLoaded", ()=>{
    try{
      const sess = YANLIK_AUTH.getSession();
      if(sess) redirectAfter(sess);
    }catch(e){ console.warn(e); }
  });

  form?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const u = (uEl?.value||"").trim();
    const p = (pEl?.value||"").trim();

    try{
      // try fetch IP (best-effort)
      let ip = null;
      try{
        const res = await fetch("https://api.ipify.org?format=json");
        if(res.ok){
          const j = await res.json();
          ip = j.ip;
        }
      }catch(err){
        // ignore ip fetch errors
      }

      const sess = YANLIK_AUTH.login(u,p, { ip });
      // if ip available, update user record (login function also uses options.ip)
      if(ip && sess) {
        // session already set inside login; ensure user record has ip saved
        try{ YANLIK_AUTH.setLastLoginIp(sess.id, ip); }catch{}
      }
      toast("Giriş başarılı.");
      redirectAfter(sess);
    }catch(err){
      toast(err.message || "Giriş başarısız");
    }
  });
})();