// ui.js — Jaetut UI-palaute-komponentit (toast + confirm/notificaatio-modali)
// Korvaa natiivit alert()/confirm()-kutsut teemaan sopivalla toteutuksella.
// Injektoi oman tyylinsä -> toimii sekä pääsovelluksessa että reissuapuri-sivulla.

let uiReady = false;
function ensureUi() {
  if (uiReady) return;
  uiReady = true;
  const st = document.createElement('style');
  st.textContent = `
    .mk-toast-wrap { position: fixed; left: 12px; right: 12px; bottom: calc(14px + env(safe-area-inset-bottom, 0px));
      z-index: 10000; display: flex; flex-direction: column; gap: 8px; align-items: center;
      pointer-events: none; }
    .mk-toast { pointer-events: auto; max-width: 480px; width: auto; background: #313244; color: #cdd6f4;
      border: 1px solid #45475a; border-left: 4px solid #89b4fa; border-radius: 10px;
      padding: 12px 16px; font-size: 0.95em; line-height: 1.45; box-shadow: 0 8px 24px rgba(0,0,0,.5);
      animation: mkToastIn .22s ease-out; }
    .mk-toast.ok    { border-left-color: #a6e3a1; }
    .mk-toast.err   { border-left-color: #f38ba8; }
    .mk-toast.warn  { border-left-color: #f9e2af; }
    .mk-toast.out   { animation: mkToastOut .18s ease-in forwards; }
    @keyframes mkToastIn  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes mkToastOut { to { opacity: 0; transform: translateY(8px); } }

    .mk-dialog-overlay { position: fixed; inset: 0; z-index: 10001; display: flex;
      align-items: center; justify-content: center; padding: 18px;
      background: rgba(0,0,0,.6); backdrop-filter: blur(2px); animation: mkToastIn .15s ease-out; }
    .mk-dialog { background: #313244; color: #cdd6f4; border: 1px solid #45475a;
      border-radius: 12px; box-shadow: 0 14px 34px rgba(0,0,0,.5); max-width: 420px; width: 100%;
      padding: 20px; max-height: 80vh; max-height: 80dvh; overflow-y: auto; overscroll-behavior: contain; }
    .mk-dialog-msg { font-size: 0.98em; line-height: 1.55; white-space: pre-line; color: #cdd6f4; }
    .mk-dialog-actions { display: flex; gap: 10px; margin-top: 18px; }
    .mk-dialog-actions .mk-btn { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,.08);
      font: inherit; font-weight: 600; cursor: pointer; background: #585b70; color: #cdd6f4; }
    .mk-dialog-actions .mk-btn.primary { background: #89b4fa; color: #11111b; border-color: transparent; }
    .mk-dialog-actions .mk-btn.danger  { background: #f38ba8; color: #11111b; border-color: transparent; }
    @media (prefers-reduced-motion: reduce) {
      .mk-toast, .mk-toast.out, .mk-dialog-overlay { animation: none !important; }
    }
  `;
  document.head.appendChild(st);
}

// toast('Teksti', 'ok'|'err'|'warn'|'info', ms=3800)
export function toast(message, type = 'info', ms = 3800) {
  ensureUi();
  let wrap = document.querySelector('.mk-toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'mk-toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `mk-toast ${type}`;
  el.setAttribute('role', type === 'err' ? 'alert' : 'status');
  el.textContent = message;
  wrap.appendChild(el);
  el.addEventListener('click', () => dismiss());
  let timer = setTimeout(dismiss, ms);
  function dismiss() {
    clearTimeout(timer);
    el.classList.add('out');
    setTimeout(() => { el.remove(); if (!wrap.children.length) wrap.remove(); }, 190);
  }
}

// Modaalipohjainen confirm — korvaa window.confirm.
// Palauttaa Promise<boolean>. danger=true -> vahvistusnappi punainen.
export function confirmDialog(message, { okText = 'Poista', cancelText = 'Peruuta', danger = true } = {}) {
  ensureUi();
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'mk-dialog-overlay';
    const box = document.createElement('div');
    box.className = 'mk-dialog';
    box.setAttribute('role', 'alertdialog');
    const msg = document.createElement('div');
    msg.className = 'mk-dialog-msg';
    msg.textContent = message;
    const actions = document.createElement('div');
    actions.className = 'mk-dialog-actions';
    const cancel = document.createElement('button');
    cancel.className = 'mk-btn';
    cancel.textContent = cancelText;
    const ok = document.createElement('button');
    ok.className = `mk-btn ${danger ? 'danger' : 'primary'}`;
    ok.textContent = okText;
    const done = (val) => { document.body.classList.remove('modal-open'); ov.remove(); resolve(val); };
    cancel.onclick = () => done(false);
    ok.onclick = () => done(true);
    ov.onclick = (e) => { if (e.target === ov) done(false); };
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', esc); done(false); }
    });
    actions.appendChild(cancel);
    actions.appendChild(ok);
    box.appendChild(msg);
    box.appendChild(actions);
    ov.appendChild(box);
    document.body.appendChild(ov);
    document.body.classList.add('modal-open'); // estää taustan scrollauksen
    cancel.focus();
  });
}

