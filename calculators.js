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