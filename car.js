document.addEventListener('DOMContentLoaded', function(){
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
});