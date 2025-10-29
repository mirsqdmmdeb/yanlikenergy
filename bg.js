(function(){
  const c = document.getElementById('bg') || (()=>{const x=document.createElement('canvas');x.id='bg';document.body.prepend(x);return x})();
  const ctx = c.getContext('2d');
  let W=innerWidth,H=innerHeight, raf, mode = localStorage.getItem('yanlik:anim') || 'neon';

  function fit(){ W=innerWidth; H=innerHeight; c.width=W; c.height=H; }
  addEventListener('resize', fit); fit();

  // --------- helpers ----------
  const R = n => Math.random()*n;
  const RR = (a,b)=> a + Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  // --------- anim cores ----------
  let state = {};

  function neon_init(){
    const N = 64;
    state.pts = Array.from({length:N},()=>({x:R(W),y:R(H),vx:RR(-.4,.4),vy:RR(-.4,.4),r:1+R(2)}));
  }
  function neon_draw(){
    ctx.clearRect(0,0,W,H);
    const P=state.pts;
    for(const p of P){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>W) p.vx*=-1;
      if(p.y<0||p.y>H) p.vy*=-1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle="#00c9ff55"; ctx.fill();
    }
    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){
      const a=P[i], b=P[j], d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d<130){ ctx.globalAlpha = 1-d/130; ctx.strokeStyle="#00c9ff22";
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.globalAlpha=1; }
    }
  }

  function stars_init(){
    state.stars = Array.from({length:180},()=>({x:R(W),y:R(H),z:RR(.2,1.5)}));
  }
  function stars_draw(){
    ctx.fillStyle="#000000"; ctx.fillRect(0,0,W,H);
    for(const s of state.stars){
      s.x += (s.x-W/2)*0.00002; s.y += (s.y-H/2)*0.00002; // hafif parallax
      ctx.fillStyle="rgba(255,255,255,"+(0.3+Math.random()*0.7)+")";
      ctx.fillRect(s.x, s.y, s.z, s.z);
    }
  }

  function wave_init(){
    state.t = 0;
  }
  function wave_draw(){
    ctx.clearRect(0,0,W,H);
    state.t += 0.02;
    for(let y=0;y<H;y+=8){
      ctx.strokeStyle="#00c9ff22"; ctx.beginPath();
      for(let x=0;x<W;x+=8){
        const yy = y + Math.sin((x*0.01)+state.t)*6*Math.sin(state.t*0.7);
        if(x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
      }
      ctx.stroke();
    }
  }

  function matrix_init(){
    const cols = Math.floor(W/16);
    state.drops = Array(cols).fill(0).map(()=>RR(0,H));
    state.chars = 'アァカサタナハマヤャラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  function matrix_draw(){
    ctx.fillStyle="rgba(0,0,0,0.1)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#00ff6a"; ctx.font="16px monospace";
    const cols = state.drops.length;
    for(let i=0;i<cols;i++){
      const txt = state.chars[Math.floor(Math.random()*state.chars.length)];
      const x = i*16; const y = state.drops[i]*16;
      ctx.fillText(txt,x,y);
      if(y>H && Math.random()>0.975) state.drops[i]=0;
      state.drops[i]++;
    }
  }

  function orbs_init(){
    const N=30;
    state.orbs = Array.from({length:N},()=>({x:R(W),y:R(H),r:RR(20,70),vx:RR(-.6,.6),vy:RR(-.6,.6),h:R(360)}));
  }
  function orbs_draw(){
    ctx.clearRect(0,0,W,H);
    for(const o of state.orbs){
      o.x+=o.vx; o.y+=o.vy; o.h=(o.h+0.5)%360;
      if(o.x-o.r<0||o.x+o.r>W) o.vx*=-1;
      if(o.y-o.r<0||o.y+o.r>H) o.vy*=-1;
      const g=ctx.createRadialGradient(o.x,o.y,o.r*0.1,o.x,o.y,o.r);
      g.addColorStop(0,`hsla(${o.h},100%,60%,.6)`);
      g.addColorStop(1,`hsla(${o.h},100%,50%,0)`);
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
    }
  }

  function gridflow_init(){
    state.t=0;
  }
  function gridflow_draw(){
    ctx.clearRect(0,0,W,H);
    state.t+=0.02;
    for(let x=0;x<W;x+=20){
      for(let y=0;y<H;y+=20){
        const a = Math.sin(x*0.01+state.t)+Math.cos(y*0.01+state.t);
        const xx = x + Math.sin(a)*4, yy = y + Math.cos(a)*4;
        ctx.fillStyle="#00c9ff22"; ctx.fillRect(xx,yy,2,2);
      }
    }
  }

  function triangulate_init(){
    const N=70;
    state.pts = Array.from({length:N},()=>({x:R(W),y:R(H)}));
    state.t=0;
  }
  function triangulate_draw(){
    ctx.clearRect(0,0,W,H);
    state.t+=0.005;
    const P=state.pts;
    // hafif dalgalanma
    for(const p of P){ p.x= (p.x+Math.sin(p.y*0.01+state.t*8))*1; p.y= (p.y+Math.cos(p.x*0.01+state.t*8))*1; }
    // komşuya çiz
    ctx.strokeStyle="#00c9ff15";
    for(let i=0;i<P.length;i++){
      const a=P[i];
      let b=P[(i+1)%P.length], d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d<200){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
    }
  }

  const table = {
    neon:       [neon_init, neon_draw],
    stars:      [stars_init, stars_draw],
    wave:       [wave_init, wave_draw],
    matrix:     [matrix_init, matrix_draw],
    orbs:       [orbs_init, orbs_draw],
    gridflow:   [gridflow_init, gridflow_draw],
    triangulate:[triangulate_init, triangulate_draw],
  };

  function loop(){
    const draw = table[mode]?.[1];
    draw && draw();
    raf = requestAnimationFrame(loop);
  }

  function setAnimation(m){
    if(!table[m]) m='neon';
    mode = m;
    cancelAnimationFrame(raf);
    state = {};
    table[mode][0](); // init
    loop();
  }

  // boot
  setAnimation(mode);

  // expose
  window.YANLIK_BG = { setAnimation };
})();