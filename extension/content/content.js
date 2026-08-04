// Content script : badge + bouton flottant ouvrant Clarence dans un panneau
// iframe. Ne lit RIEN de la page. Deux messages acceptés depuis l'iframe :
// sa hauteur de contenu (dimensionnement sans scroll) et une demande de
// livraison du fichier anonymisé DANS la page (voir deliverFileToPage — le
// glisser-déposer natif cross-frame vers un site tiers s'est avéré peu fiable
// après deux tentatives, cette méthode contourne le glisser entièrement).
chrome.runtime.sendMessage({ clarence: 'ai-site' });

// Injecte un fichier (déjà anonymisé, reçu de l'iframe) directement dans la
// page hôte — sans passer par un geste de glisser natif, peu fiable entre
// une iframe d'extension et le JS propriétaire d'un site tiers.
// Deux méthodes, dans l'ordre de fiabilité :
//  1. Assigner directement .files d'un <input type="file"> trouvé sur la
//     page (technique standard d'automatisation ; ne dépend d'aucun geste
//     utilisateur ni d'un événement "trusted"). On NE filtre PAS sur la
//     visibilité : beaucoup de sites cachent leur input natif (display:none)
//     derrière un bouton stylé, c'est justement la cible qu'on veut.
//  2. Repli : un événement 'drop' synthétique sur le corps de la page — best
//     effort, certains sites l'ignorent s'ils vérifient event.isTrusted.
// Limite assumée : si le site ne rend son input qu'après ouverture de son
// propre menu "joindre un fichier", rien n'est trouvable tant que l'utilisateur
// n'a pas cliqué sur ce menu côté site.
function deliverFileToPage(blob, name) {
  const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
  const dt = new DataTransfer();
  dt.items.add(file);

  // Tous les <input type=file> de la page (visibles ou cachés — les sites
  // cachent souvent le vrai input derrière un bouton stylé). On préfère celui
  // dont l'attribut accept correspond au type du fichier, sinon le dernier
  // (souvent le plus récemment monté = l'actif), sinon n'importe lequel.
  const inputs = [...document.querySelectorAll('input[type="file"]')];
  let input = inputs.find(i => {
    const acc = (i.getAttribute('accept') || '').toLowerCase();
    return acc && (acc.includes(file.type) || acc.split(',').some(a => name.toLowerCase().endsWith(a.trim().replace(/^\./, '.'))));
  }) || inputs[inputs.length - 1] || null;

  if (input) {
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return { delivered: true, method: 'input', inputs: inputs.length };
  }

  // Repli : drop synthétique. Best effort — beaucoup de sites l'ignorent
  // (event.isTrusted === false). Signalé comme non fiable dans le résultat.
  document.body.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  return { delivered: false, method: 'drop-fallback', inputs: 0 };
}

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
      width: 48px; height: 48px; border-radius: 0%; border: none; cursor: pointer;
      background: #020202; color: #252a41; font: 600 20px/1 system-ui;
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
      width: 40px;
      height: 40px;
      object-fit: contain;
      pointer-events: none;
      transform: translate(0, 0);
      filter: drop-shadow(0 1px 1px rgba(0,0,0,.2));
    }
    .panel {
      position: fixed; bottom: 82px; right: 22px; z-index: 2147483647;
      width: 560px; height: 480px; max-height: calc(100vh - 110px);
      max-width: calc(100vw - 44px);
      border: none; border-radius: 0px;
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
btn.title = 'Clarence';

const img = document.createElement('img');
img.src = chrome.runtime.getURL('popup/img/ClarenceFairySimpleLogo.png');
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

btn.style.borderRadius = '0%';
btn.style.border = '2px solid #0b0e1a';
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
  // (uniquement un nombre, borné par max-height côté CSS). Et demande de
  // livraison directe d'un fichier anonymisé dans la page (voir plus haut).
  window.addEventListener('message', ev => {
    if (ev.source !== frame.contentWindow) return; // uniquement notre panneau
    const h = ev.data && ev.data.clarencePanelHeight;
    if (typeof h === 'number' && h > 0) {
      frame.style.height = Math.ceil(h) + 'px';
    }
    const deliver = ev.data && ev.data.clarenceDeliverFile;
    if (deliver && deliver.blob) {
      const result = deliverFileToPage(deliver.blob, deliver.name);
      frame.contentWindow.postMessage({ clarenceDeliverResult: result }, '*');
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
