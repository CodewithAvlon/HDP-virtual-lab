document.addEventListener('DOMContentLoaded', function(){
/* ═══════════════════════════════════════
   HERO PARTICLE CANVAS
═══════════════════════════════════════ */
(function(){
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  for(let i=0;i<120;i++) particles.push({
    x: Math.random()*2000, y: Math.random()*1000,
    vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.4,
    r: Math.random()*2+.5,
    a: Math.random()
  });
  function drawHero(){
    ctx.clearRect(0,0,W,H);
    // gradient background
    const g = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.7);
    g.addColorStop(0,'rgba(0,40,60,.9)');
    g.addColorStop(1,'rgba(5,11,20,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
    // particles
    particles.forEach(p=>{
      p.x += p.vx; p.y += p.vy;
      if(p.x<0) p.x=W; if(p.x>W) p.x=0;
      if(p.y<0) p.y=H; if(p.y>H) p.y=0;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(0,245,212,${p.a*.6})`;
      ctx.fill();
    });
    // connections
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<100){
          ctx.beginPath();
          ctx.moveTo(particles[i].x,particles[i].y);
          ctx.lineTo(particles[j].x,particles[j].y);
          ctx.strokeStyle=`rgba(0,245,212,${.15*(1-d/100)})`;
          ctx.lineWidth=.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(drawHero);
  }
  drawHero();
})();
});