/* ============================================================
   YANLIK • auth.js (roles: admin, standard, guest)
   LocalStorage auth + guest session + guarded requireAuth
   UI'ya parola/seed bilgisi ASLA gösterilmez.
   listUsersSafe() ile parola gizlenmiş kullanıcı listesi döner.
   ============================================================ */
(function (global) {
  "use strict";

  const KEY_USERS   = "yanlik.auth.users.v1";
  const KEY_SESSION = "yanlik.auth.session.v1";

  const jget = (k, d=null) => { try{ return JSON.parse(localStorage.getItem(k) || (d===null?"null":JSON.stringify(d))); }catch{ return d; } };
  const jset = (k, v)      => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };
  const nowIso = () => new Date().toISOString();
  const rid = () => Math.random().toString(36).slice(2,8);

  /**
   * seedIfNeeded()
   * - seed yerel olarak oluşturur ama artık UI'ya yazdırılmaz.
   * - production için burayı kaldırıp server-side kimlik doğrulamaya geç.
   */
  function seedIfNeeded(){
    const had = jget(KEY_USERS, null);
    if (Array.isArray(had) && had.length > 0) return;
    const seed = [
      // NOT: Bu ön tanımlı hesaplar yalnızca local test içindir.
      //       Parolalar tarayıcıda düz metin olarak saklandığı için
      //       canlı ortamda BU YAKLAŞIMI KULLANMAYIN.
      { username:"sudvci",       password:"qwe124q",     role:"admin",    display:"Admin" },
      { username:"mirsqdmmdevs", password:"no1hastasi",  role:"admin",    display:"Admin2" },
      { username:"user",         password:"1234",        role:"standard", display:"Kullanıcı" },
    ];
    jset(KEY_USERS, seed);
    localStorage.removeItem(KEY_SESSION);
    // console.log kapalı — hassas bilgi gösterilmesin
  }

  function listUsers(){ return jget(KEY_USERS, []); }
  function saveUsers(arr){ jset(KEY_USERS, Array.isArray(arr)?arr:[]); }

  /**
   * listUsersSafe()
   * UI'lar için PAROLAYI ASLA döndürmez.
   * Parolaları maskeler ve yalnızca: username, display, role döner.
   */
  function listUsersSafe(){
    const u = listUsers();
    return (u||[]).map(user => ({
      username: user.username,
      display:  user.display || user.username,
      role:     user.role || "standard",
      guest:    !!user.guest
    }));
  }

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
      role:     hit.role || "standard",
      loginAt:  nowIso(),
      guest:    !!hit.guest
    };
    setSession(sess);
    return sess;
  }

  // Guest mode
  function loginGuest(displayName){
    const sess = {
      username: "guest-"+rid(),
      display:  (displayName||"Misafir"),
      role:     "guest",
      loginAt:  nowIso(),
      guest:    true
    };
    setSession(sess);
    return sess;
  }

  function isGuest(){
    const s = getSession();
    return !!(s && (s.guest || s.role === "guest"));
  }

  function logout(redirectUrl){
    localStorage.removeItem(KEY_SESSION);
    if(redirectUrl) location.href = redirectUrl;
  }

  /**
   * requireAuth(redirectUrl, opts?)
   * opts.allowGuest = true → misafirler de geçer
   * opts.requireRole = "admin" → sadece admin geçer
   */
  function requireAuth(redirectUrl, opts={}){
    const sess = getSession();
    const allowGuest = !!opts.allowGuest;
    const requireRole = opts.requireRole || null;

    if(!sess){
      if(redirectUrl) location.href = redirectUrl;
      return null;
    }
    if(requireRole && sess.role !== requireRole){
      if(redirectUrl) location.href = "index.html";
      return null;
    }
    if(!allowGuest && (sess.guest || sess.role === "guest")){
      if(redirectUrl) location.href = "login.html";
      return null;
    }
    return sess;
  }

  // Admin panelde kullanıcı silme/ekleme işlemi yapıldığında
  // parola asla UI'da gösterilmesin. Parolayı değiştirmek için
  // admin panelinde özel bir form yapılmalı (eski şifre sorulup yeni şifre set).
  function changePassword(username, newPassword){
    const users = listUsers();
    const idx = users.findIndex(u=>u.username===username);
    if(idx<0) throw new Error("Kullanıcı bulunamadı");
    users[idx].password = newPassword;
    saveUsers(users);
    return true;
  }

  const API = {
    seedIfNeeded, listUsers, listUsersSafe, saveUsers,
    getSession, setSession,
    login, loginGuest, isGuest,
    logout, requireAuth,
    changePassword
  };

  seedIfNeeded();
  global.YANLIK_AUTH = API;
  // console.log kapatıldı; gizli kalması için
})(window);