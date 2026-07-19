// Adaptateur XLSX — Phase 2. Lecture/écriture des cellules via SheetJS
// (Community Edition, installée depuis cdn.sheetjs.com — la version publiée
// sur le registre npm porte des vulnérabilités connues sans correctif).
// Nettoyage des métadonnées via ooxml-metadata.js (partagé avec DOCX).
//
// Limite assumée : le texte enrichi (plusieurs styles dans une même cellule)
// est aplati en un seul remplacement — pas de découpage par run comme pour
// DOCX, où c'est le cas courant plutôt que l'exception.
import * as XLSX from 'xlsx';
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate';
import { stripCoreProps, stripAppProps, stripCommentParts } from './ooxml-metadata.js';

function splitId(id) {
  const idx = id.lastIndexOf('!');
  return [id.slice(0, idx), id.slice(idx + 1)];
}

// { units: [{ id: 'Feuille!A1', text }] } — seules les cellules de type
// chaîne (t === 's'), sans formule, non vides, sont retenues. Nombres, dates,
// booléens et formules ne sont jamais touchés (risque de corruption sinon).
export function extractTextUnits(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const units = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    for (const addr of Object.keys(sheet)) {
      if (addr.startsWith('!')) continue; // clés spéciales de la feuille (!ref, !merges, !cols…)
      const cell = sheet[addr];
      if (cell.f !== undefined || cell.t !== 's' || !cell.v) continue;
      units.push({ id: `${sheetName}!${addr}`, text: String(cell.v) });
    }
  }
  return { units };
}

// resultsById : Map<id, { maskedText }> — ré-analyse le classeur depuis zéro.
export function applyMask(arrayBuffer, resultsById) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  for (const [id, { maskedText }] of resultsById) {
    const [sheetName, addr] = splitId(id);
    const cell = wb.Sheets[sheetName]?.[addr];
    if (!cell) continue;
    cell.v = maskedText;
    cell.w = maskedText;
    delete cell.r; // runs de texte enrichi : invalidés par le remplacement à plat
  }
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

export function stripMetadata(arrayBuffer) {
  const zip = unzipSync(new Uint8Array(arrayBuffer));
  let map = new Map(Object.entries(zip));

  if (map.has('docProps/core.xml')) {
    map.set('docProps/core.xml', strToU8(stripCoreProps(strFromU8(map.get('docProps/core.xml')))));
  }
  if (map.has('docProps/app.xml')) {
    map.set('docProps/app.xml', strToU8(stripAppProps(strFromU8(map.get('docProps/app.xml')))));
  }
  map = stripCommentParts(map);

  return zipSync(Object.fromEntries(map));
}
