(function(){
const KEY_USERS="yanlik:users",KEY_SESSION="yanlik:session";
function get(k){return JSON.parse(localStorage.getItem(k)||"null")}
function set(k,v){localStorage.setItem(k,JSON.stringify(v))}
function list(){return get(KEY_USERS)||[]}
function save(u){set(KEY_USERS,u)}
function signup(username,pass,display){
const u=list();if(u.find(x=>x.username===username))return{ok:false,msg:"Kullanıcı mevcut"};
u.push({username,pass,display,role:"member",createdAt:Date.now()});save(u);return{ok:true}}
function login(username,pass){
const u=list().find(x=>x.username===username&&x.pass===pass);
if(!u)return{ok:false};set(KEY_SESSION,u);return{ok:true}}
function current(){return get(KEY_SESSION)}
function logout(){localStorage.removeItem(KEY_SESSION)}
function requireAuth(r="login.html"){if(!current()){location.replace(r);return false;}return true}
window.YANLIK_AUTH={signup,login,current,logout,requireAuth};
})();