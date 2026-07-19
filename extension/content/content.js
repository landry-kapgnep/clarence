// Content script : badge + bouton flottant ouvrant Clarence dans un panneau
// iframe. Ne lit RIEN de la page. Le seul message accepté depuis l'iframe est
// sa hauteur de contenu (nombre), pour dimensionner le panneau sans scroll.
chrome.runtime.sendMessage({ clarence: 'ai-site' });

const HOST_ID = 'clarence-host';
if (!document.getElementById(HOST_ID)) {
  const host = document.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes clarence-pop {
      0%   { opacity: 0; transform: scale(.3) translateY(14px); }
      70%  { transform: scale(1.08); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .btn {
      position: fixed; bottom: 22px; right: 22px; z-index: 2147483647;
      width: 48px; height: 48px; border-radius: 50%; border: none; cursor: pointer;
      background: #ffffff; color: #EDE6D3; font: 600 20px/1 system-ui;
      box-shadow: 0 4px 14px rgba(0,0,0,.3);
      animation: clarence-pop .55s cubic-bezier(.34,1.56,.64,1) .3s both;
      transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease;
      display: flex; align-items: center; justify-content: center;
      padding: 0; line-height: 1;
    }
    .btn:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,.4); }
    .btn:active { transform: scale(.92); }
    .btn.open-state { transform: rotate(45deg) scale(1.02); }
    .btn.open-state:hover { transform: rotate(45deg) scale(1.1); }
    .btn img {
      display: block;
      width: 22px;
      height: 22px;
      object-fit: contain;
      pointer-events: none;
      transform: translate(0, 0);
      filter: drop-shadow(0 1px 1px rgba(0,0,0,.2));
    }
    .panel {
      position: fixed; bottom: 82px; right: 22px; z-index: 2147483647;
      width: 560px; height: 480px; max-height: calc(100vh - 110px);
      max-width: calc(100vw - 44px);
      border: none; border-radius: 20px;
      box-shadow: 0 24px 60px rgba(0,0,0,.35);
      background: transparent;
      display: block; visibility: hidden; opacity: 0; pointer-events: none;
      transform: translateY(18px) scale(.96);
      transform-origin: bottom right;
      transition:
        opacity .2s cubic-bezier(.2,.9,.3,1),
        transform .26s cubic-bezier(.2,.9,.3,1),
        height .22s cubic-bezier(.2,.9,.3,1),
        visibility 0s linear .26s;
    }
    .panel.open {
      visibility: visible; opacity: 1; pointer-events: auto;
      transform: translateY(0) scale(1);
      transition:
        opacity .22s cubic-bezier(.2,.9,.3,1),
        transform .3s cubic-bezier(.2,.9,.3,1),
        height .22s cubic-bezier(.2,.9,.3,1),
        visibility 0s;
    }
  `;

const btn = document.createElement('button');
btn.className = 'btn';
btn.title = 'Clarence — anonymisez vos données';

const img = document.createElement('img');
img.src = chrome.runtime.getURL('popup/img/ClarenceLogoSimple.png');
img.alt = '';
img.loading = 'eager';
img.decoding = 'async';
img.style.display = 'block';
img.style.margin = '0';
img.style.padding = '0';

img.addEventListener('error', () => {
  btn.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"%237c70a8\"/><path d=\"M19 18h26l-10 28h-6L19 18z\" fill=\"white\"/></svg>')";
  btn.style.backgroundSize = 'contain';
  btn.style.backgroundPosition = 'center';
  btn.style.backgroundRepeat = 'no-repeat';
});

btn.appendChild(img);

btn.style.borderRadius = '45%';
btn.style.border = '3px solid #252a41';
btn.style.cursor = 'pointer';


  const frame = document.createElement('iframe');
  frame.className = 'panel';
  frame.allow = 'clipboard-write';

  btn.addEventListener('click', () => {
    if (!frame.src) frame.src = chrome.runtime.getURL('popup/popup.html?panel=1');
    const open = frame.classList.toggle('open');
    btn.classList.toggle('open-state', open);
    btn.title = open ? 'Fermer Clarence' : 'Clarence — anonymisez vos données';
  });

  // Auto-dimensionnement : l'iframe annonce la hauteur de son contenu
  // (uniquement un nombre, borné par max-height côté CSS).
  window.addEventListener('message', ev => {
    if (ev.source !== frame.contentWindow) return; // uniquement notre panneau
    const h = ev.data && ev.data.clarencePanelHeight;
    if (typeof h === 'number' && h > 0) {
      frame.style.height = Math.ceil(h) + 'px';
    }
  });

  shadow.append(style, btn, frame);
  (document.body || document.documentElement).appendChild(host);

  // Certains SPA (ChatGPT) purgent les nœuds étrangers lors d'un re-rendu :
  // on ré-attache l'hôte s'il est retiré. Callback trivial (isConnected).
  new MutationObserver(() => {
    if (!host.isConnected) (document.body || document.documentElement).appendChild(host);
  }).observe(document.documentElement, { childList: true, subtree: true });
}
