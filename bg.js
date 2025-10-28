// Neon ağ animasyonu
const bg = document.createElement("canvas");
bg.id = "bg";
document.body.prepend(bg);
const ctx = bg.getContext("2d");
function fit(){ bg.width = innerWidth; bg.height = innerHeight; }
fit(); addEventListener("resize", fit);

const P = Array.from({length:60},()=>({
  x: Math.random()*bg.width, y: Math.random()*bg.height,
  vx:(Math.random()-.5)*.4,  vy:(Math.random()-.5)*.4, r:1+Math.random()*2
}));

(function draw(){
  ctx.clearRect(0,0,bg.width,bg.height);
  for(const p of P){
    p.x+=p.vx; p.y+=p.vy;
    if(p.x<0||p.x>bg.width)p.vx*=-1;
    if(p.y<0||p.y>bg.height)p.vy*=-1;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283);
    ctx.fillStyle="#00c9ff55"; ctx.fill();
  }
  for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){
    const a=P[i], b=P[j], d=Math.hypot(a.x-b.x,a.y-b.y);
    if(d<130){ ctx.globalAlpha=1-d/130; ctx.strokeStyle="#00c9ff22";
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.globalAlpha=1; }
  }
  requestAnimationFrame(draw);
})();