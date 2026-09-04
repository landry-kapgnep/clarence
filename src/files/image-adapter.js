// Adaptateur image (jpeg/PNG) : nettoyage de métadonnées uniquement, pas
// d'anonymisation de contenu. La détection visuelle par OCR est un chantier à
// part (voir docs/notes-techniques.md).
//
// L'EXIF (GPS, appareil, date) et les chunks texte PNG sont une fuite de PII
// sous-estimée. On ré-encode via canvas plutôt que d'écrire un parseur binaire
// des segments : un canvas ne préserve QUE les pixels décodés, donc aucune
// métadonnée ne peut structurellement survivre, et aucun bug de parsing ne peut
// laisser fuir un GPS résiduel.
//
// Contrepartie : le jpeg est recompressé (qualité 0.92), le PNG reste sans
// perte. Non testable en Node, vérifié manuellement en navigateur.

export async function stripMetadata(buffer, opts = {}) {
  const mime = opts.mime === 'image/jpeg' || opts.mime === 'image/jpg' ? 'image/jpeg' : 'image/png';
  const blob = new Blob([buffer], { type: mime });
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const outBlob = mime === 'image/jpeg'
    ? await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
    : await canvas.convertToBlob({ type: 'image/png' });
  return outBlob.arrayBuffer();
}

// Pas de texte : une image n'a pas d'unités PII textuelles à faire transiter
// par anonymizeUnits. processFile() (main.js) court-circuite tout le pipeline
// de masquage/NER pour les types marqués `metadataOnly` et appelle
// stripMetadata directement - ces deux fonctions ne sont là que pour
// respecter l'interface commune si jamais invoquées par erreur.
export async function extractTextUnits() {
  return { units: [] };
}

export async function applyMask(buffer) {
  return buffer;
}
