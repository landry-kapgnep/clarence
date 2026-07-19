// Génère tests/fixtures/echantillon.xlsx — reproductible, review-able, pas un
// blob opaque. Contient : 2 feuilles, cellules PII, une plage fusionnée, une
// cellule montant/devise formatée (jamais du texte), un commentaire, et des
// docProps seedées avec un faux auteur/société (à nettoyer par les tests).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as XLSX from 'xlsx';

const here = dirname(fileURLToPath(import.meta.url));

const wb = XLSX.utils.book_new();

const ws1 = XLSX.utils.aoa_to_sheet([
  ['Nom', 'Email', 'Montant'],
  ['Julien Marchand', 'julien.marchand@monentreprise.fr', null],
  ['Rose Fontaine', 'rose.fontaine@example.com', null]
]);
ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]; // fusion A1:B1 (en-tête)
ws1['C2'] = { t: 'n', v: 1234.56, z: '#,##0.00 €' }; // montant formaté, jamais du texte
ws1['A2'].c = [{ a: 'Jean Dupont', t: 'Vérifier ce client avant renouvellement' }]; // commentaire
XLSX.utils.book_append_sheet(wb, ws1, 'Clients');

const ws2 = XLSX.utils.aoa_to_sheet([
  ['Référence', 'IBAN'],
  ['DOSSIER-1', 'FR76 3000 6000 0112 3456 7890 189']
]);
XLSX.utils.book_append_sheet(wb, ws2, 'Paiements');

wb.Props = {
  Author: 'Jean Dupont',
  Company: 'Acme Consulting SARL',
  LastAuthor: 'Jean Dupont'
};

const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
writeFileSync(join(here, 'echantillon.xlsx'), Buffer.from(buf));
console.log('echantillon.xlsx généré.');
