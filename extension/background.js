// Service worker minimal. Aucune donnée utilisateur n'y transite : il ne voit
// jamais le contenu d'un document, seulement des identifiants d'onglet.

// Badge quand l'onglet actif est un site d'IA couvert.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.clarence === 'ai-site' && sender.tab && sender.tab.id !== undefined) {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#4B5A45' });
    chrome.action.setTitle({
      tabId: sender.tab.id,
      title: 'Clarence — site IA détecté, pense à anonymiser avant de coller'
    });
  }
});

// UNE SEULE FAÇON D'OUVRIR CLARENCE.
//
// L'extension avait deux entrées qui n'affichaient pas la même chose : le
// panneau injecté dans la page, et une popup native ouverte par l'icône de la
// barre d'outils. Même page, mais l'une contrainte par la fenêtre de Chrome
// (plafonnée à 600 px de haut, non redimensionnable) et l'autre libre - donc
// deux mises en page pour un même outil.
//
// `default_popup` a donc été retiré du manifeste, ce qui fait remonter le clic
// ici. L'icône ouvre maintenant EXACTEMENT ce que le bouton flottant ouvre.
// Le raccourci clavier (`_execute_action`) passe par le même chemin.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { clarence: 'basculer-panneau' });
    return;
  } catch {
    // Pas de content script sur cet onglet : ce n'est ni ChatGPT, ni Claude,
    // ni Gemini - ou la page n'a pas été rechargée depuis l'installation.
  }

  // REPLI, et il est délibéré. Ne rien faire sur un clic serait le pire des
  // choix : l'utilisateur ne saurait pas si l'extension est cassée. On ouvre
  // donc la MÊME interface, avec la même mise en page (`?panel=1`), dans un
  // onglet. Le contenant change, pas le visuel.
  const onglets = await chrome.tabs.query({ url: chrome.runtime.getURL('popup/popup.html*') });
  if (onglets.length) {
    // Déjà ouverte : on y retourne plutôt que d'en empiler une deuxième.
    await chrome.tabs.update(onglets[0].id, { active: true });
    await chrome.windows.update(onglets[0].windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html?panel=1') });
});
