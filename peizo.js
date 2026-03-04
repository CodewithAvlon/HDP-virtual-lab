document.addEventListener('DOMContentLoaded', function(){
/* ═══════════════════════════════════════
   PIEZO CRYSTAL VISUALIZER
═══════════════════════════════════════ */
const pCanvas = document.getElementById('piezoCanvas');
const pCtx = pCanvas.getContext('2d');
let pT=0;

const piezoFreqSlider = document.getElementById('piezo-freq');
const piezoAmpSlider  = document.getElementById('piezo-amp');
piezoFreqSlider.addEventListener('input',()=>{
  document.getElementById('piezo-freq-label').textContent = piezoFreqSlider.value+' Hz';
});
piezoAmpSlider.addEventListener('input',()=>{
  document.getElementById('piezo-amp-label').textContent = piezoAmpSlider.value+'%';
});

function drawPiezo(){
  const W=pCanvas.width, H=pCanvas.height;
  pCtx.clearRect(0,0,W,H);
  pCtx.fillStyle='#020810'; pCtx.fillRect(0,0,W,H);

  const freq = +piezoFreqSlider.value;
  const ampPct = +piezoAmpSlider.value/100;
  const stress = Math.sin(pT*freq*.05)*ampPct;

  // Compression arrows
  const arrowLen = 30 + 20*Math.abs(stress);
  pCtx.strokeStyle = `rgba(245,166,35,${.5+.5*Math.abs(stress)})`;
  pCtx.lineWidth = 3;
  // left arrow
  pCtx.beginPath(); pCtx.moveTo(30,H/2); pCtx.lineTo(30+arrowLen,H/2); pCtx.stroke();
  pCtx.beginPath(); pCtx.moveTo(30+arrowLen,H/2); pCtx.lineTo(30+arrowLen-8,H/2-6); pCtx.stroke();
  pCtx.beginPath(); pCtx.moveTo(30+arrowLen,H/2); pCtx.lineTo(30+arrowLen-8,H/2+6); pCtx.stroke();
  // right arrow
  pCtx.beginPath(); pCtx.moveTo(W-30,H/2); pCtx.lineTo(W-30-arrowLen,H/2); pCtx.stroke();
  pCtx.beginPath(); pCtx.moveTo(W-30-arrowLen,H/2); pCtx.lineTo(W-30-arrowLen+8,H/2-6); pCtx.stroke();
  pCtx.beginPath(); pCtx.moveTo(W-30-arrowLen,H/2); pCtx.lineTo(W-30-arrowLen+8,H/2+6); pCtx.stroke();

  // Crystal lattice
  const rows=5, cols=8;
  const cx=W/2, cy=H/2;
  const gx=(W-120)/cols, gy=60;
  const squish = stress * 8;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x = 60 + c*gx + (r%2)*gx/2;
      const y = cy - (rows/2)*gy + r*gy + squish*r;

      // positive ion (blue)
      pCtx.beginPath();
      pCtx.arc(x,y,7,0,Math.PI*2);
      pCtx.fillStyle = stress > 0 ?
        `rgba(0,150,255,${.8+.2*stress})` : `rgba(0,100,200,.6)`;
      pCtx.fill();
      pCtx.fillStyle='#fff'; pCtx.font='7px Space Mono';
      pCtx.textAlign='center'; pCtx.textBaseline='middle';
      pCtx.fillText('+',x,y);

      // negative ion offset by stress
      const nx = x + gx/2;
      const ny = y + gy/2 + squish;
      if(nx<W-50){
        pCtx.beginPath();
        pCtx.arc(nx,ny,7,0,Math.PI*2);
        pCtx.fillStyle = stress < 0 ?
          `rgba(255,50,150,${.8-stress*.2})` : `rgba(200,40,120,.6)`;
        pCtx.fill();
        pCtx.fillStyle='#fff'; pCtx.font='7px Space Mono';
        pCtx.fillText('−',nx,ny);
      }
    }
  }

  // Electric field lines when stressed
  if(Math.abs(stress) > 0.1){
    const alpha = Math.abs(stress)*.8;
    pCtx.strokeStyle = `rgba(224,64,251,${alpha})`;
    pCtx.lineWidth = 1.5;
    pCtx.setLineDash([4,6]);
    for(let i=0;i<5;i++){
      const lx = 70 + i*(W-140)/4;
      pCtx.beginPath();
      pCtx.moveTo(lx, cy-80);
      pCtx.lineTo(lx, cy+80);
      pCtx.stroke();
      // arrow tip
      const dir = stress > 0 ? -1 : 1;
      pCtx.beginPath();
      pCtx.moveTo(lx, cy-60*dir);
      pCtx.lineTo(lx-5, cy-50*dir);
      pCtx.moveTo(lx, cy-60*dir);
      pCtx.lineTo(lx+5, cy-50*dir);
      pCtx.stroke();
    }
    pCtx.setLineDash([]);
  }

  // surface charge indicators
  const chargeStr = `Q = ${(300*5*Math.abs(stress)).toFixed(0)} pC`;
  pCtx.fillStyle=`rgba(0,245,212,${Math.abs(stress)+.2})`;
  pCtx.font='bold 11px Space Mono';
  pCtx.textAlign='center';
  pCtx.fillText(chargeStr, W/2, H-15);

  pT += .5;
  requestAnimationFrame(drawPiezo);
}
drawPiezo();
});