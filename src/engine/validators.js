// Validateurs mathématiques - zéro tolérance (voir docs/notes-techniques.md §Tests)

export function luhnCheck(numStr) {
  let sum = 0, alt = false;
  for (let i = numStr.length - 1; i >= 0; i--) {
    let n = parseInt(numStr[i], 10);
    if (Number.isNaN(n)) return false;
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

export function ibanCheck(iban) {
  const clean = iban.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, c => (c.charCodeAt(0) - 55).toString());
  let m = 0;
  for (let i = 0; i < numeric.length; i++) m = (m * 10 + parseInt(numeric[i], 10)) % 97;
  return m === 1;
}

export function nirCheck(nirRaw) {
  const nir = nirRaw.replace(/\s+/g, '');
  if (nir.length !== 15) return false;
  const base = nir.slice(0, 13).replace(/2A/i, '19').replace(/2B/i, '18');
  const key = parseInt(nir.slice(13, 15), 10);
  if (!/^\d{13}$/.test(base) || isNaN(key)) return false;
  // Limite connue : ne couvre pas les codes département DOM-TOM (3 chiffres)
  const n = BigInt(base);
  return Number(97n - (n % 97n)) === key;
}

// DNI / NIE espagnols - 8 chiffres + une lettre de contrôle calculée.
//
// Pourquoi un vrai validateur plutôt qu'un masquage sur structure : « 8 chiffres
// suivis d'une lettre » est une forme faible, qu'un code produit ou une
// référence interne peut prendre par accident. C'est exactement le raisonnement
// déjà appliqué à la carte bancaire (Luhn strict) plutôt qu'à l'IBAN ou au NIR,
// dont la structure se suffit à elle-même.
//
// Le NIE (titre de séjour étranger) suit la même clé, sa lettre initiale valant
// un chiffre : X→0, Y→1, Z→2. Un même calcul couvre donc les deux.
const LETTRES_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';
const PREFIXE_NIE = { X: '0', Y: '1', Z: '2' };

export function dniCheck(raw) {
  const s = (raw || '').replace(/[\s-]/g, '').toUpperCase();
  const m = /^([XYZ]?)(\d{7,8})([A-Z])$/.exec(s);
  if (!m) return false;
  const [, prefixe, chiffres, lettre] = m;
  // Un DNI porte 8 chiffres, un NIE 7 précédés de sa lettre : dans les deux cas
  // le nombre à diviser compte 8 chiffres une fois le préfixe substitué.
  const nombre = prefixe ? PREFIXE_NIE[prefixe] + chiffres : chiffres;
  if (nombre.length !== 8) return false;
  return LETTRES_DNI[Number(nombre) % 23] === lettre;
}
