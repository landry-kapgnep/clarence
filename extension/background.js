// Service worker minimal : badge quand l'onglet actif est un site d'IA couvert.
// Aucune donnée utilisateur ne transite ici.
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
