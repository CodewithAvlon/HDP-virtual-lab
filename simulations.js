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

/* ═══════════════════════════════════════
   OSCILLOSCOPE
═══════════════════════════════════════ */
const oscCanvas = document.getElementById('oscCanvas');
const oscCtx = oscCanvas.getContext('2d');
const fftCanvas = document.getElementById('fftCanvas');
const fftCtx = fftCanvas.getContext('2d');

let oscFreq=100, oscForce=5, oscD=300, oscNoise=5, oscT=0;

function getSliders(){
  oscFreq = +document.getElementById('freqSlider').value;
  oscForce = +document.getElementById('forceSlider').value;
  oscD = +document.getElementById('dSlider').value;
  oscNoise = +document.getElementById('noiseSlider').value;

  document.getElementById('freqLabel').textContent = oscFreq+' Hz';
  document.getElementById('forceLabel').textContent = oscForce.toFixed(1)+' N';
  document.getElementById('dLabel').textContent = oscD+' pC/N';
  document.getElementById('noiseLabel').textContent = oscNoise+'%';

  const Q = oscD * oscForce;
  const V = (Q / (100e9)) * 1e3; // mV (assume 100nF cap)
  document.getElementById('chargeOut').textContent = Q.toFixed(0);
  document.getElementById('voltOut').textContent = V.toFixed(4);
  document.getElementById('freqOut').textContent = oscFreq;
  document.getElementById('harmOut').textContent = oscFreq*2;
}

['freqSlider','forceSlider','dSlider','noiseSlider'].forEach(id=>{
  document.getElementById(id).addEventListener('input', getSliders);
});
getSliders();

function drawOscilloscope(){
  const W = oscCanvas.width, H = oscCanvas.height;
  oscCtx.clearRect(0,0,W,H);

  // background scanline
  oscCtx.fillStyle='#020a04'; oscCtx.fillRect(0,0,W,H);

  // glow waveform
  const amp = Math.min(H/2*.85, (oscD*oscForce/3000)*H/2*.85);
  const noiseMag = amp*(oscNoise/100);

  oscCtx.shadowBlur = 8;
  oscCtx.shadowColor = '#00ff80';
  oscCtx.strokeStyle = '#00ff80';
  oscCtx.lineWidth = 2;
  oscCtx.beginPath();
  for(let x=0;x<W;x++){
    const t = oscT + x/W;
    const w = 2*Math.PI*oscFreq;
    const y = H/2
      - Math.sin(w*t/100)*amp
      - Math.sin(2*w*t/100)*amp*.3  // 2nd harmonic
      - Math.sin(3*w*t/100)*amp*.1  // 3rd harmonic
      + (Math.random()-.5)*noiseMag;
    x===0 ? oscCtx.moveTo(x,y) : oscCtx.lineTo(x,y);
  }
  oscCtx.stroke();
  oscCtx.shadowBlur=0;
  oscT += 0.3;
  requestAnimationFrame(drawOscilloscope);
}
drawOscilloscope();

function drawFFT(){
  const W = fftCanvas.width, H = fftCanvas.height;
  fftCtx.clearRect(0,0,W,H);
  fftCtx.fillStyle='#040a12'; fftCtx.fillRect(0,0,W,H);

  const maxFreq = 600;
  const binW = W/maxFreq;

  // draw frequency bins
  const fundamentals = [oscFreq, oscFreq*2, oscFreq*3, oscFreq*4];
  const amps = [1, .5, .25, .1];

  for(let f=1;f<maxFreq;f++){
    let height = 2;
    fundamentals.forEach((fn,i)=>{
      const dist = Math.abs(f-fn);
      if(dist<6) height = Math.max(height, H*amps[i]*(1-dist/6) + Math.random()*4);
    });
    const hue = 180 + (f/maxFreq)*60;
    fftCtx.fillStyle = `hsla(${hue},100%,60%,.9)`;
    fftCtx.fillRect(f*binW, H-height, Math.max(binW-.5,1), height);
  }

  // x axis labels
  fftCtx.fillStyle='rgba(0,150,255,.5)';
  fftCtx.font='9px Space Mono';
  [100,200,300,400,500].forEach(f=>{
    const x = (f/maxFreq)*W;
    fftCtx.fillText(f+'Hz', x-10, H-2);
  });
  requestAnimationFrame(drawFFT);
}
drawFFT();

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

/* ═══════════════════════════════════════
   CALCULATORS
═══════════════════════════════════════ */
/* ── CALCULATOR FUNCTIONS ── */
function calcForce(){
  const m=+document.getElementById('f_mass').value;
  const v=+document.getElementById('f_vel').value;
  const d=+document.getElementById('f_dist').value;
  if(!m||!v||!d) return;
  const F=(0.5*m*v*v)/d;
  const context = F>5000?'⚠ Very high — glass/metal deformation likely'
    :F>1000?'⚡ High — would trigger car knock alarm'
    :F>200?'⚠ Moderate — crack or alert zone'
    :'✅ Low — below typical alarm threshold';
  document.getElementById('res_force').innerHTML =
    `F = <strong>${F.toFixed(0)} N</strong> &nbsp;&nbsp;(${(F/9.81).toFixed(1)} kgf)<br>
     <span style="font-size:.65rem;color:var(--dim)">½mv²/d = ½ × ${m} × ${v}² ÷ ${d}</span><br>
     <span style="font-size:.65rem;color:var(--accent2)">${context}</span>`;
}
function calcCharge(){
  const d=+document.getElementById('c_d33').value;
  const f=+document.getElementById('c_force').value;
  if(!d||!f) return;
  const Q=d*f;
  const note = d>=500?'PZT-5H (HDP sensor) — maximum sensitivity':d>=200?'Standard PZT ceramic':'Low-sensitivity material';
  document.getElementById('res_charge').innerHTML =
    `Q = <strong>${Q.toLocaleString()} pC</strong><br>
     <span style="font-size:.65rem;color:var(--dim)">= ${(Q/1e12).toExponential(3)} C &nbsp;·&nbsp; ${note}</span><br>
     <span style="font-size:.65rem;color:var(--accent)">→ Paste this Q into the Voltage calculator ↓</span>`;
}
function calcVoltage(){
  const Q=+document.getElementById('c_q').value;
  const C=+document.getElementById('c_cap').value;
  if(!Q||!C) return;
  const V_V = (Q*1e-12)/(C*1e-9);
  const V_mV = V_V*1000;
  const adcNote = V_mV>=50?'✅ Arduino ADC can read this (>50mV threshold)'
    :V_mV>=5?'⚠ Too low — Op-Amp gain needed to reach ADC threshold'
    :'❌ Too weak — increase gain or use more sensitive sensor';
  document.getElementById('res_voltage').innerHTML =
    `V = <strong>${V_mV.toFixed(2)} mV</strong> &nbsp;(${V_V.toFixed(6)} V)<br>
     <span style="font-size:.65rem;color:var(--dim)">Q=${Q} pC ÷ C=${C} nF</span><br>
     <span style="font-size:.65rem;color:var(--accent3)">${adcNote}</span>`;
}
function calcFreq(){
  const v=+document.getElementById('c_v').value;
  const t=+document.getElementById('c_t').value*1e-3;
  if(!v||!t) return;
  const f=v/(2*t);
  const context = f>50000?'Ultrasonic range — medical / sonar'
    :f>10000?'Glass break range (3–10 kHz) — anti-theft use ✅'
    :f>500?'Car knock range (200–1000 Hz) — automotive use ✅'
    :'Low frequency — structural health monitoring';
  document.getElementById('res_freq').innerHTML =
    `f = <strong>${f>=1000?(f/1000).toFixed(2)+' kHz':f.toFixed(0)+' Hz'}</strong><br>
     <span style="font-size:.65rem;color:var(--dim)">v/(2t) = ${v} ÷ (2 × ${(t*1000).toFixed(2)}mm)</span><br>
     <span style="font-size:.65rem;color:#00c8ff">${context}</span>`;
}
function calcEnergy(){
  const C=+document.getElementById('e_cap').value*1e-9;
  const V=+document.getElementById('e_v').value;
  if(!C||!V) return;
  const E=0.5*C*V*V;
  const E_nJ=E*1e9;
  const context = E_nJ>1000?'✅ Enough to flash an LED (~1 μJ needed)'
    :E_nJ>100?'⚠ Enough for a microcontroller wake-up pulse'
    :'Small — good for low-power sensing only';
  document.getElementById('res_energy').innerHTML =
    `E = <strong>${E_nJ>=1000?(E_nJ/1000).toFixed(3)+' μJ':E_nJ.toFixed(3)+' nJ'}</strong><br>
     <span style="font-size:.65rem;color:var(--dim)">½ × ${(C*1e9).toFixed(0)}nF × ${V}V² = ${E.toExponential(3)} J</span><br>
     <span style="font-size:.65rem;color:var(--accent)">${context}</span>`;
}
function calcSNR(){
  const vs=+document.getElementById('snr_s').value;
  const vn=+document.getElementById('snr_n').value;
  if(!vs||!vn) return;
  const snr=20*Math.log10(vs/vn);
  const quality = snr>40?'Excellent 🟢 — clean signal, LED triggers reliably'
    :snr>20?'Good 🟡 — meets HDP minimum spec (>20 dB)'
    :snr>10?'Marginal 🟠 — occasional false alarms possible'
    :'Poor 🔴 — noise dominates, alarm unreliable';
  document.getElementById('res_snr').innerHTML =
    `SNR = <strong>${snr.toFixed(2)} dB</strong><br>
     <span style="font-size:.65rem;color:var(--dim)">Ratio: ${(vs/vn).toFixed(1)}:1 &nbsp;· &nbsp;20×log(${vs}/${vn})</span><br>
     <span style="font-size:.65rem;color:#2ecc71">${quality}</span>`;
}
function calcGain(){
  const rf=+document.getElementById('g_rf').value;
  const rin=+document.getElementById('g_rin').value;
  const vin=+document.getElementById('g_vin').value;
  if(!rf||!rin||!vin) return;
  const Av=rf/rin;
  const Vout=vin*Av;
  const adcNote = Vout>=50?'✅ Output suitable for Arduino ADC (≥50 mV)'
    :'⚠ Output still below ADC threshold — increase Rf';
  document.getElementById('res_gain').innerHTML =
    `Av = <strong>${Av.toFixed(1)}×</strong> &nbsp;(inverting: −${Av.toFixed(1)})<br>
     <span style="font-size:.65rem;color:var(--dim)">Vout = ${vin} mV × ${Av.toFixed(1)} = <strong style="color:#f1c40f">${Vout.toFixed(1)} mV</strong></span><br>
     <span style="font-size:.65rem;color:#f1c40f">${adcNote}</span>`;
}
function calcThreshold(){
  const f=+document.getElementById('th_f').value;
  const d=+document.getElementById('th_d').value;
  const av=+document.getElementById('th_av').value;
  const c=+document.getElementById('th_c').value;
  if(!f||!d||!av||!c) return;
  const Q=d*f;               // pC
  const V_raw=(Q*1e-12)/(c*1e-9)*1000; // mV
  const V_amp=V_raw*av;
  const note = V_amp>4000?'⚠ Exceeds 5V Arduino limit — reduce gain'
    :V_amp>500?'✅ Good threshold — well within 0–5V ADC range'
    :'⚠ Low — Arduino may miss weak impacts; reduce threshold or increase gain';
  document.getElementById('res_threshold').innerHTML =
    `V_th = <strong>${V_amp.toFixed(1)} mV</strong> &nbsp;(${(V_amp/1000).toFixed(3)} V)<br>
     <span style="font-size:.65rem;color:var(--dim)">Q=${Q.toLocaleString()} pC → ${V_raw.toFixed(2)} mV × gain ${av} = ${V_amp.toFixed(1)} mV</span><br>
     <span style="font-size:.65rem;color:#e74c3c">${note}</span><br>
     <span style="font-size:.6rem;color:var(--dim)">Set Arduino analog threshold to ${(V_amp/1000).toFixed(3)} V (ADC value ≈ ${Math.round(V_amp/1000/5*1023)})</span>`;
}

