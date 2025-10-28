/* ============================================================
   YANLIK • auth.js (roles: admin, standard, guest)
   LocalStorage auth + guest session + guarded requireAuth
   + registerUser, setLastLoginIp, admin-safe listing
   ============================================================ */
(function (global) {
  "use strict";

  const KEY_USERS   = "yanlik.auth.users.v2";
  const KEY_SESSION = "yanlik.auth.session.v2";

  const jget = (k, d=null) => { try{ return JSON.parse(localStorage.getItem(k) || (d===null?"null":JSON.stringify(d))); }catch{ return d; } };
  const jset = (k, v)      => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };
  const nowIso = () => new Date().toISOString();
  const rid = () => Math.random().toString(36).slice(2,9);

  /* -----------------------
     Basic seed (local dev only)
     ----------------------- */
  function seedIfNeeded(){
    const had = jget(KEY_USERS, null);
    if (Array.isArray(had) && had.length > 0) return;
    const seed = [
      { id: "u-"+rid(), username:"sudvci",       password:"qwe124q",     role:"admin",    display:"Admin", createdAt: nowIso(), lastLoginAt:null, lastLoginIp:null },
      { id: "u-"+rid(), username:"mirsqdmmdevs", password:"no1hastasi",  role:"admin",    display:"Admin2", createdAt: nowIso(), lastLoginAt:null, lastLoginIp:null },
      { id: "u-"+rid(), username:"user",         password:"1234",        role:"standard", display:"Kullanıcı", createdAt: nowIso(), lastLoginAt:null, lastLoginIp:null }
    ];
    jset(KEY_USERS, seed);
    localStorage.removeItem(KEY_SESSION);
  }

  /* -----------------------
     Core getters/setters
     ----------------------- */
  function listUsers(){ return jget(KEY_USERS, []); }
  function saveUsers(arr){ jset(KEY_USERS, Array.isArray(arr)?arr:[]); }

  function getSession(){ return jget(KEY_SESSION, null); }
  function setSession(sess){ jset(KEY_SESSION, sess); }

  /* -----------------------
     Safe listings for UI
     - listUsersSafe() => for public UI (no pwd)
     - listUsersForAdmin() => admin view (no pwd, but includes IP & timestamps)
     ----------------------- */
  function listUsersSafe(){
    const u = listUsers();
    return (u||[]).map(user => ({
      id: user.id,
      username: user.username,
      display:  user.display || user.username,
      role:     user.role || "standard",
      createdAt: user.createdAt || null
    }));
  }

  function listUsersForAdmin(){
    // admin UI shows lastLoginAt, lastLoginIp but NOT passwords
    const u = listUsers();
    return (u||[]).map(user => ({
      id: user.id,
      username: user.username,
      display:  user.display || user.username,
      role:     user.role || "standard",
      createdAt: user.createdAt || null,
      lastLoginAt: user.lastLoginAt || null,
      lastLoginIp: user.lastLoginIp || null,
    }));
  }

  /* -----------------------
     Authentication
     ----------------------- */
  function findByUsername(username){
    const users = listUsers();
    return users.find(u => u.username === username);
  }

  function login(username, password, options = {}) {
    username = (username||"").trim();
    password = (password||"").trim();
    if(!username || !password) throw new Error("Eksik bilgi");
    const hit = findByUsername(username);
    if(!hit) throw new Error("Kullanıcı bulunamadı");
    if(hit.password !== password) throw new Error("Parola hatalı");

    const sess = {
      id: hit.id,
      username: hit.username,
      display: hit.display || hit.username,
      role: hit.role || "standard",
      loginAt: nowIso(),
      guest: false
    };
    setSession(sess);

    // update lastLoginAt
    updateUser(hit.id, { lastLoginAt: sess.loginAt });

    // optionally capture client IP if option is set (caller function should attempt fetch)
    if(options.ip) {
      updateUser(hit.id, { lastLoginIp: options.ip });
    }

    return sess;
  }

  function loginGuest(displayName){
    const sess = {
      id: "guest-"+rid(),
      username: "guest-"+rid(),
      display: displayName || "Misafir",
      role: "guest",
      loginAt: nowIso(),
      guest: true
    };
    setSession(sess);
    return sess;
  }

  function logout(redirectUrl){
    localStorage.removeItem(KEY_SESSION);
    if(redirectUrl) location.href = redirectUrl;
  }

  /* -----------------------
     Registration
     - username must be unique
     - minimal validation here (frontend)
     ----------------------- */
  function registerUser({ username, password, display }) {
    username = (username||"").trim();
    password = (password||"").trim();
    display  = (display  || username).trim();
    if(!username || !password) throw new Error("Kullanıcı adı ve parola gerekli");

    // simple checks
    if(findByUsername(username)) throw new Error("Bu kullanıcı adı zaten kullanılıyor");
    if(username.length < 3) throw new Error("Kullanıcı adı en az 3 karakter olmalı");
    if(password.length < 4) throw new Error("Parola en az 4 karakter olmalı");

    const users = listUsers();
    const newUser = {
      id: "u-"+rid(),
      username,
      password, // noter: frontend demo - productionda hashle
      display,
      role: "standard",
      createdAt: nowIso(),
      lastLoginAt: null,
      lastLoginIp: null
    };
    users.push(newUser);
    saveUsers(users);
    return { id: newUser.id, username: newUser.username, display: newUser.display, role: newUser.role };
  }

  /* -----------------------
     Admin actions (no password exposure):
     - promote/demote user role
     - delete user
     - change password (no show)
     - update lastLoginIp (called on login/profile)
     ----------------------- */
  function updateUser(id, patch){
    const users = listUsers();
    const idx = users.findIndex(u=>u.id === id);
    if(idx < 0) throw new Error("User not found");
    users[idx] = Object.assign({}, users[idx], patch);
    saveUsers(users);
    return users[idx];
  }

  function changePassword(username, newPassword){
    const users = listUsers();
    const idx = users.findIndex(u=>u.username === username);
    if(idx<0) throw new Error("Kullanıcı bulunamadı");
    users[idx].password = newPassword;
    saveUsers(users);
    return true;
  }

  function deleteUser(id){
    let users = listUsers();
    users = users.filter(u => u.id !== id);
    saveUsers(users);
    return true;
  }

  function setLastLoginIp(id, ip){
    if(!ip) return updateUser(id, { lastLoginIp: null });
    return updateUser(id, { lastLoginIp: ip });
  }

  /* -----------------------
     requireAuth helper
     ----------------------- */
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

  /* -----------------------
     Expose API
     ----------------------- */
  const API = {
    seedIfNeeded, listUsers, saveUsers,
    listUsersSafe, listUsersForAdmin,
    getSession, setSession,
    login, loginGuest, logout,
    registerUser,
    updateUser, deleteUser, changePassword,
    setLastLoginIp,
    requireAuth
  };

  seedIfNeeded();
  global.YANLIK_AUTH = API;
  // no console leaks of passwords
})(window);