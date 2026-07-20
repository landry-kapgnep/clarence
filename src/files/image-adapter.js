// Adaptateur Image (JPEG/PNG) — nettoyage de métadonnées uniquement, pas
// d'anonymisation de contenu (voir CLAUDE.md "Idées explorées" : la détection
// visuelle par OCR/vision est un chantier à part, hors de portée ici).
//
// L'EXIF (GPS, modèle d'appareil, date) et les chunks texte PNG (tEXt/iTXt/
// eXIf) sont une vraie fuite de PII sous-estimée. Stratégie retenue :
// RE-ENCODAGE via canvas plutôt qu'un parseur binaire artisanal des segments
// JPEG/chunks PNG. Un canvas ne préserve QUE les pixels décodés — aucune
// métadonnée ne peut structurellement survivre, donc aucun risque qu'un bug
// de parsing laisse fuiter un GPS résiduel (priorité zéro-fuite, même logique
// que le masquage IBAN/NIR sur structure dans regex-detect.js). Contrepartie
// assumée : le JPEG est recompressé (perte de génération mineure, qualité
// 0.92) ; le PNG reste sans perte de pixels (juste une redéfinition d'octets).
//
// Non testable en Node (pas de createImageBitmap/OffscreenCanvas) : vérifié
// manuellement en navigateur réel (règle du projet), voir CLAUDE.md.

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
// stripMetadata directement — ces deux fonctions ne sont là que pour
// respecter l'interface commune si jamais invoquées par erreur.
export async function extractTextUnits() {
  return { units: [] };
}

export async function applyMask(buffer) {
  return buffer;
}
