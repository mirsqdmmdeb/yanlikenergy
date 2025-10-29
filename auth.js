(function(){
const K={USERS:'yanlik:users',SESSION:'yanlik:session'};
const get=k=>JSON.parse(localStorage.getItem(k)||'null'), set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function users(){return get(K.USERS)||[]} function save(u){set(K.USERS,u)}
// seed owner/admin (gizli)
(function seed(){const u=users();
if(!u.some(x=>x.username==='mirsqdmmdevs'))u.push({username:'mirsqdmmdevs',pass:'no1hastasi',display:'Ana Yönetici',role:'owner',createdAt:Date.now()});
if(!u.some(x=>x.username==='sudvci'))u.push({username:'sudvci',pass:'qwe124q',display:'Yardımcı',role:'admin',createdAt:Date.now()});
save(u);})();
function signup(username,pass,display){const u=users(); if(u.find(x=>x.username===username))return{ok:false,msg:'Kullanıcı mevcut'};
u.push({username,pass,display:display||username,role:'member',createdAt:Date.now()}); save(u); return{ok:true}}
function login(username,pass){const u=users().find(x=>x.username===username&&x.pass===pass); if(!u)return{ok:false};
set(K.SESSION,{username:u.username,display:u.display,role:u.role,at:Date.now()}); return{ok:true}}
function current(){return get(K.SESSION)} function logout(){localStorage.removeItem(K.SESSION)}
function requireAuth(redirect='login.html'){if(!current()){location.replace(redirect);return false} return true}
function requireRole(roles=['owner','admin'],redirect='index.html'){const s=current(); if(!s||!roles.includes(s.role)){location.replace(redirect);return false} return true}
window.YANLIK_AUTH={signup,login,current,logout,requireAuth,requireRole,users};
})();