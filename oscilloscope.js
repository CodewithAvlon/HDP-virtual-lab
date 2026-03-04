document.addEventListener('DOMContentLoaded', function(){
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
});