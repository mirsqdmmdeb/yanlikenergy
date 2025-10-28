/* ============================================================
   YANLIK • login.js
   Basit form login → session set → role’a göre yönlendirme
   ============================================================ */

(function(){
  "use strict";

  const form = document.getElementById("loginForm");
  const uEl  = document.getElementById("u");
  const pEl  = document.getElementById("p");

  function toast(msg, type){
    if(window.UI && UI.toast) UI.toast(msg, type||"info");
    else alert(msg);
  }

  function redirectAfter(sess){
    // admin ise admin panele; değilse ana sayfaya
    if(sess?.role === "admin") location.href = "admin.html";
    else location.href = "index.html";
  }

  // eğer zaten girişliyse doğrudan yönlendir
  document.addEventListener("DOMContentLoaded", ()=>{
    try{
      const sess = YANLIK_AUTH.getSession();
      if(sess) redirectAfter(sess);
    }catch(e){ console.warn(e); }
  });

  form?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const u = (uEl?.value||"").trim();
    const p = (pEl?.value||"").trim();

    try{
      const sess = YANLIK_AUTH.login(u,p);
      toast("Giriş başarılı. Yönlendiriliyor...", "success");
      redirectAfter(sess);
    }catch(err){
      toast(err.message || "Giriş başarısız", "error");
    }
  });

})();