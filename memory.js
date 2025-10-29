window.YANLIK_MEM=(function(){
const K='yanlik:profile', KM='yanlik:memory';
const loadProfile=()=>JSON.parse(localStorage.getItem(K)||'{}');
const saveProfile=p=>localStorage.setItem(K,JSON.stringify(p));
const loadMemory=()=>JSON.parse(localStorage.getItem(KM)||'{}');
const saveMemory=m=>localStorage.setItem(KM,JSON.stringify(m));
const exportAll=()=>JSON.stringify({profile:loadProfile(),memory:loadMemory()},null,2);
const clearAll=()=>{localStorage.removeItem(K);localStorage.removeItem(KM)}
return {loadProfile,saveProfile,loadMemory,saveMemory,exportAll,clearAll};
})();