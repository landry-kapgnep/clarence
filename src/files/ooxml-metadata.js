// Nettoyage des métadonnées ooxml (XLSX et DOCX partagent la même convention
// docProps/core.xml + docProps/app.xml, et la même mécanique de commentaires
// zip [partie + relations + content-types]).
import { strToU8, strFromU8 } from 'fflate';

function replaceTagContent(xml, tagName, newContent) {
  const re = new RegExp(`(<${tagName}(?:\\s[^>]*)?>)([\\s\\S]*?)(</${tagName}>)`, 'i');
  return xml.replace(re, `$1${newContent}$3`);
}

// Vide auteur/dernier-modif-par, remet la révision à 1, neutralise les dates
// (conservées au format W3CDTF attendu, pas supprimées, pour rester valides).
export function stripCoreProps(xmlString) {
  let out = xmlString;
  out = replaceTagContent(out, 'dc:creator', '');
  out = replaceTagContent(out, 'cp:lastModifiedBy', '');
  out = replaceTagContent(out, 'cp:revision', '1');
  out = replaceTagContent(out, 'dcterms:created', '1970-01-01T00:00:00Z');
  out = replaceTagContent(out, 'dcterms:modified', '1970-01-01T00:00:00Z');
  return out;
}

export function stripAppProps(xmlString) {
  let out = xmlString;
  out = replaceTagContent(out, 'Company', '');
  out = replaceTagContent(out, 'Manager', '');
  return out;
}

// resolvedTarget : chemin absolu (sans '/' initial) d'un Target relatif d'un
// fichier .rels, résolu depuis le dossier PARENT de son propre dossier _rels
// (ex. cible de 'xl/worksheets/_rels/sheet1.xml.rels' résolue depuis
// 'xl/worksheets/').
function resolveRelTarget(relsPath, target) {
  const relsDir = relsPath.replace(/\/_rels\/[^/]+\.rels$/, '');
  const stack = [];
  for (const part of (relsDir + '/' + target).split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

// zipMap : Map<chemin, Uint8Array> (sortie de fflate unzipSync). Retire les
// parties de commentaires (xl/comments*.xml, word/comments*.xml,
// threadedComments*.xml), les <Relationship> qui pointent vers elles dans
// n'importe quel *.rels, et les <Override> correspondantes de
// [Content_Types].xml. Ne modifie PAS le XML du document lui-même (les
// <w:commentReference> etc. sont retirés séparément par docx-adapter.js).
export function stripCommentParts(zipMap) {
  const isCommentPart = path => {
    const base = path.split('/').pop();
    return /^comments/i.test(base) || /^threadedComments/i.test(base);
  };
  const commentPaths = [...zipMap.keys()].filter(isCommentPart);
  if (commentPaths.length === 0) return zipMap;

  const out = new Map(zipMap);

  // Excel associe à chaque commentaire un dessin VML legacy (rendu de la
  // bulle de note) référencé dans le même .rels que la relation "comments" -
  // orphelin, il ne contient aucune PII mais peut faire échouer l'ouverture.
  const vmlPaths = new Set();
  for (const relsPath of [...out.keys()].filter(p => p.endsWith('.rels'))) {
    const relTags = strFromU8(out.get(relsPath)).match(/<Relationship\b[^>]*\/>/g) || [];
    const hasComments = relTags.some(tag => {
      const t = /Target="([^"]+)"/.exec(tag);
      return t && commentPaths.includes(resolveRelTarget(relsPath, t[1]));
    });
    if (!hasComments) continue;
    for (const tag of relTags) {
      if (!/Type="[^"]*\/vmlDrawing"/.test(tag)) continue;
      const t = /Target="([^"]+)"/.exec(tag);
      if (t) vmlPaths.add(resolveRelTarget(relsPath, t[1]));
    }
  }

  const removed = [...commentPaths, ...vmlPaths];
  for (const p of removed) out.delete(p);

  for (const relsPath of [...out.keys()].filter(p => p.endsWith('.rels'))) {
    let xml = strFromU8(out.get(relsPath));
    let changed = false;
    xml = xml.replace(/<Relationship\b[^>]*\/>/g, tag => {
      const targetMatch = /Target="([^"]+)"/.exec(tag);
      if (!targetMatch) return tag;
      const resolved = resolveRelTarget(relsPath, targetMatch[1]);
      if (removed.includes(resolved)) { changed = true; return ''; }
      return tag;
    });
    if (changed) out.set(relsPath, strToU8(xml));
  }

  const ctPath = '[Content_Types].xml';
  if (out.has(ctPath)) {
    const xml = strFromU8(out.get(ctPath)).replace(/<Override\b[^>]*\/>/g, tag => {
      const partName = /PartName="\/([^"]+)"/.exec(tag);
      return partName && removed.includes(partName[1]) ? '' : tag;
    });
    out.set(ctPath, strToU8(xml));
  }

  return out;
}
