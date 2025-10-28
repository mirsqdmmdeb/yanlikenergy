// auth.js — Yanlik (client-only)
(function (W) {
  const KEY_USERS = "yanlik:users";
  const KEY_SESSION = "yanlik:session";
  const KEY_SETTINGS = "yanlik:settings";
  const KEY_CHATS = "yanlik:chats";

  function nowIso(){ return new Date().toISOString(); }
  function read(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch{ return def; } }
  function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  function uid(){ return "u_" + Math.random().toString(36).slice(2,10); }

  // --- seed (ilk kurulumda owner + admin) ---
  function seed(){
    const users = read(KEY_USERS, []);
    if(users.length) return;
    const base = nowIso();
    const data = [
      { id: uid(), username:"mirsqdmmdevs", role:"owner",   display:"Owner", pw:"no1hastasi", createdAt:base, lastLoginAt:null, lastIp:null },
      { id: uid(), username:"sudvci",       role:"admin",   display:"Admin", pw:"qwe124q",    createdAt:base, lastLoginAt:null, lastIp:null },
    ];
    write(KEY_USERS, data);
    write(KEY_SETTINGS, { ipShareAllowed:false });
    if(!read(KEY_CHATS, null)) write(KEY_CHATS, []);
  }
  seed();

  // --- public api ---
  const API = {
    // login / logout / session
    login({username, password}){
      const users = read(KEY_USERS, []);
      const u = users.find(x=>x.username===username && x.pw===password);
      if(!u) throw new Error("Kullanıcı ya da parola hatalı");
      u.lastLoginAt = nowIso();
      // IP: client-side, gerçek IP alınamaz; simülasyon
      u.lastIp = u.lastIp || "192.168.1.22"; 
      write(KEY_USERS, users);
      write(KEY_SESSION, { id:u.id, username:u.username, role:u.role, display:u.display });
      return { username:u.username, role:u.role, display:u.display };
    },
    logout(){ localStorage.removeItem(KEY_SESSION); },
    getSession(){ return read(KEY_SESSION, null); },

    // guard
    requireAuth(redirectTo="login.html", opt={}){
      const s = API.getSession();
      if(!s){ location.href = redirectTo; return null; }
      if(opt.requireRole){
        const roles = Array.isArray(opt.requireRole) ? opt.requireRole : [opt.requireRole];
        if(!roles.includes(s.role)){ location.href = redirectTo; return null; }
      }
      return s;
    },

    // users (admin/owner görünümü için)
    listUsersForAdmin(viewer){
      if(!viewer) throw new Error("session");
      const users = read(KEY_USERS, []);
      const settings = read(KEY_SETTINGS, { ipShareAllowed:false });
      return users.map(u=>{
        const masked = u.lastIp ? u.lastIp.split(".").slice(0,3).join(".") + ".x" : null;
        return {
          id: u.id,
          username: u.username,
          display: u.display,
          role: u.role,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          lastLoginIp: viewer.role==="owner" ? u.lastIp : (settings.ipShareAllowed && u.role!=="owner" ? masked : null)
        };
      });
    },
    getSettings(){ return read(KEY_SETTINGS, { ipShareAllowed:false }); },
    setSettings(patch, viewer){
      if(viewer?.role!=="owner") throw new Error("OWNER_ONLY");
      const s = API.getSettings();
      write(KEY_SETTINGS, Object.assign({}, s, patch));
    },

    // owner: create / change role / delete / change password
    createUser(viewer, { username, password, role="standard", display }){
      if(viewer?.role!=="owner") throw new Error("OWNER_ONLY");
      username=(username||"").trim(); password=(password||"").trim();
      if(!username || username.length<3) throw new Error("Kullanıcı adı kısa");
      if(!password || password.length<4) throw new Error("Parola kısa");
      const users=read(KEY_USERS, []);
      if(users.some(x=>x.username===username)) throw new Error("Bu kullanıcı adı var");
      if(!["owner","admin","standard","guest"].includes(role)) throw new Error("Rol yok");
      if(role==="owner") throw new Error("Yeni owner oluşturulamaz");
      const u={ id:uid(), username, pw:password, role, display:display||username, createdAt:nowIso(), lastLoginAt:null, lastIp:null };
      users.push(u); write(KEY_USERS, users);
      return { id:u.id, username:u.username, display:u.display, role:u.role };
    },
    changeRole(viewer, id, role){
      if(viewer?.role!=="owner") throw new Error("OWNER_ONLY");
      const users=read(KEY_USERS, []);
      const u=users.find(x=>x.id===id); if(!u) throw new Error("Yok");
      if(u.role==="owner") throw new Error("Owner dokunulmaz");
      if(!["admin","standard","guest"].includes(role)) throw new Error("Rol yok");
      u.role=role; write(KEY_USERS, users);
    },
    deleteUser(viewer, id){
      if(viewer?.role!=="owner") throw new Error("OWNER_ONLY");
      const users=read(KEY_USERS, []);
      const u=users.find(x=>x.id===id); if(!u) throw new Error("Yok");
      if(u.role==="owner") throw new Error("Owner dokunulmaz");
      write(KEY_USERS, users.filter(x=>x.id!==id));
    },
    changePassword(viewer, username, newPassword){
      const users=read(KEY_USERS, []);
      const target=users.find(x=>x.username===username);
      if(!target) throw new Error("Yok");
      if(viewer.role!=="owner" && viewer.username!==username) throw new Error("FORBIDDEN");
      if(target.role==="owner" && viewer.role!=="owner") throw new Error("OWNER_ONLY");
      if(!newPassword || newPassword.length<4) throw new Error("Parola kısa");
      target.pw=newPassword; write(KEY_USERS, users);
    },

    // chats
    listChats(){ return read(KEY_CHATS, []); },
    pushChat({ from, role, text }){
      const arr = read(KEY_CHATS, []);
      arr.push({ id:"m_"+Math.random().toString(36).slice(2,9), at:nowIso(), from, role, text });
      if(arr.length>2000) arr.shift();
      write(KEY_CHATS, arr);
    }
  };

  W.YANLIK_AUTH = API;
})(window);