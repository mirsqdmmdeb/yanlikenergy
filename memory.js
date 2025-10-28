<script>
window.YANLIK_MEM=(function(){
  const K={profile:"yanlik:profile", memory:"yanlik:memory", users:"yanlik:users", session:"yanlik:session"};
  const get=k=>JSON.parse(localStorage.getItem(k)||'null');
  const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

  function loadProfile(){ return get(K.profile)||{display:"Kullanıcı",lang:"auto",persona:"friend"}; }
  function saveProfile(p){ set(K.profile,p); }

  function loadMemory(){ return get(K.memory)||{todos:[],notes:[]}; }
  function saveMemory(m){ set(K.memory,m); }

  function exportAll(){ return JSON.stringify({profile:loadProfile(),memory:loadMemory()},null,2); }

  // basit yerel auth (opsiyonel)
  function listUsers(){ return get(K.users)||[]; }
  function saveUsers(u){ set(K.users,u); }
  function signup(username,password,display){
    const users=listUsers(); if(users.some(u=>u.username===username)) return false;
    users.push({username,pass:password,display,role:"member",createdAt:new Date().toISOString()}); saveUsers(users); return true;
  }
  function login(username,password){
    const u=listUsers().find(u=>u.username===username && u.pass===password); if(!u) return false;
    set(K.session,{username,display:u.display,role:u.role,at:Date.now()}); return true;
  }
  function current(){ return get(K.session); }
  function logout(){ localStorage.removeItem(K.session); }

  return { loadProfile, saveProfile, loadMemory, saveMemory, exportAll, signup, login, current, logout };
})();
</script>