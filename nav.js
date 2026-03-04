/* HDP Lab Navigation */
const PAGES = {
  'home':         'index.html',
  'theory':       'theory.html',
  'system':       'system.html',
  'oscilloscope': 'oscilloscope.html',
  'calculators':  'calculators.html',
  'materials':    'materials.html',
  'applications': 'applications.html',
  'exp-glass':    'exp-glass.html',
  'exp-car':      'exp-car.html'
};

function goTo(name) {
  window.location.href = PAGES[name] || 'index.html';
}

function toggleSidebar() {
  const sb  = document.getElementById('sidebar');
  const btn = document.getElementById('sb-btn');
  sb.classList.toggle('collapsed');
  btn.textContent = sb.classList.contains('collapsed') ? '\u276f' : '\u276e';
}

function markActive() {
  const cur = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-page]').forEach(el => {
    const target = PAGES[el.dataset.page] || 'index.html';
    el.classList.toggle('active', target === cur);
  });
}

document.addEventListener('DOMContentLoaded', markActive);