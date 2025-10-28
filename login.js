(function(){
  "use strict";

  const form = document.getElementById("loginForm");
  const uEl  = document.getElementById("u");
  const pEl  = document.getElementById("p");

  function toast(msg){ if(window.UI?.toast) UI.toast(msg); else alert(msg); }
  function redirectAfter(sess){ if(sess?.role==="owner"||sess?.role==="admin") location.href="admin_users.html"; else location.href="index.html"; }

  document.addEventListener("DOMContentLoaded", ()=>{
    const int = setInterval(()=>{
      if(window.YANLIK_AUTH){ // wait seed init
        clearInterval(int);
        const sess = YANLIK_AUTH.getSession?.();
        if(sess) redirectAfter(sess);
      }
    }, 50);
  });

  form?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const u=(uEl?.value||"").trim(); const p=(pEl?.value||"").trim();
    try{
      let ip=null; try{ const r=await fetch("https://api.ipify.org?format=json"); if(r.ok){ ip=(await r.json()).ip; } }catch{}
      const sess = await YANLIK_AUTH.loginAsync(u,p,{ip});
      toast("Giriş başarılı.");
      redirectAfter(sess);
    }catch(err){ toast(err.message||"Giriş başarısız"); }
  });
})();