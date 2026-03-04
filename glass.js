document.addEventListener('DOMContentLoaded', function(){
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
});