window.YANLIK_MEM=(function(){
const KEY="yanlik:profile";
function loadProfile(){return JSON.parse(localStorage.getItem(KEY)||"{}")}
function saveProfile(p){localStorage.setItem(KEY,JSON.stringify(p))}
function clear(){localStorage.removeItem(KEY)}
return {loadProfile,saveProfile,clear};
})();