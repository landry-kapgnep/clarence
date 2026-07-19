// Génère tests/fixtures/echantillon.docx — XML OOXML écrit à la main +
// zippé avec fflate (reproductible, review-able, sans avoir Word installé).
//
// Contient, délibérément :
// - un nom coupé sur 2 runs de mise en forme différente ("Jean " non gras,
//   "Dupont" gras) — le cas dur du run-splitting ;
// - une IBAN dans une cellule de tableau ;
// - un <w:del> (suivi des modifications) avec un faux ancien nom, qui ne
//   doit survivre nulle part après nettoyage ;
// - un commentaire (word/comments.xml + ancres dans document.xml) ;
// - des docProps seedées avec un faux auteur/société.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { zipSync, strToU8 } from 'fflate';

const here = dirname(fileURLToPath(import.meta.url));

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:commentRangeStart w:id="0"/>
      <w:r><w:t xml:space="preserve">Bonjour, je m'appelle </w:t></w:r>
      <w:r><w:rPr><w:b w:val="false"/></w:rPr><w:t xml:space="preserve">Jean </w:t></w:r>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Dupont</w:t></w:r>
      <w:commentRangeEnd w:id="0"/>
      <w:r><w:commentReference w:id="0"/></w:r>
      <w:r><w:t xml:space="preserve">, contactez-moi.</w:t></w:r>
    </w:p>
    <w:p>
      <w:del w:id="1" w:author="Ancien Auteur" w:date="2020-01-01T00:00:00Z">
        <w:r><w:delText>Ancien nom : Paul Ancien</w:delText></w:r>
      </w:del>
    </w:p>
    <w:tbl>
      <w:tr>
        <w:tc>
          <w:p><w:r><w:t>IBAN : FR76 3000 6000 0112 3456 7890 189</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

const commentsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:comment w:id="0" w:author="Rose Relectrice" w:date="2024-01-01T00:00:00Z">
    <w:p><w:r><w:t>Vérifier ce nom avant envoi</w:t></w:r></w:p>
  </w:comment>
</w:comments>`;

const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults/></w:styles>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Jean Dupont</dc:creator>
  <cp:lastModifiedBy>Jean Dupont</cp:lastModifiedBy>
  <cp:revision>3</cp:revision>
  <dcterms:created xsi:type="dcterms:W3CDTF">2024-01-01T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2024-01-02T00:00:00Z</dcterms:modified>
</cp:coreProperties>`;

const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Company>Acme Consulting SARL</Company>
  <Manager>Rose Manager</Manager>
</Properties>`;

const files = {
  '[Content_Types].xml': strToU8(contentTypesXml),
  '_rels/.rels': strToU8(rootRelsXml),
  'word/document.xml': strToU8(documentXml),
  'word/comments.xml': strToU8(commentsXml),
  'word/styles.xml': strToU8(stylesXml),
  'word/_rels/document.xml.rels': strToU8(documentRelsXml),
  'docProps/core.xml': strToU8(coreXml),
  'docProps/app.xml': strToU8(appXml)
};

writeFileSync(join(here, 'echantillon.docx'), zipSync(files));
console.log('echantillon.docx généré.');