// Tekstikysely — korvaa window.prompt. Palauttaa Promise<string|null> (null = peruutus).
export function promptDialog(message, { defaultValue = '', okText = 'OK', cancelText = 'Peruuta', placeholder = '' } = {}) {
  ensureUi();
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'mk-dialog-overlay';
    const box = document.createElement('div');
    box.className = 'mk-dialog';
    box.setAttribute('role', 'dialog');
    const msg = document.createElement('div');
    msg.className = 'mk-dialog-msg';
    msg.textContent = message;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.placeholder = placeholder;
    input.style.cssText = 'width:100%; padding:12px; margin:12px 0 0; background:#181825; border:1px solid #45475a; border-radius:8px; color:#cdd6f4; font:inherit; box-sizing:border-box;';
    const actions = document.createElement('div');
    actions.className = 'mk-dialog-actions';
    const cancel = document.createElement('button');
    cancel.className = 'mk-btn';
    cancel.textContent = cancelText;
    const ok = document.createElement('button');
    ok.className = 'mk-btn primary';
    ok.textContent = okText;
    const done = (val) => { document.body.classList.remove('modal-open'); ov.remove(); resolve(val); };
    cancel.onclick = () => done(null);
    ok.onclick = () => done(input.value);
    input.onkeydown = (e) => { if (e.key === 'Enter') done(input.value); };
    ov.onclick = (e) => { if (e.target === ov) done(null); };
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', esc); done(null); }
    });
    actions.appendChild(cancel);
    actions.appendChild(ok);
    box.appendChild(msg);
    box.appendChild(input);
    box.appendChild(actions);
    ov.appendChild(box);
    document.body.appendChild(ov);
    document.body.classList.add('modal-open');
    input.focus();
    input.select();
  });
}

// Valintalista — korvaa monivalinta-promptit. options = [{ label, value, danger? }]
// Palauttaa Promise<value|null> (null = peruutus).
export function choiceDialog(message, options, { cancelText = 'Peruuta' } = {}) {
  ensureUi();
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'mk-dialog-overlay';
    const box = document.createElement('div');
    box.className = 'mk-dialog';
    box.setAttribute('role', 'dialog');
    const msg = document.createElement('div');
    msg.className = 'mk-dialog-msg';
    msg.style.marginBottom = '12px';
    msg.textContent = message;
    box.appendChild(msg);
    const done = (val) => { document.body.classList.remove('modal-open'); ov.remove(); resolve(val); };
    options.forEach(opt => {
      const b = document.createElement('button');
      b.className = `mk-btn ${opt.danger ? 'danger' : ''}`;
      b.style.cssText = 'width:100%; padding:12px; margin-top:8px; border-radius:8px; border:1px solid rgba(255,255,255,.08); font:inherit; font-weight:600; cursor:pointer; background:#585b70; color:#cdd6f4;';
      if (opt.danger) { b.style.background = '#f38ba8'; b.style.color = '#11111b'; }
      b.textContent = opt.label;
      b.onclick = () => done(opt.value);
      box.appendChild(b);
    });
    const cancel = document.createElement('button');
    cancel.className = 'mk-btn';
    cancel.style.cssText = 'width:100%; padding:12px; margin-top:12px; border-radius:8px; border:none; font:inherit; cursor:pointer; background:transparent; color:#a6adc8;';
    cancel.textContent = cancelText;
    cancel.onclick = () => done(null);
    box.appendChild(cancel);
    ov.onclick = (e) => { if (e.target === ov) done(null); };
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', esc); done(null); }
    });
    ov.appendChild(box);
    document.body.appendChild(ov);
    document.body.classList.add('modal-open');
  });
}

// Modaalipohjainen ilmoitus — korvaa window.alert monirivisille teksteille.
// Palauttaa Promise<void>.
export function noticeDialog(message, { okText = 'OK' } = {}) {
  ensureUi();
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'mk-dialog-overlay';
    const box = document.createElement('div');
    box.className = 'mk-dialog';
    box.setAttribute('role', 'dialog');
    const msg = document.createElement('div');
    msg.className = 'mk-dialog-msg';
    msg.textContent = message;
    const actions = document.createElement('div');
    actions.className = 'mk-dialog-actions';
    const ok = document.createElement('button');
    ok.className = 'mk-btn primary';
    ok.textContent = okText;
    const done = () => { document.body.classList.remove('modal-open'); ov.remove(); resolve(); };
    ok.onclick = done;
    ov.onclick = (e) => { if (e.target === ov) done(); };
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' || e.key === 'Enter') { document.removeEventListener('keydown', esc); done(); }
    });
    actions.appendChild(ok);
    box.appendChild(msg);
    box.appendChild(actions);
    ov.appendChild(box);
    document.body.appendChild(ov);
    document.body.classList.add('modal-open');
    ok.focus();
  });
}