/* ═══════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════ */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
},{threshold:.1});
revealEls.forEach(el=>io.observe(el));

/* ═══════════════════════════════════════
   NAV ACTIVE STATE
═══════════════════════════════════════ */
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll',()=>{
  let cur='';
  sections.forEach(s=>{
    if(window.scrollY >= s.offsetTop-100) cur=s.id;
  });
  document.querySelectorAll('nav a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href')==='#'+cur);
  });
});
/* ═══════════════════════════════════════
   GLASS BREAK DETECTION SIMULATOR
═══════════════════════════════════════ */
(function(){
  const gc = document.getElementById('glassCanvas');
  const gctx = gc.getContext('2d');
  const wc = document.getElementById('gbWaveCanvas');
  const wctx = wc.getContext('2d');

  const gbForce  = document.getElementById('gb-forceSlider');
  const gbFreq   = document.getElementById('gb-freqSlider');
  const gbSens   = document.getElementById('gb-sensSlider');

  let gbState = 'SAFE';
  let projectileX = -30;
  let projectileActive = true;
  let shatterLines = [];
  let crackLines = [];
  let waveT = 0;
  let alarmPulse = 0;
  let impactFlash = 0;
  let screenShake = 0;

  function getSensLabel(v){ return ['LOW','HIGH','ULTRA'][v-1]; }

  function updateGB(){
    const force = +gbForce.value;
    const freq  = +gbFreq.value;
    const sens  = +gbSens.value;
    const sensMult = [0.6, 1.0, 1.4][sens-1];

    document.getElementById('gb-forceLabel').textContent = force+' N';
    document.getElementById('gb-freqLabel').textContent  = freq+' Hz';
    document.getElementById('gb-sensLabel').textContent  = getSensLabel(sens);

    const d33 = 593;
    const Q = d33 * force * sensMult;
    const V = (Q * 1e-12) / (100e-9) * 1000;

    document.getElementById('gb-chargeOut').textContent = Q.toFixed(0);
    document.getElementById('gb-voltOut').textContent   = V.toFixed(1);

    const stressPct = Math.min(100, (force/500)*100);
    document.getElementById('gb-stress-fill').style.width = stressPct+'%';
    document.getElementById('gb-stress-label').textContent = 'Stress: '+stressPct.toFixed(0)+'%';

    if(force < 150){
      setGBState('SAFE','#2ecc71','● OFF','#555');
    } else if(force < 300){
      setGBState('CRACKED','#f1c40f','● STANDBY','#f1c40f');
    } else {
      setGBState('SHATTERED','#e74c3c','🔔 ALARM','#e74c3c');
    }
  }

  function setGBState(status, color, alarm, aColor){
    const prev = gbState;
    gbState = status;
    document.getElementById('gb-glassState').textContent = status;
    document.getElementById('gb-glassState').style.color = color;
    document.getElementById('gb-alarmState').textContent = alarm;
    document.getElementById('gb-alarmState').style.color = aColor;
    document.getElementById('gb-state-box').style.borderColor = color+'55';
    document.getElementById('gb-alarm-box').style.borderColor = aColor+'55';

    const badge = document.getElementById('gb-alarm-badge');
    if(status==='SHATTERED'){
      badge.style.background='#3a0a0a';
      badge.style.borderColor='#e74c3c';
      badge.style.color='#e74c3c';
      badge.textContent='🔔 ALARM TRIGGERED';
      if(prev!=='SHATTERED'){
        shatterLines = generateShatter();
        impactFlash = 1;
        screenShake = 12;
      }
    } else if(status==='CRACKED'){
      badge.style.background='#1a1500';
      badge.style.borderColor='#f1c40f88';
      badge.style.color='#f1c40f';
      badge.textContent='⚠ CRACK DETECTED';
      if(prev!=='CRACKED') crackLines = generateCracks(5);
    } else {
      badge.style.background='#0a1a0a';
      badge.style.borderColor='#2ecc7188';
      badge.style.color='#2ecc71';
      badge.textContent='● MONITORING';
      shatterLines=[]; crackLines=[];
    }
  }

  function generateShatter(){
    const cx=250, cy=140; const lines=[];
    for(let i=0;i<22;i++){
      const angle = (i/22)*Math.PI*2 + Math.random()*.2;
      const len   = 60 + Math.random()*110;
      lines.push({
        x1: cx + Math.cos(angle)*5,
        y1: cy + Math.sin(angle)*5,
        x2: cx + Math.cos(angle)*len,
        y2: cy + Math.sin(angle)*len,
        branch: Math.random()>.5,
        bAngle: angle + (Math.random()-.5)*.8,
        bLen: 20+Math.random()*40,
        alpha: .8+Math.random()*.2
      });
    }
    return lines;
  }

  function generateCracks(n){
    const cx=250, cy=140; const lines=[];
    for(let i=0;i<n;i++){
      const angle = (i/n)*Math.PI*2;
      const len = 30+Math.random()*60;
      lines.push({ x1:cx, y1:cy,
        x2:cx+Math.cos(angle)*len, y2:cy+Math.sin(angle)*len });
    }
    return lines;
  }

  ['gb-forceSlider','gb-freqSlider','gb-sensSlider'].forEach(id=>{
    document.getElementById(id).addEventListener('input', updateGB);
  });

  function drawGlass(){
    const W=gc.width, H=gc.height;
    const shake = screenShake>0 ? (Math.random()-0.5)*screenShake*2 : 0;
    gctx.save();
    gctx.translate(shake, shake*.5);

    gctx.clearRect(-20,-20,W+40,H+40);
    gctx.fillStyle='#020810'; gctx.fillRect(-20,-20,W+40,H+40);

    // alarm flash overlay
    if(gbState==='SHATTERED' && alarmPulse>.5){
      gctx.fillStyle=`rgba(231,76,60,${(alarmPulse-.5)*.15})`;
      gctx.fillRect(0,0,W,H);
    }

    // window frame
    const fx=120, fy=40, fw=260, fh=200;
    gctx.strokeStyle='#334466'; gctx.lineWidth=10; gctx.strokeRect(fx,fy,fw,fh);

    // glass pane
    if(gbState==='SHATTERED'){
      // glass chunks
      const grad = gctx.createLinearGradient(fx,fy,fx+fw,fy+fh);
      grad.addColorStop(0,'rgba(100,180,255,.07)');
      grad.addColorStop(1,'rgba(60,120,200,.03)');
      gctx.fillStyle=grad; gctx.fillRect(fx,fy,fw,fh);
    } else {
      const ggrad = gctx.createLinearGradient(fx,fy,fx+fw,fy+fh);
      ggrad.addColorStop(0,'rgba(150,220,255,.12)');
      ggrad.addColorStop(.4,'rgba(100,180,255,.08)');
      ggrad.addColorStop(1,'rgba(80,150,220,.04)');
      gctx.fillStyle=ggrad; gctx.fillRect(fx,fy,fw,fh);

      // glass sheen
      gctx.beginPath();
      gctx.moveTo(fx+20,fy+10); gctx.lineTo(fx+60,fy+10);
      gctx.lineTo(fx+50,fy+30); gctx.lineTo(fx+10,fy+30);
      gctx.fillStyle='rgba(255,255,255,.07)'; gctx.fill();
    }
    gctx.strokeStyle='rgba(100,180,255,.3)'; gctx.lineWidth=1; gctx.strokeRect(fx,fy,fw,fh);

    // crack lines
    if(crackLines.length){
      gctx.strokeStyle='rgba(200,180,100,.6)'; gctx.lineWidth=1;
      crackLines.forEach(l=>{
        gctx.beginPath(); gctx.moveTo(l.x1,l.y1); gctx.lineTo(l.x2,l.y2); gctx.stroke();
      });
    }

    // shatter lines
    if(shatterLines.length){
      shatterLines.forEach(l=>{
        gctx.strokeStyle=`rgba(231,76,60,${l.alpha*.9})`;
        gctx.lineWidth=1.5;
        gctx.beginPath(); gctx.moveTo(l.x1,l.y1); gctx.lineTo(l.x2,l.y2); gctx.stroke();
        if(l.branch){
          const bx=l.x1+(l.x2-l.x1)*.6, by=l.y1+(l.y2-l.y1)*.6;
          gctx.strokeStyle=`rgba(231,76,60,${l.alpha*.5})`;
          gctx.lineWidth=.8;
          gctx.beginPath(); gctx.moveTo(bx,by);
          gctx.lineTo(bx+Math.cos(l.bAngle)*l.bLen, by+Math.sin(l.bAngle)*l.bLen);
          gctx.stroke();
        }
      });
      // impact glow
      const ig = gctx.createRadialGradient(250,140,0,250,140,60);
      ig.addColorStop(0,`rgba(231,76,60,${impactFlash*.3})`);
      ig.addColorStop(1,'transparent');
      gctx.fillStyle=ig; gctx.fillRect(fx,fy,fw,fh);
    }

    // projectile (stone)
    if(gbState!=='SHATTERED' && projectileActive){
      projectileX += 3.5;
      if(projectileX > 250) projectileX = -40;
      const pgrad = gctx.createRadialGradient(projectileX,140,0,projectileX,140,14);
      pgrad.addColorStop(0,'#bbb'); pgrad.addColorStop(.6,'#888'); pgrad.addColorStop(1,'#444');
      gctx.beginPath(); gctx.arc(projectileX,140,13,0,Math.PI*2);
      gctx.fillStyle=pgrad; gctx.fill();
      // motion trail
      gctx.fillStyle='rgba(150,150,150,.15)';
      gctx.beginPath(); gctx.ellipse(projectileX-18,140,18,6,0,0,Math.PI*2); gctx.fill();
    }

    // piezo sensor indicator on glass
    const sx=fx+fw-20, sy=fy+fh/2;
    gctx.beginPath(); gctx.arc(sx,sy,9,0,Math.PI*2);
    gctx.fillStyle=gbState==='SHATTERED'?'#e74c3c':gbState==='CRACKED'?'#f1c40f':'#00f5d4';
    gctx.fill();
    gctx.fillStyle='#000'; gctx.font='bold 7px monospace';
    gctx.textAlign='center'; gctx.textBaseline='middle';
    gctx.fillText('PZT',sx,sy);
    // sensor pulse ring
    const ringAlpha = gbState==='SAFE'?.4:.7;
    gctx.beginPath(); gctx.arc(sx,sy,12+Math.sin(waveT*.1)*3,0,Math.PI*2);
    gctx.strokeStyle=gbState==='SHATTERED'?`rgba(231,76,60,${ringAlpha})`:`rgba(0,245,212,${ringAlpha})`;
    gctx.lineWidth=1; gctx.stroke();

    // label
    gctx.fillStyle='rgba(0,245,212,.5)'; gctx.font='8px monospace';
    gctx.textAlign='left';
    gctx.fillText('PIEZO SENSOR',fx+fw-55,fy+fh+14);

    if(screenShake>0) screenShake-=.8;
    if(impactFlash>0) impactFlash=Math.max(0,impactFlash-.03);
    gctx.restore();
  }

  function drawGBWave(){
    const W=wc.width, H=wc.height;
    wctx.clearRect(0,0,W,H);
    wctx.fillStyle='#020810'; wctx.fillRect(0,0,W,H);

    const force = +gbForce.value;
    const freq  = +gbFreq.value;
    const amp   = Math.min(H/2*.8, (force/500)*(H/2*.8));

    // glow
    wctx.shadowBlur=6; wctx.shadowColor='#e040fb';
    wctx.strokeStyle=gbState==='SHATTERED'?'#e74c3c':gbState==='CRACKED'?'#f1c40f':'#e040fb';
    wctx.lineWidth=1.8;
    wctx.beginPath();
    for(let x=0;x<W;x++){
      const t = waveT + x/W;
      const burst = gbState==='SHATTERED' ? 1+Math.random()*.5 : 1;
      const y = H/2
        - Math.sin(2*Math.PI*freq*t/5000)*amp*burst
        - Math.sin(4*Math.PI*freq*t/5000)*amp*.3*burst
        + (gbState!=='SAFE'?(Math.random()-.5)*amp*.2:0);
      x===0?wctx.moveTo(x,y):wctx.lineTo(x,y);
    }
    wctx.stroke();
    wctx.shadowBlur=0;
    waveT += .5;

    // alarm blink
    if(gbState==='SHATTERED'){
      alarmPulse = (Math.sin(waveT*.15)+1)/2;
    } else { alarmPulse=0; }
  }

  // ── CIRCUIT BOARD DRAW ──
  const cc = document.getElementById('circuitCanvas');
  const cctx = cc.getContext('2d');
  let signalT = 0;
  let ledFlicker = 0;

  function drawCircuit(){
    const W = cc.width, H = cc.height;
    cctx.clearRect(0,0,W,H);

    // PCB background
    const pcbGrad = cctx.createLinearGradient(0,0,0,H);
    pcbGrad.addColorStop(0,'#071a10');
    pcbGrad.addColorStop(1,'#041208');
    cctx.fillStyle = pcbGrad;
    cctx.fillRect(0,0,W,H);

    // PCB grid dots
    cctx.fillStyle='rgba(0,180,80,.07)';
    for(let x=10;x<W;x+=18) for(let y=8;y<H;y+=18){
      cctx.beginPath(); cctx.arc(x,y,1,0,Math.PI*2); cctx.fill();
    }

    const alarm = gbState==='SHATTERED';
    const cracked = gbState==='CRACKED';
    const signalColor = alarm ? '#e74c3c' : cracked ? '#f1c40f' : '#00f5d4';
    const traceAlpha  = alarm ? 1 : cracked ? .7 : .45;
    const glowColor   = alarm ? 'rgba(231,76,60,' : 'rgba(0,245,212,';

    // ── Signal pulse along traces ──
    signalT += alarm ? .06 : cracked ? .03 : .015;
    const pulse = (Math.sin(signalT)+1)/2;

    function drawTrace(pts, highlight){
      cctx.beginPath();
      pts.forEach((p,i)=>i===0?cctx.moveTo(p[0],p[1]):cctx.lineTo(p[0],p[1]));
      cctx.strokeStyle = highlight
        ? `rgba(${alarm?'231,76,60':cracked?'241,196,15':'0,245,212'},${traceAlpha})`
        : 'rgba(0,100,50,.4)';
      cctx.lineWidth = highlight ? 2 : 1;
      if(highlight){ cctx.shadowBlur=6; cctx.shadowColor=signalColor; }
      cctx.stroke();
      cctx.shadowBlur=0;
    }

    // ── LAYOUT positions ──
    // PZT sensor pad (top center — wire comes from glass above)
    const pztX=250, pztY=18;
    // Op-Amp
    const opX=155, opY=80;
    // Arduino/MCU
    const mcuX=280, mcuY=72;
    // LED
    const ledX=430, ledY=85;
    // Buzzer
    const buzX=430, buzY=145;
    // Ground rail
    const gndY=170;

    // ── TRACES ──
    // PZT → OpAmp
    drawTrace([[pztX,pztY],[pztX,50],[opX,50],[opX,opY-18]], alarm||cracked);
    // OpAmp → MCU
    drawTrace([[opX,opY+18],[opX,110],[mcuX-20,110],[mcuX-20,mcuY+18]], alarm||cracked);
    // MCU → LED
    drawTrace([[mcuX+40,mcuY],[380,mcuY],[380,ledY],[ledX-18,ledY]], alarm);
    // MCU → Buzzer
    drawTrace([[mcuX+40,mcuY+10],[380,mcuY+10],[380,buzY],[buzX-18,buzY]], alarm);
    // Ground traces
    drawTrace([[opX,opY+18],[opX,gndY]], false);
    drawTrace([[mcuX,mcuY+24],[mcuX,gndY]], false);
    drawTrace([[ledX,ledY+14],[ledX,gndY]], false);
    drawTrace([[buzX,buzY+14],[buzX,gndY]], false);
    // Ground rail
    cctx.beginPath(); cctx.moveTo(30,gndY); cctx.lineTo(W-20,gndY);
    cctx.strokeStyle='rgba(0,140,60,.5)'; cctx.lineWidth=2; cctx.stroke();
    cctx.fillStyle='rgba(0,200,80,.4)'; cctx.font='7px monospace';
    cctx.textAlign='left'; cctx.fillText('GND',32,gndY+9);

    // ── SIGNAL BALL moving along traces when active ──
    if(alarm || cracked){
      const paths = [
        [[pztX,pztY],[pztX,50],[opX,50],[opX,opY-18]],
        [[opX,opY+18],[opX,110],[mcuX-20,110],[mcuX-20,mcuY+18]],
      ];
      if(alarm) paths.push([[mcuX+40,mcuY],[380,mcuY],[380,ledY],[ledX-18,ledY]]);
      paths.forEach(path=>{
        const total = path.reduce((s,p,i)=>i===0?0:s+Math.hypot(p[0]-path[i-1][0],p[1]-path[i-1][1]),0);
        let dist = (signalT % 2)/2 * total;
        let rem = dist, bx=path[0][0], by=path[0][1];
        for(let i=1;i<path.length;i++){
          const seg=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);
          if(rem<=seg){ bx=path[i-1][0]+(path[i][0]-path[i-1][0])*(rem/seg); by=path[i-1][1]+(path[i][1]-path[i-1][1])*(rem/seg); break; }
          rem-=seg;
        }
        cctx.beginPath(); cctx.arc(bx,by,3,0,Math.PI*2);
        cctx.fillStyle=signalColor;
        cctx.shadowBlur=10; cctx.shadowColor=signalColor;
        cctx.fill(); cctx.shadowBlur=0;
      });
    }

    // ── PZT SENSOR PAD ──
    cctx.beginPath(); cctx.arc(pztX,pztY,11,0,Math.PI*2);
    cctx.fillStyle='#0a2a1a'; cctx.fill();
    cctx.strokeStyle=alarm?'#e74c3c':cracked?'#f1c40f':'rgba(0,245,212,.6)';
    cctx.lineWidth=1.5; cctx.stroke();
    cctx.fillStyle=signalColor; cctx.font='bold 6px monospace';
    cctx.textAlign='center'; cctx.textBaseline='middle';
    cctx.fillText('PZT',pztX,pztY);
    // connector wire going up (meets glass canvas bottom)
    cctx.beginPath(); cctx.moveTo(pztX,0); cctx.lineTo(pztX,pztY-11);
    cctx.strokeStyle='rgba(0,245,212,.5)'; cctx.lineWidth=1.5; cctx.setLineDash([3,3]); cctx.stroke();
    cctx.setLineDash([]);

    // ── OP-AMP ──
    cctx.beginPath();
    cctx.moveTo(opX-22,opY-18); cctx.lineTo(opX-22,opY+18);
    cctx.lineTo(opX+22,opY); cctx.closePath();
    cctx.fillStyle='#0d2a18'; cctx.fill();
    cctx.strokeStyle='rgba(0,200,100,.5)'; cctx.lineWidth=1.2; cctx.stroke();
    cctx.fillStyle='rgba(0,220,120,.7)'; cctx.font='6px monospace';
    cctx.textAlign='center'; cctx.textBaseline='middle';
    cctx.fillText('OP',opX-4,opY-6); cctx.fillText('AMP',opX-4,opY+5);

    // ── MCU (Arduino) ──
    const mW=80,mH=48;
    cctx.fillStyle='#0a1a2e';
    cctx.fillRect(mcuX-mW/2,mcuY-mH/2,mW,mH);
    cctx.strokeStyle='rgba(0,180,255,.5)'; cctx.lineWidth=1.5;
    cctx.strokeRect(mcuX-mW/2,mcuY-mH/2,mW,mH);
    // MCU pins
    for(let i=0;i<5;i++){
      cctx.fillStyle='rgba(0,200,255,.4)';
      cctx.fillRect(mcuX-mW/2-5, mcuY-16+i*8, 5, 4);
      cctx.fillRect(mcuX+mW/2,   mcuY-16+i*8, 5, 4);
    }
    cctx.fillStyle='rgba(0,200,255,.8)'; cctx.font='bold 8px monospace';
    cctx.textAlign='center'; cctx.textBaseline='middle';
    cctx.fillText('ARDUINO',mcuX,mcuY-8);
    cctx.font='6px monospace'; cctx.fillStyle='rgba(0,200,255,.4)';
    cctx.fillText('ATmega328P',mcuX,mcuY+4);
    // status LED on MCU
    const mcuLedOn = alarm||cracked;
    cctx.beginPath(); cctx.arc(mcuX+28,mcuY-16,4,0,Math.PI*2);
    cctx.fillStyle=mcuLedOn?(cracked?'#f1c40f':'#2ecc71'):'#0a1a0a';
    if(mcuLedOn){ cctx.shadowBlur=8; cctx.shadowColor=mcuLedOn?(cracked?'#f1c40f':'#2ecc71'):'none'; }
    cctx.fill(); cctx.shadowBlur=0;

    // ── RESISTOR (inline with LED trace) ──
    const resX=400, resY=ledY;
    cctx.fillStyle='#1a1200';
    cctx.fillRect(resX-10,resY-5,20,10);
    cctx.strokeStyle='rgba(200,150,50,.5)'; cctx.lineWidth=1;
    cctx.strokeRect(resX-10,resY-5,20,10);
    // resistor bands
    ['#e74c3c','#f5a623','#888'].forEach((col,i)=>{
      cctx.fillStyle=col; cctx.fillRect(resX-6+i*5,resY-5,3,10);
    });
    cctx.fillStyle='rgba(200,150,50,.4)'; cctx.font='5px monospace';
    cctx.textAlign='center'; cctx.fillText('220Ω',resX,resY+14);

    // ── LED ──
    ledFlicker = alarm ? Math.max(0,ledFlicker + (Math.random()>.95?.3:-.05)) : 0;
    const ledOn   = alarm;
    const ledGlow = ledOn ? Math.min(1, pulse + ledFlicker) : 0;

    // LED body
    cctx.beginPath();
    cctx.arc(ledX,ledY,10,0,Math.PI*2);
    const ledFill = ledOn
      ? `rgba(231,76,60,${.4+ledGlow*.6})`
      : 'rgba(60,10,10,.6)';
    cctx.fillStyle=ledFill; cctx.fill();
    cctx.strokeStyle=ledOn?`rgba(255,100,80,${.6+ledGlow*.4})`:'rgba(100,30,30,.4)';
    cctx.lineWidth=1.5; cctx.stroke();
    // LED flat edge
    cctx.beginPath(); cctx.moveTo(ledX+7,ledY-6); cctx.lineTo(ledX+7,ledY+6);
    cctx.strokeStyle='rgba(150,50,50,.5)'; cctx.lineWidth=1.5; cctx.stroke();
    // LED glow halo
    if(ledOn){
      const halo = cctx.createRadialGradient(ledX,ledY,0,ledX,ledY,35*ledGlow+15);
      halo.addColorStop(0,`rgba(255,80,60,${.35*ledGlow})`);
      halo.addColorStop(1,'transparent');
      cctx.fillStyle=halo; cctx.beginPath();
      cctx.arc(ledX,ledY,35*ledGlow+15,0,Math.PI*2); cctx.fill();
    }
    // LED label
    cctx.fillStyle=ledOn?'#e74c3c':'rgba(150,50,50,.5)';
    cctx.font='bold 7px monospace'; cctx.textAlign='center';
    cctx.fillText('LED',ledX,ledY+20);
    if(ledOn){
      cctx.fillStyle=`rgba(255,120,80,${.5+pulse*.5})`;
      cctx.font='6px monospace';
      cctx.fillText('🔴 ON',ledX,ledY+30);
    }

    // ── BUZZER ──
    const buzOn = alarm;
    cctx.beginPath(); cctx.arc(buzX,buzY,11,0,Math.PI*2);
    cctx.fillStyle=buzOn?'rgba(231,76,60,.25)':'rgba(40,20,20,.6)';
    cctx.fill();
    cctx.strokeStyle=buzOn?`rgba(231,76,60,${.5+pulse*.5})`:'rgba(100,50,50,.3)';
    cctx.lineWidth=1.5; cctx.stroke();
    // buzzer rings
    if(buzOn){
      [18,25,32].forEach((r,i)=>{
        cctx.beginPath(); cctx.arc(buzX,buzY,r,0,Math.PI*2);
        cctx.strokeStyle=`rgba(231,76,60,${(.4-i*.12)*pulse})`; cctx.lineWidth=1;
        cctx.stroke();
      });
    }
    cctx.fillStyle='rgba(200,100,80,.8)'; cctx.font='6px monospace';
    cctx.textAlign='center'; cctx.textBaseline='middle'; cctx.fillText('BUZ',buzX,buzY);
    cctx.textBaseline='alphabetic';
    cctx.fillStyle=buzOn?'rgba(231,76,60,.8)':'rgba(100,50,50,.4)';
    cctx.font='bold 7px monospace'; cctx.fillText('BUZZER',buzX,buzY+22);

    // ── CAPACITOR ──
    const capX=200, capY=130;
    cctx.strokeStyle='rgba(0,200,200,.4)'; cctx.lineWidth=1;
    cctx.beginPath(); cctx.moveTo(capX,capY-12); cctx.lineTo(capX,capY-4); cctx.stroke();
    cctx.beginPath(); cctx.moveTo(capX-8,capY-4); cctx.lineTo(capX+8,capY-4); cctx.lineWidth=2; cctx.stroke();
    cctx.beginPath(); cctx.moveTo(capX-8,capY+4); cctx.lineTo(capX+8,capY+4); cctx.lineWidth=2; cctx.stroke();
    cctx.lineWidth=1;
    cctx.beginPath(); cctx.moveTo(capX,capY+4); cctx.lineTo(capX,capY+12); cctx.stroke();
    cctx.fillStyle='rgba(0,200,200,.4)'; cctx.font='5px monospace';
    cctx.textAlign='center'; cctx.fillText('100nF',capX,capY+21);
    // trace to MCU
    drawTrace([[capX,capY-12],[capX,mcuY+20],[mcuX-mW/2,mcuY+20]], cracked||alarm);

    // ── LABELS ──
    cctx.fillStyle='rgba(0,200,100,.25)'; cctx.font='7px monospace'; cctx.textAlign='center';
    cctx.fillText('PCB · HDP CIRCUIT',W/2,H-5);

    // ── VCC label ──
    cctx.fillStyle='rgba(255,200,50,.4)'; cctx.font='6px monospace'; cctx.textAlign='left';
    cctx.fillText('+5V',32,20);
    cctx.beginPath(); cctx.moveTo(55,16); cctx.lineTo(W-20,16);
    cctx.strokeStyle='rgba(255,200,50,.15)'; cctx.lineWidth=1; cctx.setLineDash([4,6]); cctx.stroke();
    cctx.setLineDash([]);
  }

  function gbLoop(){
    drawGlass(); drawGBWave(); drawCircuit();
    requestAnimationFrame(gbLoop);
  }

  updateGB();
  gbLoop();
})();

