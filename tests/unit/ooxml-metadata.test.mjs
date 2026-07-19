import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strToU8, strFromU8 } from 'fflate';
import { stripCoreProps, stripAppProps, stripCommentParts } from '../../src/files/ooxml-metadata.js';

const CORE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Jean Dupont</dc:creator>
  <cp:lastModifiedBy>Jean Dupont</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2024-03-01T10:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2024-03-05T18:30:00Z</dcterms:modified>
  <cp:revision>7</cp:revision>
</cp:coreProperties>`;

test('stripCoreProps vide auteur/dernier-modif-par, remet la révision à 1, neutralise les dates', () => {
  const out = stripCoreProps(CORE_XML);
  assert.equal(out.includes('Jean Dupont'), false);
  assert.match(out, /<dc:creator><\/dc:creator>/);
  assert.match(out, /<cp:lastModifiedBy><\/cp:lastModifiedBy>/);
  assert.match(out, /<cp:revision>1<\/cp:revision>/);
  assert.equal(out.includes('2024-03-01'), false);
  assert.equal(out.includes('2024-03-05'), false);
  // le format de date reste valide (attribut xsi:type conservé)
  assert.match(out, /<dcterms:created xsi:type="dcterms:W3CDTF">1970-01-01T00:00:00Z<\/dcterms:created>/);
});

const APP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Company>Acme Consulting SARL</Company>
  <Manager>Rose Fontaine</Manager>
  <Application>Microsoft Excel</Application>
</Properties>`;

test('stripAppProps vide société/manager, laisse le reste intact', () => {
  const out = stripAppProps(APP_XML);
  assert.equal(out.includes('Acme Consulting SARL'), false);
  assert.equal(out.includes('Rose Fontaine'), false);
  assert.ok(out.includes('Microsoft Excel'), 'les autres balises ne doivent pas être touchées');
  assert.match(out, /<Company><\/Company>/);
  assert.match(out, /<Manager><\/Manager>/);
});

function fakeZip(entries) {
  return new Map(Object.entries(entries).map(([k, v]) => [k, strToU8(v)]));
}

test('stripCommentParts retire la partie, sa relation, et son entrée content-types', () => {
  const zip = fakeZip({
    'xl/comments1.xml': '<comments>Une PII dans un commentaire</comments>',
    'xl/worksheets/_rels/sheet1.xml.rels':
      '<Relationships>' +
      '<Relationship Id="rId1" Type="drawing" Target="../drawings/drawing1.xml"/>' +
      '<Relationship Id="rId2" Type="comments" Target="../comments1.xml"/>' +
      '</Relationships>',
    '[Content_Types].xml':
      '<Types>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="sheet"/>' +
      '<Override PartName="/xl/comments1.xml" ContentType="comments"/>' +
      '</Types>'
  });

  const out = stripCommentParts(zip);

  assert.equal(out.has('xl/comments1.xml'), false);
  const rels = strFromU8(out.get('xl/worksheets/_rels/sheet1.xml.rels'));
  assert.equal(rels.includes('comments1.xml'), false);
  assert.ok(rels.includes('drawing1.xml'), 'la relation vers le dessin doit rester');
  const ct = strFromU8(out.get('[Content_Types].xml'));
  assert.equal(ct.includes('comments1.xml'), false);
  assert.ok(ct.includes('sheet1.xml'), 'l\'override de la feuille doit rester');
});

test('stripCommentParts retire aussi le dessin VML legacy associé (même .rels)', () => {
  const zip = fakeZip({
    'xl/comments1.xml': '<comments>note</comments>',
    'xl/drawings/vmlDrawing1.vml': '<xml>rendu de la bulle</xml>',
    'xl/worksheets/_rels/sheet1.xml.rels':
      '<Relationships>' +
      '<Relationship Id="rId1" Type=".../vmlDrawing" Target="../drawings/vmlDrawing1.vml"/>' +
      '<Relationship Id="rId2" Type=".../comments" Target="../comments1.xml"/>' +
      '</Relationships>'
  });
  const out = stripCommentParts(zip);
  assert.equal(out.has('xl/drawings/vmlDrawing1.vml'), false);
  assert.equal(strFromU8(out.get('xl/worksheets/_rels/sheet1.xml.rels')).includes('vmlDrawing1.vml'), false);
});

test('stripCommentParts ne touche pas un dessin VML sans commentaire associé', () => {
  const zip = fakeZip({
    'xl/drawings/vmlDrawing1.vml': '<xml>un contrôle de formulaire, rien à voir</xml>',
    'xl/worksheets/_rels/sheet1.xml.rels':
      '<Relationships><Relationship Id="rId1" Type=".../vmlDrawing" Target="../drawings/vmlDrawing1.vml"/></Relationships>',
    'xl/comments1.xml': '<comments>note sur une autre feuille</comments>',
    'xl/worksheets/_rels/sheet2.xml.rels':
      '<Relationships><Relationship Id="rId1" Type=".../comments" Target="../comments1.xml"/></Relationships>'
  });
  const out = stripCommentParts(zip);
  // le commentaire (feuille 2) est retiré, mais le VML de la feuille 1 (sans commentaire) reste
  assert.equal(out.has('xl/comments1.xml'), false);
  assert.equal(out.has('xl/drawings/vmlDrawing1.vml'), true);
});

test('stripCommentParts est un no-op si aucun commentaire présent', () => {
  const zip = fakeZip({ 'xl/worksheet1.xml': '<sheet/>' });
  const out = stripCommentParts(zip);
  assert.equal(strFromU8(out.get('xl/worksheet1.xml')), '<sheet/>');
});
