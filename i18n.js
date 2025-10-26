(async function () {
  const KEY = "yanlik.settings";
  let lang = "tr";
  try { lang = JSON.parse(localStorage.getItem(KEY)).language || "tr"; } catch {}
  async function load(l) {
    const res = await fetch(`./lang_${l}.json`);
    return res.ok ? res.json() : {};
  }
  const dict = await load(lang);
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.dataset.i18n;
    const val = key.split(".").reduce((a,k)=>(a&&a[k]!=null?a[k]:null), dict);
    if(typeof val==="string") el.textContent=val;
  });
})();