/* ═══════════════════════════════════════
   CAR KNOCK DETECTION SIMULATOR
═══════════════════════════════════════ */
(function(){
  const cc  = document.getElementById('carCanvas');
  const ctx = cc.getContext('2d');
  const wc  = document.getElementById('ckWaveCanvas');
  const wctx= wc.getContext('2d');

  // State
  let carX, parkedX, ckState, impactT, waveT2, shakeAmt, impactForce;
  let beepPhase = 0, beepInterval = 999;
  let sensorGlow = 0, collisionFlash = 0;
  let skidMarks = [];

  function reset(){
    carX = 80;
    parkedX = cc.width - 100;
    ckState = 'idle';
    impactT = 0; waveT2 = 0; shakeAmt = 0;
    impactForce = 0; sensorGlow = 0; collisionFlash = 0;
    skidMarks = [];
    updateReadouts(0);
    setUI('IDLE','#555','READY','#555','● STANDBY','#666','#1a1000','#444');
  }

  const speedSlider  = document.getElementById('ck-speed');
  const massSlider   = document.getElementById('ck-mass');
  const threshSlider = document.getElementById('ck-thresh');

  speedSlider.addEventListener('input',  ()=>{ document.getElementById('ck-speedLabel').textContent  = (+speedSlider.value).toFixed(1)+' m/s'; });
  massSlider.addEventListener('input',   ()=>{ document.getElementById('ck-massLabel').textContent   = massSlider.value+' kg'; });
  threshSlider.addEventListener('input', ()=>{ document.getElementById('ck-threshLabel').textContent = ['LOW','MED','HIGH'][threshSlider.value-1]; });
  document.getElementById('ck-resetBtn').addEventListener('click', reset);

  function getSpeed(){ return +speedSlider.value; }
  function getMass(){  return +massSlider.value; }
  function getThreshMult(){ return [1.4,1.0,0.7][+threshSlider.value-1]; }

  function updateReadouts(F){
    const Q = (593 * F).toFixed(0);
    document.getElementById('ck-forceOut').textContent  = F.toFixed(0);
    document.getElementById('ck-chargeOut').textContent = Q;
  }

  function setUI(sens, sCol, brake, bCol, badge, badgeCol, badgeBg, badgeBorder){
    document.getElementById('ck-sensorState').textContent = sens;
    document.getElementById('ck-sensorState').style.color = sCol;
    document.getElementById('ck-brakeState').textContent  = brake;
    document.getElementById('ck-brakeState').style.color  = bCol;
    document.getElementById('ck-sensor-box').style.borderColor = sCol+'55';
    document.getElementById('ck-brake-box').style.borderColor  = bCol+'55';
    const cb = document.getElementById('ck-circuit-badge');
    if(cb){
      if(sens==='🔴 TRIGGERED'){ cb.textContent='⚡ CIRCUIT TRIGGERED'; cb.style.color='#e74c3c'; cb.style.background='#2a0a0a'; cb.style.borderColor='#e74c3c'; }
      else if(sens==='📡 DETECTING'||sens==='⚠ NEAR'){ cb.textContent='📡 SIGNAL DETECTED'; cb.style.color='#f1c40f'; cb.style.background='#1a1200'; cb.style.borderColor='#f1c40f88'; }
      else { cb.textContent='PCB ACTIVE'; cb.style.color='#2a5a2a'; cb.style.background='#0a1a0a'; cb.style.borderColor='#1a4a1a'; }
    }
    const b = document.getElementById('ck-badge');
    b.textContent   = badge;
    b.style.color   = badgeCol;
    b.style.background   = badgeBg;
    b.style.borderColor  = badgeBorder;
  }

  // ── DRAW ROAD SCENE ──
  function drawCar(){
    const W = cc.width, H = cc.height;
    const speed = getSpeed();

    // car dimensions
    const cW=80, cH=44; // main moving car
    const pW=80, pH=44; // parked car
    const laneY = H/2;

    // Road surface
    const rdGrad = ctx.createLinearGradient(0,0,0,H);
    rdGrad.addColorStop(0,'#1a1a22');
    rdGrad.addColorStop(1,'#141420');
    ctx.fillStyle=rdGrad; ctx.fillRect(0,0,W,H);

    // Road markings - dashed center line
    ctx.setLineDash([30,20]);
    ctx.strokeStyle='rgba(255,255,200,.12)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,laneY); ctx.lineTo(W,laneY); ctx.stroke();
    ctx.setLineDash([]);

    // Kerb lines top and bottom
    ctx.fillStyle='rgba(255,255,255,.06)';
    ctx.fillRect(0,laneY-80,W,4);
    ctx.fillRect(0,laneY+54,W,4);

    // skid marks
    skidMarks.forEach(s=>{
      ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2);
      ctx.strokeStyle=`rgba(30,30,30,${s.a})`; ctx.lineWidth=4;
      ctx.stroke(); s.a=Math.max(0,s.a-.001);
    });
    skidMarks = skidMarks.filter(s=>s.a>0);

    // screen shake
    const shake = shakeAmt>0 ? (Math.random()-.5)*shakeAmt*3 : 0;
    ctx.save(); ctx.translate(shake, shake*.4);
    if(shakeAmt>0) shakeAmt=Math.max(0,shakeAmt-.6);

    // ── PARKED CAR (stationary, right side) ──
    const pY = laneY - pH/2 - 2;
    drawVehicle(ctx, parkedX - pW/2, pY, pW, pH, '#1a2a3a', '#2a4a6a', false, false, 0);
    // label
    ctx.fillStyle='rgba(150,180,220,.3)'; ctx.font='7px monospace';
    ctx.textAlign='center'; ctx.fillText('PARKED',parkedX,pY+pH+12);

    // ── MOVING CAR (reversing = moving right) ──
    const cyPos = laneY - cH/2 - 2;

    // Advance car if not collided
    if(ckState !== 'impact' && ckState !== 'post-impact'){
      carX += speed * 0.8;
      // leave skid marks when braking near
      const gap = parkedX - pW/2 - (carX + cW/2);
      if(gap < 60 && gap > 0 && Math.random()>.85){
        skidMarks.push({x1:carX+cW/2, y1:cyPos+cH*.7, x2:carX+cW/2+8, y2:cyPos+cH*.7, a:.4});
        skidMarks.push({x1:carX+cW/2, y1:cyPos+cH*.3, x2:carX+cW/2+8, y2:cyPos+cH*.3, a:.4});
      }
    }

    // Proximity calc
    const gap = Math.max(0, (parkedX - pW/2) - (carX + cW/2));
    const proxPct = Math.min(100, ((200 - gap)/200)*100);
    document.getElementById('ck-prox-fill').style.width = proxPct+'%';
    document.getElementById('ck-dist-label').textContent = (gap/40).toFixed(1)+' m';
    beepInterval = gap < 5 ? 1 : gap < 40 ? 8 : gap < 90 ? 20 : 999;

    // Collision detection
    if(carX + cW/2 >= parkedX - pW/2 && ckState==='idle'){
      ckState='impact';
      impactForce = 0.5 * getMass() * speed * speed;
      impactForce = impactForce * getThreshMult();
      shakeAmt = Math.min(14, impactForce/300);
      collisionFlash = 1.0;
      sensorGlow = 1.0;
      // skid burst
      for(let i=0;i<8;i++) skidMarks.push({
        x1:carX+cW/2, y1:cyPos+pH*(i/8),
        x2:carX+cW/2 + (Math.random()*20-5), y2:cyPos+pH*(i/8),
        a:.8
      });
      updateReadouts(impactForce);
      setUI('🔴 TRIGGERED', '#e74c3c', '🛑 BRAKING', '#e74c3c',
            '🔔 COLLISION DETECTED', '#e74c3c', '#2a0a0a', '#e74c3c');
    }

    if(ckState==='impact'){
      impactT++;
      if(impactT>80){ ckState='post-impact'; }
    }

    // reset if car drives off right edge
    if(carX > W + 50) reset();

    // Beep dots (proximity warning dots above car)
    if(gap < 120 && ckState==='idle'){
      beepPhase++;
      const show = (beepPhase % beepInterval) < beepInterval/2;
      if(show){
        const dotCount = gap < 20 ? 3 : gap < 60 ? 2 : 1;
        const dotCol   = gap < 20 ? '#e74c3c' : gap < 60 ? '#f1c40f' : '#2ecc71';
        for(let d=0;d<dotCount;d++){
          ctx.beginPath(); ctx.arc(carX + cW/2 + 14 + d*14, cyPos + cH/2, 5, 0, Math.PI*2);
          ctx.fillStyle=dotCol;
          ctx.shadowBlur=8; ctx.shadowColor=dotCol;
          ctx.fill(); ctx.shadowBlur=0;
        }
        // proximity arc lines
        [20,38,56].slice(0, dotCount).forEach(r=>{
          ctx.beginPath();
          ctx.arc(carX + cW/2, cyPos + cH/2, r, -Math.PI/3, Math.PI/3);
          ctx.strokeStyle=`rgba(${gap<20?'231,76,60':gap<60?'241,196,15':'46,204,113'},.4)`;
          ctx.lineWidth=1; ctx.stroke();
        });
        if(gap<10){
          setUI('⚠ NEAR', '#f1c40f', '⚠ BRAKE NOW', '#f1c40f',
                '⚠ IMPACT IMMINENT','#f1c40f','#1a1200','#f1c40f88');
        } else {
          setUI('📡 DETECTING', '#2ecc71', 'ACTIVE','#2ecc71',
                '📡 PROXIMITY ALERT','#2ecc71','#0a1a0a','#2ecc7188');
        }
      }
    }

    // collision flash overlay
    if(collisionFlash > 0){
      ctx.fillStyle = `rgba(231,76,60,${collisionFlash * .25})`;
      ctx.fillRect(-20,-20,W+40,H+40);
      collisionFlash = Math.max(0, collisionFlash - .04);
    }

    // draw moving car — last so it's on top
    const sGlow = sensorGlow > 0 ? sensorGlow : 0;
    if(sensorGlow>0) sensorGlow=Math.max(0,sensorGlow-.015);
    drawVehicle(ctx, carX - cW/2, cyPos, cW, cH, '#2a1a08', '#e8880a', true, ckState==='impact'||ckState==='post-impact', sGlow);
    // "REVERSING" label + arrow
    ctx.fillStyle='rgba(245,166,35,.5)'; ctx.font='bold 7px monospace';
    ctx.textAlign='center'; ctx.fillText('◀ REVERSING',carX,cyPos-8);

    ctx.restore();
    waveT2 += .5;
  }

  function drawVehicle(ctx, x, y, w, h, bodyCol, accentCol, hasSensor, alarmed, glowAmt){
    // shadow
    ctx.fillStyle='rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(x+w/2, y+h+4, w*.45, 6, 0, 0, Math.PI*2); ctx.fill();

    // body
    const bGrad = ctx.createLinearGradient(x,y,x,y+h);
    bGrad.addColorStop(0, alarmed ? '#3a0a0a' : bodyCol);
    bGrad.addColorStop(1, alarmed ? '#1a0505' : bodyCol);
    ctx.fillStyle=bGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    // accent stripe / roof
    ctx.fillStyle=accentCol;
    ctx.beginPath(); ctx.roundRect(x+8, y+5, w-16, h-10, 4); ctx.fill();

    // windows
    ctx.fillStyle='rgba(150,220,255,.25)';
    ctx.fillRect(x+12, y+7, (w-24)*.5-2, h-14);
    ctx.fillRect(x+12+(w-24)*.5+2, y+7, (w-24)*.5-2, h-14);

    // wheels
    const wx=[x+10, x+w-10];
    wx.forEach(wxx=>{
      ctx.beginPath(); ctx.arc(wxx, y-4, 7, 0, Math.PI*2);
      ctx.fillStyle='#111'; ctx.fill();
      ctx.beginPath(); ctx.arc(wxx, y-4, 4, 0, Math.PI*2);
      ctx.fillStyle='#444'; ctx.fill();
      ctx.beginPath(); ctx.arc(wxx, y+h+4, 7, 0, Math.PI*2);
      ctx.fillStyle='#111'; ctx.fill();
      ctx.beginPath(); ctx.arc(wxx, y+h+4, 4, 0, Math.PI*2);
      ctx.fillStyle='#444'; ctx.fill();
    });

    // headlights / tail lights
    if(hasSensor){
      // tail lights (right side = rear when reversing)
      ctx.beginPath(); ctx.arc(x+w+1, y+8, 5, 0, Math.PI*2);
      ctx.fillStyle= alarmed ? '#ff3030' : 'rgba(255,50,50,.6)';
      if(alarmed){ ctx.shadowBlur=15; ctx.shadowColor='#ff3030'; }
      ctx.fill(); ctx.shadowBlur=0;
      ctx.beginPath(); ctx.arc(x+w+1, y+h-8, 5, 0, Math.PI*2);
      ctx.fillStyle= alarmed ? '#ff3030' : 'rgba(255,50,50,.6)';
      if(alarmed){ ctx.shadowBlur=15; ctx.shadowColor='#ff3030'; }
      ctx.fill(); ctx.shadowBlur=0;
      // reverse white lights
      ctx.beginPath(); ctx.arc(x+w-4, y+8, 4, 0, Math.PI*2);
      ctx.fillStyle='rgba(240,240,255,.7)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w-4, y+h-8, 4, 0, Math.PI*2);
      ctx.fillStyle='rgba(240,240,255,.7)'; ctx.fill();
    }

    // PZT sensor dot on rear bumper
    if(hasSensor){
      const sx = x+w+2, sy = y+h/2;
      // bumper bar
      ctx.fillStyle='#333'; ctx.fillRect(x+w, y+4, 4, h-8);

      // sensor body
      ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI*2);
      ctx.fillStyle = alarmed
        ? `rgba(231,76,60,${.7+glowAmt*.3})`
        : glowAmt>.1 ? `rgba(245,166,35,${glowAmt})` : '#1a2a1a';
      if(alarmed || glowAmt>.3){
        ctx.shadowBlur=14+glowAmt*20; ctx.shadowColor= alarmed ? '#e74c3c' : '#f5a623';
      }
      ctx.fill(); ctx.shadowBlur=0;
      ctx.strokeStyle= alarmed ? '#e74c3c' : 'rgba(0,245,212,.5)';
      ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='bold 5px monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('PZT',sx,sy); ctx.textBaseline='alphabetic';

      // radiate rings on impact
      if(alarmed && glowAmt>.01){
        [12,20,30].forEach((r,i)=>{
          ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2);
          ctx.strokeStyle=`rgba(231,76,60,${Math.max(0,glowAmt-.2*i)*.6})`;
          ctx.lineWidth=1; ctx.stroke();
        });
      }
    }
  }

  // ── BUMPER WAVEFORM ──
  function drawCKWave(){
    const W=wc.width, H=wc.height;
    wctx.clearRect(0,0,W,H);
    wctx.fillStyle='#020810'; wctx.fillRect(0,0,W,H);

    const speed=getSpeed();
    const isImpact = ckState==='impact';
    const isPost   = ckState==='post-impact';
    const amp = isImpact ? H*.4 : isPost ? H*.2*(1-impactT/120) : H*.06 + (200-Math.max(0,Math.min(200,(parkedX-80)-(carX+40))))/200 * H*.15;
    const col = isImpact ? '#e74c3c' : isPost ? '#f5a623' : '#2ecc71';

    wctx.shadowBlur=5; wctx.shadowColor=col;
    wctx.strokeStyle=col; wctx.lineWidth=2;
    wctx.beginPath();
    for(let x=0;x<W;x++){
      const t=waveT2+x/W;
      const burst = isImpact ? 1+Math.random()*.8 : 1;
      const y= H/2 - Math.sin(t*2)*amp*burst - Math.sin(t*5)*amp*.4*burst
               - (isImpact?(Math.random()-.5)*amp*.5:0);
      x===0?wctx.moveTo(x,y):wctx.lineTo(x,y);
    }
    wctx.stroke(); wctx.shadowBlur=0;
  }

  // ── CAR CIRCUIT LED DRAW ──
  const lc  = document.getElementById('carLedCanvas');
  const lctx = lc.getContext('2d');
  let ledPulse2 = 0;

  function drawCarLed(){
    const W = lc.width, H = lc.height;
    lctx.clearRect(0,0,W,H);

    // PCB background
    const pcbG = lctx.createLinearGradient(0,0,0,H);
    pcbG.addColorStop(0,'#061208');
    pcbG.addColorStop(1,'#040e06');
    lctx.fillStyle = pcbG;
    lctx.fillRect(0,0,W,H);

    // PCB grid dots
    lctx.fillStyle = 'rgba(0,180,60,.06)';
    for(let x=10;x<W;x+=16) for(let y=8;y<H;y+=16){
      lctx.beginPath(); lctx.arc(x,y,1,0,Math.PI*2); lctx.fill();
    }

    const alarmed   = ckState==='impact' || ckState==='post-impact';
    const proximity = ckState==='idle' && typeof carX!=='undefined' && typeof parkedX!=='undefined'
                      && (parkedX - 80 - (carX + 40)) < 120;

    ledPulse2 = (Math.sin(waveT2 * .18)+1)/2;

    const traceOn   = alarmed;
    const traceCol  = alarmed  ? '#e74c3c' : proximity ? '#f1c40f' : '#00b050';
    const traceA    = alarmed  ? 1.0       : proximity ? .65       : .3;

    // ── Layout — dynamic, spread across full canvas width ──
    const pztX  = W*0.05,  pztY  = H/2;
    const opX   = W*0.17,  opY   = H/2;
    const capX  = W*0.29,  capY  = H/2;
    const resX  = W*0.44,  resY  = H/2;
    const ledX  = W*0.60,  ledY  = H/2;
    const led2X = W*0.72,  led2Y = H/2;   // second LED (green = safe / red = alarm)
    const buzX  = W*0.86,  buzY  = H/2;
    const mcuX  = W*0.30,  mcuY  = H/2;   // not drawn separately — folded into cap area
    const railY_top = 18, railY_bot = H-14;

    // Power rails
    lctx.beginPath(); lctx.moveTo(20, railY_top); lctx.lineTo(W-10, railY_top);
    lctx.strokeStyle='rgba(255,200,50,.2)'; lctx.lineWidth=1.5; lctx.stroke();
    lctx.fillStyle='rgba(255,200,50,.4)'; lctx.font='7px monospace'; lctx.textAlign='left';
    lctx.fillText('+5V', 22, railY_top+8);

    lctx.beginPath(); lctx.moveTo(20, railY_bot); lctx.lineTo(W-10, railY_bot);
    lctx.strokeStyle='rgba(0,180,60,.22)'; lctx.lineWidth=1.5; lctx.stroke();
    lctx.fillStyle='rgba(0,180,60,.4)'; lctx.fillText('GND', 22, railY_bot-3);

    // Helper: draw animated trace segment
    function trace(pts, on){
      lctx.beginPath();
      pts.forEach((p,i)=> i===0 ? lctx.moveTo(p[0],p[1]) : lctx.lineTo(p[0],p[1]));
      lctx.strokeStyle = on
        ? `rgba(${alarmed?'231,76,60':proximity?'241,196,15':'0,200,80'},${traceA})`
        : 'rgba(0,100,40,.25)';
      lctx.lineWidth = on ? 2.5 : 1;
      if(on){ lctx.shadowBlur=6; lctx.shadowColor=traceCol; }
      lctx.stroke(); lctx.shadowBlur=0;
    }

    // ── WIRE: dashed from top = connects to PZT on car bumper above ──
    lctx.setLineDash([4,5]);
    lctx.strokeStyle=`rgba(${alarmed?'231,76,60':proximity?'241,196,15':'0,245,212'},.5)`;
    lctx.lineWidth=1.5;
    lctx.beginPath(); lctx.moveTo(pztX, 0); lctx.lineTo(pztX, pztY-12); lctx.stroke();
    lctx.setLineDash([]);
    // small label above wire
    lctx.fillStyle=`rgba(${alarmed?'231,76,60':proximity?'241,196,15':'0,245,212'},.55)`;
    lctx.font='6px monospace'; lctx.textAlign='center';
    lctx.fillText('FROM', pztX, 9);
    lctx.fillText('SENSOR', pztX, 16);

    // Main signal traces
    trace([[pztX,pztY],[opX-14,opY]], alarmed||proximity);    // PZT → OpAmp
    trace([[opX+14,opY],[capX-8,capY]], alarmed||proximity);  // OpAmp → Cap
    trace([[capX+8,capY],[resX-12,resY]], alarmed);            // Cap → Resistor
    trace([[resX+12,resY],[ledX-12,ledY]], alarmed);           // Resistor → LED1
    trace([[ledX+12,ledY],[led2X-12,led2Y]], alarmed);         // LED1 → LED2
    trace([[led2X+12,led2Y],[buzX-14,buzY]], alarmed);         // LED2 → Buzzer

    // GND drops
    trace([[pztX,pztY+12],[pztX,railY_bot]], false);
    trace([[opX,opY+14],[opX,railY_bot]], false);
    trace([[ledX,ledY+12],[ledX,railY_bot]], false);
    trace([[led2X,led2Y+12],[led2X,railY_bot]], false);
    trace([[buzX,buzY+12],[buzX,railY_bot]], false);

    // Animated signal ball on trace
    if(alarmed || proximity){
      const ballT = (waveT2 % 60)/60;
      // travel PZT → OpAmp → Cap → Resistor → LED
      const path = alarmed
        ? [[pztX,pztY],[opX-14,opY],[opX+14,opY],[capX-8,capY],[capX+8,capY],[resX-12,resY],[resX+12,resY],[ledX-12,ledY]]
        : [[pztX,pztY],[opX-14,opY],[opX+14,opY],[capX-8,capY]];
      const total = path.reduce((s,p,i)=>i===0?0:s+Math.hypot(p[0]-path[i-1][0],p[1]-path[i-1][1]),0);
      let rem = ballT*total, bx=path[0][0], by=path[0][1];
      for(let i=1;i<path.length;i++){
        const seg=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);
        if(rem<=seg){ bx=path[i-1][0]+(path[i][0]-path[i-1][0])*(rem/seg); by=path[i-1][1]+(path[i][1]-path[i-1][1])*(rem/seg); break; }
        rem-=seg;
      }
      lctx.beginPath(); lctx.arc(bx,by,3,0,Math.PI*2);
      lctx.fillStyle=traceCol; lctx.shadowBlur=10; lctx.shadowColor=traceCol;
      lctx.fill(); lctx.shadowBlur=0;
    }

    // ── PZT PAD ──
    lctx.beginPath(); lctx.arc(pztX,pztY,10,0,Math.PI*2);
    lctx.fillStyle='#0a2a18';
    lctx.fill();
    lctx.strokeStyle = alarmed?'#e74c3c':proximity?'#f1c40f':'rgba(0,245,212,.5)';
    lctx.lineWidth=1.5; lctx.stroke();
    lctx.fillStyle=alarmed?'#e74c3c':proximity?'#f1c40f':'rgba(0,245,212,.8)';
    lctx.font='bold 6px monospace'; lctx.textAlign='center'; lctx.textBaseline='middle';
    lctx.fillText('PZT',pztX,pztY); lctx.textBaseline='alphabetic';
    lctx.fillStyle='rgba(0,200,100,.3)'; lctx.font='5px monospace';
    lctx.fillText('SENSOR',pztX,pztY+18);

    // ── RESISTOR ──
    lctx.fillStyle='#1a1200';
    lctx.fillRect(resX-12,resY-6,24,12);
    lctx.strokeStyle='rgba(200,150,50,.45)'; lctx.lineWidth=1;
    lctx.strokeRect(resX-12,resY-6,24,12);
    // coloured bands
    ['#e74c3c','#f5a623','#888'].forEach((c,i)=>{
      lctx.fillStyle=c; lctx.fillRect(resX-7+i*6,resY-6,4,12);
    });
    lctx.fillStyle='rgba(200,150,50,.4)'; lctx.font='5px monospace';
    lctx.textAlign='center'; lctx.fillText('220Ω',resX,resY+19);

    // ── OP-AMP (triangle) ──
    lctx.beginPath();
    lctx.moveTo(opX-14, opY-16); lctx.lineTo(opX-14, opY+16); lctx.lineTo(opX+14, opY); lctx.closePath();
    lctx.fillStyle='#0a2218'; lctx.fill();
    lctx.strokeStyle='rgba(0,200,120,.5)'; lctx.lineWidth=1.2; lctx.stroke();
    lctx.fillStyle='rgba(0,220,120,.7)'; lctx.font='6px monospace'; lctx.textAlign='center'; lctx.textBaseline='middle';
    lctx.fillText('OP', opX-3, opY-4); lctx.fillText('AMP', opX-3, opY+5);
    lctx.textBaseline='alphabetic';
    lctx.fillStyle='rgba(0,200,100,.3)'; lctx.font='5px monospace';
    lctx.fillText('BUFFER', opX, opY+24);

    // ── CAPACITOR ──
    lctx.strokeStyle='rgba(0,200,200,.45)'; lctx.lineWidth=1.5;
    lctx.beginPath(); lctx.moveTo(capX, capY-14); lctx.lineTo(capX, capY-5); lctx.stroke();
    lctx.beginPath(); lctx.moveTo(capX-9, capY-5); lctx.lineTo(capX+9, capY-5); lctx.lineWidth=2; lctx.stroke();
    lctx.beginPath(); lctx.moveTo(capX-9, capY+5); lctx.lineTo(capX+9, capY+5); lctx.lineWidth=2; lctx.stroke();
    lctx.lineWidth=1.5;
    lctx.beginPath(); lctx.moveTo(capX, capY+5); lctx.lineTo(capX, capY+14); lctx.stroke();
    lctx.fillStyle='rgba(0,200,200,.4)'; lctx.font='5px monospace'; lctx.textAlign='center';
    lctx.fillText('100nF', capX, capY+24);

    // ── LED ──
    const ledOn    = alarmed;
    const ledGlowA = ledOn ? (.5 + ledPulse2*.5) : proximity ? .15 : 0;

    // LED outer halo
    if(ledOn){
      const halo = lctx.createRadialGradient(ledX,ledY,0,ledX,ledY,38);
      halo.addColorStop(0,`rgba(231,76,60,${.4*ledPulse2})`);
      halo.addColorStop(1,'transparent');
      lctx.fillStyle=halo;
      lctx.beginPath(); lctx.arc(ledX,ledY,38,0,Math.PI*2); lctx.fill();
    }
    // LED body
    lctx.beginPath(); lctx.arc(ledX,ledY,11,0,Math.PI*2);
    lctx.fillStyle = ledOn
      ? `rgba(255,60,40,${.6+ledGlowA*.4})`
      : proximity ? 'rgba(80,30,30,.6)' : 'rgba(40,15,15,.5)';
    if(ledOn){ lctx.shadowBlur=18; lctx.shadowColor='#ff3020'; }
    lctx.fill(); lctx.shadowBlur=0;
    // LED flat cathode edge
    lctx.strokeStyle = ledOn ? `rgba(255,100,80,${.5+ledGlowA*.5})` : 'rgba(100,40,40,.3)';
    lctx.lineWidth=1.5; lctx.stroke();
    lctx.beginPath(); lctx.moveTo(ledX+8,ledY-7); lctx.lineTo(ledX+8,ledY+7);
    lctx.strokeStyle='rgba(160,60,50,.6)'; lctx.lineWidth=1.5; lctx.stroke();
    // LED label + status
    lctx.fillStyle = ledOn ? '#ff6050' : 'rgba(120,50,50,.5)';
    lctx.font='bold 7px monospace'; lctx.textAlign='center';
    lctx.fillText('LED',ledX,ledY+22);
    if(ledOn){
      lctx.fillStyle=`rgba(255,120,80,${.6+ledPulse2*.4})`;
      lctx.font='6px monospace';
      lctx.fillText('🔴 ON',ledX,ledY+32);
    } else {
      lctx.fillStyle='rgba(100,50,50,.4)'; lctx.font='6px monospace';
      lctx.fillText('off',ledX,ledY+32);
    }

    // ── LED 2 (status indicator — green=safe, yellow=near, red=alarm) ──
    const led2On = alarmed || proximity;
    const led2Col = alarmed ? '#e74c3c' : proximity ? '#f1c40f' : '#2ecc71';
    const led2ColRgb = alarmed ? '231,76,60' : proximity ? '241,196,15' : '46,204,113';
    if(led2On){
      const h2 = lctx.createRadialGradient(led2X, led2Y, 0, led2X, led2Y, 32);
      h2.addColorStop(0, `rgba(${led2ColRgb},${.35*ledPulse2})`);
      h2.addColorStop(1, 'transparent');
      lctx.fillStyle=h2; lctx.beginPath(); lctx.arc(led2X, led2Y, 32, 0, Math.PI*2); lctx.fill();
    }
    lctx.beginPath(); lctx.arc(led2X, led2Y, 11, 0, Math.PI*2);
    lctx.fillStyle = led2On ? `rgba(${led2ColRgb},${.5+ledPulse2*.5})` : 'rgba(15,30,15,.5)';
    if(led2On){ lctx.shadowBlur=14; lctx.shadowColor=led2Col; }
    lctx.fill(); lctx.shadowBlur=0;
    lctx.strokeStyle = led2On ? `rgba(${led2ColRgb},.8)` : 'rgba(30,60,30,.4)';
    lctx.lineWidth=1.5; lctx.stroke();
    lctx.beginPath(); lctx.moveTo(led2X+8, led2Y-7); lctx.lineTo(led2X+8, led2Y+7);
    lctx.strokeStyle='rgba(60,80,60,.5)'; lctx.lineWidth=1.5; lctx.stroke();
    // LED2 label
    const led2StatusText = alarmed ? '🔴 ALARM' : proximity ? '🟡 NEAR' : '🟢 SAFE';
    lctx.fillStyle = led2On ? led2Col : 'rgba(40,80,40,.5)';
    lctx.font='bold 7px monospace'; lctx.textAlign='center'; lctx.textBaseline='alphabetic';
    lctx.fillText('STATUS', led2X, led2Y+22);
    if(led2On){ lctx.font='6px monospace'; lctx.fillText(led2StatusText, led2X, led2Y+32); }

    // ── BUZZER ──
    const buzOn = alarmed;
    lctx.beginPath(); lctx.arc(buzX,buzY,11,0,Math.PI*2);
    lctx.fillStyle = buzOn ? `rgba(231,76,60,${.3+ledPulse2*.3})` : 'rgba(40,20,20,.5)';
    if(buzOn){ lctx.shadowBlur=12; lctx.shadowColor='#e74c3c'; }
    lctx.fill(); lctx.shadowBlur=0;
    lctx.strokeStyle = buzOn ? `rgba(231,76,60,${.5+ledPulse2*.5})` : 'rgba(80,40,40,.3)';
    lctx.lineWidth=1.5; lctx.stroke();
    if(buzOn){
      [17,24,32].forEach((r,i)=>{
        lctx.beginPath(); lctx.arc(buzX,buzY,r,0,Math.PI*2);
        lctx.strokeStyle=`rgba(231,76,60,${(.45-i*.13)*ledPulse2})`;
        lctx.lineWidth=1; lctx.stroke();
      });
    }
    lctx.fillStyle='rgba(220,100,80,.8)'; lctx.font='6px monospace';
    lctx.textAlign='center'; lctx.textBaseline='middle'; lctx.fillText('BUZ',buzX,buzY);
    lctx.textBaseline='alphabetic';
    lctx.fillStyle = buzOn ? 'rgba(231,76,60,.8)' : 'rgba(100,50,50,.4)';
    lctx.font='bold 6px monospace'; lctx.fillText('BUZZER',buzX,buzY+22);

    // PCB label
    lctx.fillStyle='rgba(0,180,60,.2)'; lctx.font='6px monospace';
    lctx.textAlign='center'; lctx.fillText('PCB · CAR KNOCK CIRCUIT',W/2,H-3);
  }

  function ckLoop(){ drawCar(); drawCKWave(); drawCarLed(); requestAnimationFrame(ckLoop); }
  reset();
  ckLoop();
})();