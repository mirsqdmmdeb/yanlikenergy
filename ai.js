<script>
/* Yanlik • Gelişmiş Yazılı Sohbet Motoru (offline) */
window.YANLIK = (function(){
  const uid=()=> "m_"+Math.random().toString(36).slice(2,9);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const esc=s=>(s||"").replace(/[<>&]/g,m=>({ '<':'&lt;','>':'&gt;','&':'&amp;'}[m]));

  const LANG={
    detect(t){const l=t.toLowerCase();return (/[çğıöşü]/.test(l)||/(merhaba|selam|nasıl|teşekkür|kanka|hocam|plan|özet)/.test(l))?'tr':'en'},
    t(k,l){const d={tr:{hi:"Merhaba! Nasıl yardımcı olabilirim?",timer_set:"Zamanlayıcı kuruldu (sekme açık kalmalı).",timer_fired:"⏰ Zamanlayıcı: süre doldu!",added:"Eklendi.",todo_list:"Yapılacaklar",empty:"Boş.",summary:"Özet"},en:{hi:"Hello! How can I help?",timer_set:"Timer set (keep this tab open).",timer_fired:"⏰ Timer: time is up!",added:"Added.",todo_list:"Todos",empty:"Empty.",summary:"Summary"}};return (d[l]&&d[l][k])||(d.tr[k]||k)}
  };

  const NEG=["üzgün","kötü","bunaldım","yorgun","kaygı","anksiyete","depresif","stres","korku","endişe","yalnız"];
  const POS=["harika","mükemmel","iyi","süper","sevindim","mutlu","şahane","enerjik","başardım"];
  function sentiment(s){const L=s.toLowerCase();let sc=0;NEG.forEach(w=>L.includes(w)&&sc--);POS.forEach(w=>L.includes(w)&&sc++);return clamp(sc,-2,2);}

  const intents=[
    {key:"greet",rx:/\b(merhaba|selam|hello|hi)\b/i},
    {key:"plan",rx:/(plan|program|hedef|roadmap)/i},
    {key:"todo_add",rx:/(todo|yapılacak|görev).*ekle|ekle .* (todo|yapılacak|görev)/i},
    {key:"todo_list",rx:/(todo|yapılacak).*(list|liste)/i},
    {key:"calc",rx:/^=(.+)$/i},
    {key:"shorten",rx:/(kısalt|shorten|tl;dr)/i},
    {key:"listify",rx:/(madde madde|listele|checklist)/i},
    {key:"translate",rx:/(çevir|translate|ingilizceye|türkçeye)/i},
    {key:"timer",rx:/(hatırlat|zamanlayıcı|timer|remind)/i},
    {key:"persona",rx:/(mod|persona|koç|asistan|mentor|friend)/i},
    {key:"memory",rx:/(hatırla|kaydet|hafızaya al|remember)/i},
    {key:"explain",rx:/(açıkla|explain|özet|summary|anlat)/i},
  ];
  const personas={friend:"💬",assistant:"🧩",coach:"🎯",mentor:"🧠"};

  function calc(expr){try{if(!/^[0-9+\-*/().\s%]+$/.test(expr))return null;const v=Function(`"use strict";return(${expr})`)();return Number.isFinite(v)?String(v):null}catch{return null}}
  function translate(txt,to){const dTR={merhaba:"hello",teşekkürler:"thanks",yardım:"help",hedef:"goal",adım:"step"};const dEN={hello:"merhaba",thanks:"teşekkürler",help:"yardım",goal:"hedef",step:"adım"};const W=txt.split(/\s+/);if(to==='en')return W.map(w=>dTR[w.toLowerCase()]||w).join(' ');if(to==='tr')return W.map(w=>dEN[w.toLowerCase()]||w).join(' ');return txt;}
  function makePlan(topic,lang){return lang==='tr'?[`🎯 Hedef: ${topic||'—'}`,`1) Kapsamı netleştir`,`2) 25+5 × 3`,`3) 3 madde not`,`4) Mini uygulama`,`5) 24s sonra 10 dk tekrar`].join('\n'):[`🎯 Goal: ${topic||'—'}`,`1) Clarify scope`,`2) 25+5 × 3`,`3) 3 bullets`,`4) Micro practice`,`5) Review in 24h`].join('\n');}

  function getIntent(s){for(const it of intents){const m=s.match(it.rx);if(m)return{key:it.key,match:m}}return{key:"chat"}}

  function respond(input,ctx){
    const lang=(ctx.profile?.lang&&ctx.profile.lang!=='auto')?ctx.profile.lang:LANG.detect(input);
    const persona=ctx.profile?.persona||'friend';
    const out=[]; const say=t=>out.push({id:uid(),role:'bot',text:t});
    if(/(intihar|kendime zarar|suicide|self harm)/i.test(input)){ say(lang==='tr'?"Güvenliğin öncelik: 112’yi ara. Yanındayım.":"Your safety first: call local emergency. I'm here."); return out; }

    const it=getIntent(input);

    if(it.key==="greet"){ say(`${personas[persona]||''} ${LANG.t('hi',lang)}`); return out; }
    if(it.key==="calc"){ const r=calc(it.match[1].trim()); say(r!=null?`🧮 ${r}`:(lang==='tr'?"Hesaplayamadım.":"Could not evaluate.")); return out; }
    if(it.key==="plan"){ const topic=input.replace(/.*plan\w*\s*/i,'').trim(); say(makePlan(topic,lang)); return out; }

    if(it.key==="todo_add"){ const item=input.replace(/.*(todo|yapılacak|görev)\s*/i,'').trim(); if(item){ const m=ctx.memory; m.todos=m.todos||[]; m.todos.push({id:uid(),text:item,done:false,at:Date.now()}); ctx.saveMemory(m); say("✅ "+LANG.t('added',lang)+": "+item);} else say(lang==='tr'?"Ne ekleyeyim?":"Add what?"); return out; }
    if(it.key==="todo_list"){ const t=(ctx.memory.todos||[]); say(t.length?("🗒️ "+LANG.t('todo_list',lang)+":\n"+t.map(x=>`${x.done?'[x]':'[ ]'} ${x.text}`).join('\n')):"🗒️ "+LANG.t('empty',lang)); return out; }

    if(it.key==="shorten"){ const src=input.replace(/(kısalt|shorten|tl;dr)/i,'').trim(); const s=src.split(/[.!?]\s+/).slice(0,2).join('. ')+(src.length>120?'…':''); say("✂️ TL;DR:\n"+s); return out; }
    if(it.key==="listify"){ const src=input.replace(/(madde madde|listele|checklist)/i,'').trim(); const L=src.split(/[.;]\s+|\n/g).filter(Boolean).slice(0,8).map(l=>"• "+l.trim()).join('\n'); say(L||"• Öğe 1\n• Öğe 2"); return out; }
    if(it.key==="translate"){ const to=LANG.detect(input)==='tr'?'en':'tr'; const text=input.replace(/(çevir|translate|ingilizceye|türkçeye)/gi,'').trim(); say(translate(text,to)); return out; }

    if(it.key==="timer"){ const m=input.match(/(\d+)\s*(dk|min|dakika|sn|saniye|sec)/i); if(m){ const n=parseInt(m[1],10); const ms=/(dk|min|dakika)/i.test(m[2])?n*60*1000:n*1000; setTimeout(()=>ctx.onNotify({text:LANG.t('timer_fired',lang)}),ms); say("⏱️ "+LANG.t('timer_set',lang)); } else say(lang==='tr'?"Örn: '5 dk sonra hatırlat'":"e.g. 'remind in 5 min'"); return out; }

    if(it.key==="persona"){ if(/koç|coach/i.test(input)) ctx.profile.persona='coach'; else if(/asistan|assistant/i.test(input)) ctx.profile.persona='assistant'; else if(/mentor/i.test(input)) ctx.profile.persona='mentor'; else ctx.profile.persona='friend'; ctx.saveProfile(ctx.profile); say("Moda geçildi: "+ctx.profile.persona); return out; }
    if(it.key==="memory"){ const note=input.replace(/(hatırla|kaydet|hafızaya al|remember)/i,'').trim(); if(note){ const m=ctx.memory; m.notes=m.notes||[]; m.notes.push({id:uid(),text:note,at:Date.now()}); ctx.saveMemory(m); say("🧾 Kaydettim."); } else say("Ne kaydedeyim?"); return out; }
    if(it.key==="explain"){ const core=input.replace(/(açıkla|explain|özet|summary|anlat)/i,'').trim()||"Konu"; say(`🧠 ${core}\n- Tanım\n- Neden önemli\n- 3 madde\n- Küçük adım`); return out; }

    // genel sohbet + empati
    const s=sentiment(input);
    if(s<=-1) say("Seni duyuyorum. 4-4-6 nefes? Küçük bir adım seçelim mi?");
    else if(s>=1) say("Harika enerji! Bunu sürdürmek için tek küçük adım seçelim.");
    else say("Anladım. Plan mı, özet mi, checklist mi istersin?");
    // mini özet (tarihten)
    const hist=(ctx.history||[]).slice(-6).map(m=>m.text).join(' ');
    if(hist){ const sum=hist.split(/\s+/).slice(0,40).join(' ')+(hist.length>160?'…':''); say("📝 "+LANG.t('summary',lang)+": "+sum); }
    return out;
  }

  return { respond };
})();
</script>