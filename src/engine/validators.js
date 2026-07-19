// Validateurs mathématiques — zéro tolérance (voir CLAUDE.md §Tests)

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
