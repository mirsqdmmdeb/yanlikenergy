/* ============================================================
   YANLIK • auth.js
   LocalStorage tabanlı oturum & kullanıcı yönetimi
   Seed adminler:
   - sudvci / qwe124q
   - mirsqdmmdevs / no1hastasi
   ============================================================ */

(function (global) {
  "use strict";

  const KEY_USERS   = "yanlik.auth.users.v1";
  const KEY_SESSION = "yanlik.auth.session.v1";

  // ---- utils ----
  const jget = (k, d=null) => { try{ return JSON.parse(localStorage.getItem(k) || (d===null ? "null" : JSON.stringify(d))); }catch{ return d; } };
  const jset = (k, v)      => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };
  const nowIso = () => new Date().toISOString();

  // ---- seed users (if empty) ----
  function seedIfNeeded(){
    const had = jget(KEY_USERS, null);
    if (Array.isArray(had) && had.length > 0) return;

    const seed = [
      { username:"sudvci",      password:"qwe124q",     role:"admin", display:"sudvci" },
      { username:"mirsqdmmdevs", password:"no1hastasi", role:"admin", display:"mirsqdmmdevs" }
    ];
    jset(KEY_USERS, seed);
    // clear session on seed
    localStorage.removeItem(KEY_SESSION);
    console.log("[AUTH] Seed users created.");
  }

  function listUsers(){ return jget(KEY_USERS, []); }
  function saveUsers(arr){ jset(KEY_USERS, Array.isArray(arr)?arr:[]); }

  function getSession(){ return jget(KEY_SESSION, null); }
  function setSession(sess){ jset(KEY_SESSION, sess); }

  function login(username, password){
    username = (username||"").trim();
    password = (password||"").trim();
    if(!username || !password) throw new Error("Eksik bilgi");

    const users = listUsers();
    const hit = users.find(u => u.username === username);
    if(!hit) throw new Error("Kullanıcı bulunamadı");
    if(hit.password !== password) throw new Error("Parola hatalı");

    const sess = {
      username: hit.username,
      display:  hit.display || hit.username,
      role:     hit.role || "user",
      loginAt:  nowIso()
    };
    setSession(sess);
    return sess;
  }

  function logout(redirectUrl){
    localStorage.removeItem(KEY_SESSION);
    if(redirectUrl) location.href = redirectUrl;
  }

  function requireAuth(redirectUrl){
    const sess = getSession();
    if(!sess){
      if(redirectUrl) location.href = redirectUrl;
      return null;
    }
    return sess;
  }

  // public API
  const API = {
    seedIfNeeded, listUsers, saveUsers,
    getSession, setSession,
    login, logout, requireAuth
  };

  // boot
  seedIfNeeded();
  global.YANLIK_AUTH = API;
  console.log("[AUTH] ready");

})(window);