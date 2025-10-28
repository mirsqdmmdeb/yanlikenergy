/* ============================================================
   YANLIK • auth.js v4
   Roles: owner, admin, standard, guest
   - Passwords: salted SHA-256 (WebCrypto)
   - Hard permissions:
       * ONLY owner ("mirsqdmmdevs") can change roles / delete users / change others' passwords
       * Admin cannot touch owner; cannot grant/revoke roles
       * IP visibility: owner full; admin masked unless owner allows (settings.ipShareAllowed)
   - Active sessions + idle tools
   ============================================================ */
(function (global) {
  "use strict";

  const KEY_USERS      = "yanlik.auth.users.v4";
  const KEY_SESSION    = "yanlik.auth.session.v4";
  const KEY_SESSION_ID = "yanlik.auth.sessionId.v4";
  const KEY_SESSIONS   = "yanlik.auth.sessions.v2";
  const KEY_SETTINGS   = "yanlik.auth.settings.v1"; // { ipShareAllowed:false }

  const jget = (k, d=null) => { try{ return JSON.parse(localStorage.getItem(k) || (d===null?"null":JSON.stringify(d))); }catch{ return d; } };
  const jset = (k, v)      => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };
  const jdel = (k)         => { try{ localStorage.removeItem(k); }catch{} };

  const nowIso = () => new Date().toISOString();
  const rid = (n=8) => Math.random().toString(36).slice(2,2+n);

  // ---------- WebCrypto helpers (SHA-256) ----------
  async function sha256(buf){
    const d = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  async function hashPw(password, saltHex){
    const enc = new TextEncoder();
    const salt = hexToBytes(saltHex);
    const data = new Uint8Array([...salt, ...enc.encode(password)]);
    return sha256(data);
  }
  function hexToBytes(hex){ const a=[]; for(let i=0;i<hex.length;i+=2){a.push(parseInt(hex.slice(i,i+2),16));} return new Uint8Array(a); }
  function randomHex(n=16){ return Array.from(crypto.getRandomValues(new Uint8Array(n))).map(b=>b.toString(16).padStart(2,"0")).join(""); }

  // ---------- seed (local demo) ----------
  async function seedIfNeeded(){
    const had = jget(KEY_USERS, null);
    if (Array.isArray(had) && had.length > 0) return;

    // owner: mirsqdmmdevs / no1hastasi
    const s1 = randomHex(16);
    const h1 = await hashPw("no1hastasi", s1);

    // helper admin: sudvci / qwe124q
    const s2 = randomHex(16);
    const h2 = await hashPw("qwe124q", s2);

    // standard: user / 1234
    const s3 = randomHex(16);
    const h3 = await hashPw("1234", s3);

    const seed = [
      { id:"u-"+rid(), username:"mirsqdmmdevs", role:"owner",   display:"Owner",    salt:s1, pwHash:h1, createdAt:nowIso(), lastLoginAt:null, lastLoginIp:null },
      { id:"u-"+rid(), username:"sudvci",       role:"admin",   display:"Admin",    salt:s2, pwHash:h2, createdAt:nowIso(), lastLoginAt:null, lastLoginIp:null },
      { id:"u-"+rid(), username:"user",         role:"standard",display:"Kullanıcı",salt:s3, pwHash:h3, createdAt:nowIso(), lastLoginAt:null, lastLoginIp:null },
    ];
    jset(KEY_USERS, seed);
    jset(KEY_SESSIONS, []);
    jset(KEY_SETTINGS, { ipShareAllowed: false });
    jdel(KEY_SESSION); jdel(KEY_SESSION_ID);
  }

  // ---------- core stores ----------
  function listUsers(){ return jget(KEY_USERS, []); }
  function saveUsers(arr){ jset(KEY_USERS, Array.isArray(arr)?arr:[]); }
  function getSettings(){ return jget(KEY_SETTINGS, { ipShareAllowed:false }); }
  function setSettings(patch, actor){
    if(!actor || actor.role!=="owner") throw new Error("Yetki dışı");
    const cur = getSettings();
    jset(KEY_SETTINGS, Object.assign({}, cur, patch||{}));
  }

  // ---------- sessions ----------
  function getSession(){ return jget(KEY_SESSION, null); }
  function setSession(sess){ jset(KEY_SESSION, sess); }
  function getSessionId(){ return localStorage.getItem(KEY_SESSION_ID) || null; }
  function setSessionId(id){ localStorage.setItem(KEY_SESSION_ID, id); }
  function getSessions(){ return jget(KEY_SESSIONS, []); }
  function saveSessions(arr){ jset(KEY_SESSIONS, Array.isArray(arr)?arr:[]); }
  function _startSessionRecord(user, ip){
    const sid = "s-"+rid(10);
    const now = Date.now();
    const ua  = navigator.userAgent || "unknown";
    const rec = { id:sid, userId:user.id, username:user.username, role:user.role, startedAt:nowIso(), lastSeen:now, ip:ip||null, ua, active:true };
    const arr = getSessions(); arr.unshift(rec); saveSessions(arr.slice(0,500));
    setSessionId(sid);
    localStorage.setItem(KEY_SESSIONS+".ping", String(now));
    return sid;
  }
  function endSession(sessionId){
    const arr = getSessions().map(s => s.id===sessionId ? {...s, active:false, endedAt:nowIso()} : s);
    saveSessions(arr);
  }
  function pingSession(){ const sid=getSessionId(); if(!sid) return; const arr=getSessions().map(s => s.id===sid ? {...s, lastSeen:Date.now()} : s); saveSessions(arr); }

  // ---------- utils ----------
  function findByUsername(username){ return listUsers().find(u=>u.username===username); }
  function maskIp(ip){
    if(!ip) return "-";
    // 1.2.3.4 → 1.2.3.x (IPv4 kaba maskeleme)
    const parts = ip.split(".");
    if(parts.length===4) { parts[3]="x"; return parts.join("."); }
    return ip.slice(0, ip.length-4) + "xxxx";
  }

  // ---------- auth ----------
  async function loginAsync(username, password, {ip}={}){
    username=(username||"").trim(); password=(password||"").trim();
    if(!username || !password) throw new Error("Eksik bilgi");
    const users = listUsers();
    const user = users.find(u=>u.username===username);
    if(!user) throw new Error("Kullanıcı bulunamadı");
    const testHash = await hashPw(password, user.salt);
    if(testHash !== user.pwHash) throw new Error("Parola hatalı");

    const sess = { id:user.id, username:user.username, display:user.display||user.username, role:user.role||"standard", loginAt:nowIso(), guest:false };
    setSession(sess);
    // kayıtlar
    user.lastLoginAt = sess.loginAt;
    if(ip) user.lastLoginIp = ip;
    saveUsers(users);
    _startSessionRecord(user, ip||null);
    return sess;
  }

  function loginGuest(displayName){
    const user = { id:"guest-"+rid(), username:"guest-"+rid(), role:"guest" };
    const sess = { id:user.id, username:user.username, display:displayName||"Misafir", role:"guest", loginAt:nowIso(), guest:true };
    setSession(sess);
    _startSessionRecord(user, null);
    return sess;
  }

  function logout(redirectUrl){
    const sid = getSessionId(); if(sid) endSession(sid);
    jdel(KEY_SESSION); jdel(KEY_SESSION_ID);
    if(redirectUrl) location.href = redirectUrl;
  }

  function requireAuth(redirectUrl, opts={}){
    const sess = getSession();
    const allowGuest = !!opts.allowGuest;
    const requireRole = opts.requireRole || null;
    if(!sess){ if(redirectUrl) location.href=redirectUrl; return null; }
    if(requireRole && sess.role !== requireRole){ if(redirectUrl) location.href="index.html"; return null; }
    if(!allowGuest && (sess.guest || sess.role==="guest")){ if(redirectUrl) location.href="login.html"; return null; }
    return sess;
  }

  // ---------- admin-safe listings ----------
  function listUsersForAdmin(viewer){
    const settings = getSettings();
    const canSeeFullIp = viewer?.role === "owner";
    const adminMaySeeIp = settings.ipShareAllowed && viewer?.role === "admin";

    return (listUsers()||[]).map(u => {
      const o = {
        id:u.id, username:u.username, display:u.display||u.username,
        role:u.role||"standard", createdAt:u.createdAt||null,
        lastLoginAt:u.lastLoginAt||null,
        lastLoginIp: null
      };
      if(canSeeFullIp) {
        o.lastLoginIp = u.lastLoginIp || null;
      } else if(adminMaySeeIp && u.role!=="owner") {
        o.lastLoginIp = u.lastLoginIp ? maskIp(u.lastLoginIp) : null;
      } else {
        o.lastLoginIp = null;
      }
      return o;
    });
  }

  // ---------- register / change password ----------
  async function registerUserAsync({ username, password, display }){
    username=(username||"").trim(); password=(password||"").trim(); display=(display||username).trim();
    if(!username || !password) throw new Error("Kullanıcı adı ve parola gerekli");
    if(username.length<3) throw new Error("Kullanıcı adı en az 3 karakter");
    if(password.length<4) throw new Error("Parola en az 4 karakter");
    if(findByUsername(username)) throw new Error("Bu kullanıcı adı zaten kullanılıyor");

    const salt = randomHex(16);
    const pwHash = await hashPw(password, salt);
    const users = listUsers();
    const newU = { id:"u-"+rid(), username, role:"standard", display, salt, pwHash, createdAt:nowIso(), lastLoginAt:null, lastLoginIp:null };
    users.push(newU); saveUsers(users);
    return { id:newU.id, username:newU.username, display:newU.display, role:newU.role };
  }

  async function changePasswordAsync(actorSess, username, newPassword){
    newPassword=(newPassword||"").trim();
    if(newPassword.length<4) throw new Error("Parola en az 4 karakter");
    const users = listUsers();
    const idx = users.findIndex(u=>u.username===username);
    if(idx<0) throw new Error("Kullanıcı bulunamadı");

    const target = users[idx];
    const actorIsOwner = actorSess?.role==="owner";
    const actorIsSelf  = actorSess && actorSess.username === username;

    if(!actorIsOwner && !actorIsSelf) throw new Error("Yetki dışı");
    if(target.role==="owner" && !actorIsOwner) throw new Error("Owner şifresi sadece owner tarafından değiştirilebilir");

    const salt = randomHex(16);
    const pwHash = await hashPw(newPassword, salt);
    users[idx].salt = salt; users[idx].pwHash = pwHash;
    saveUsers(users);
    return true;
  }

  // ---------- role & delete (owner-only) ----------
  function changeRole(actorSess, targetId, newRole){
    if(actorSess?.role!=="owner") throw new Error("Sadece owner rol atayabilir");
    const users = listUsers();
    const idx = users.findIndex(u=>u.id===targetId); if(idx<0) throw new Error("Kullanıcı yok");
    if(users[idx].role==="owner") throw new Error("Owner rolü değiştirilemez");
    if(!["admin","standard","guest"].includes(newRole)) throw new Error("Geçersiz rol");
    users[idx].role = newRole; saveUsers(users); return true;
  }
  function deleteUser(actorSess, targetId){
    if(actorSess?.role!=="owner") throw new Error("Sadece owner silebilir");
    const users = listUsers();
    const victim = users.find(u=>u.id===targetId);
    if(!victim) throw new Error("Kullanıcı yok");
    if(victim.role==="owner") throw new Error("Owner silinemez");
    saveUsers(users.filter(u=>u.id!==targetId));
    return true;
  }

  // ---------- export ----------
  const API = {
    // boot
    seedIfNeeded,
    // session
    getSession, setSession, getSessionId, getSessions, pingSession, logout, requireAuth,
    // auth
    loginAsync, loginGuest,
    // users
    listUsers, saveUsers, listUsersForAdmin, registerUserAsync, changePasswordAsync,
    changeRole, deleteUser,
    // settings
    getSettings, setSettings,
    // util
    maskIp
  };

  // async seed (because hashing)
  seedIfNeeded().then(()=>{ global.YANLIK_AUTH = API; }).catch(e=>{ console.error(e); global.YANLIK_AUTH = API; });

  // storage sync notice (admin pages can listen)
  window.addEventListener("storage", (e)=>{
    if(e.key && (e.key.startsWith(KEY_SESSIONS))) {
      // listeners in admin pages will react
    }
  });
})(window);