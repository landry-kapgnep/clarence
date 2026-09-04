import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectRegex } from '../../src/engine/regex-detect.js';
import { mergeEntities } from '../../src/engine/merge.js';
import { maskText } from '../../src/engine/masking.js';

const find = (text, type) => detectRegex(text).filter(e => e.type === type);
// Après fusion : dédoublonne les chevauchements (un motif nu + un motif
// contextuel peuvent matcher le même span → une seule entité au final).
const findMerged = (text, type) => mergeEntities(detectRegex(text), []).filter(e => e.type === type);

// --- IBAN : masqué sur structure même si le mod-97 échoue (priorité zéro-fuite).
test('IBAN valide : détecté et marqué validated=true', () => {
  const [e] = find('IBAN FR76 3000 6000 0112 3456 7890 189', 'IBAN');
  assert.ok(e);
  assert.equal(e.validated, true);
});

test('IBAN à structure correcte mais mod-97 invalide : détecté quand même (validated=false)', () => {
  // Numéros fabriqués (échouent le checksum) - doivent tout de même être masqués.
  for (const v of [
    'FR76 3000 6000 0123 4567 8901 234',
    'FR76 1007 1002 0001 2345 6789 099',
    'FR76 3000 4000 2000 1122 3344 556'
  ]) {
    const [e] = find(`Mon IBAN : ${v}`, 'IBAN');
    assert.ok(e, 'non détecté : ' + v);
    assert.equal(e.value, v);
    assert.equal(e.validated, false, 'checksum invalide attendu : ' + v);
  }
});

// --- NIR : idem, masqué sur structure.
test('NIR à structure correcte mais clé invalide : détecté quand même (validated=false)', () => {
  const [e] = find('Sécurité sociale 2 91 07 13 055 123 45', 'NIR');
  assert.ok(e);
  assert.equal(e.validated, false);
});

test('NIR valide : détecté et validated=true', () => {
  const [e] = find('NIR 1 85 05 78 006 084 91', 'NIR');
  assert.ok(e);
  assert.equal(e.validated, true);
});

// --- Carte NUE (sans libellé) : reste STRICTE (structure faible, Luhn
// indispensable anti-FP). Avec un libellé « Carte/Visa », voir le test contexte.
test('carte nue Luhn-invalide (aucun libellé) : jamais détectée', () => {
  assert.equal(find('Le nombre 4242 4242 4242 4243 ici', 'CARTE_BANCAIRE').length, 0);
});

test('carte Luhn-valide : toujours détectée (une seule après fusion)', () => {
  assert.equal(findMerged('Carte 4242 4242 4242 4242', 'CARTE_BANCAIRE').length, 1);
});

// --- Carte/SIREN avec contexte : masqués même si Luhn échoue.
test('carte Luhn-invalide MAIS précédée de « Visa: » : détectée (contexte)', () => {
  const [e] = find('Visa: 4970123456789012', 'CARTE_BANCAIRE');
  assert.ok(e);
  assert.equal(e.value, '4970123456789012');
});

test('SIREN Luhn-invalide MAIS précédé de « Siren: » : détecté (contexte)', () => {
  const [e] = find('Siren: 44322199800012', 'SIRET_SIREN');
  assert.ok(e);
  assert.equal(e.value, '44322199800012');
});

// --- MONTANT : point décimal international + virgule FR.
test('MONTANT accepte le point décimal (6540.00 EUR) sans laisser fuir les chiffres', () => {
  const [e] = find('Salaire net : 6540.00 EUR', 'MONTANT');
  assert.ok(e);
  assert.equal(e.value.trim(), '6540.00 EUR');
});

test('MONTANT garde la virgule FR et les milliers (1 240,50 €)', () => {
  const [e] = find("Litige : 1 240,50 €", 'MONTANT');
  assert.ok(e);
  assert.equal(e.value.trim(), '1 240,50 €');
});

// --- TELEPHONE : ne mange plus un fragment au milieu d'un long nombre.
test('le téléphone ne matche pas un fragment de 10 chiffres au milieu d\'une carte', () => {
  assert.equal(find('4970123456789012', 'TELEPHONE').length, 0);
});

// --- PSEUDO : handles de profil (fuite constatée sur un vrai CV, le nom en
// minuscules dans une URL n'étant jamais vu par le NER).
test('handle LinkedIn/GitHub détecté, domaine préservé', () => {
  const [li] = find('linkedin.com/in/landry-kapgnep', 'PSEUDO');
  assert.equal(li.value, 'landry-kapgnep');
  const [gh] = find('github.com/landry-kapgnep', 'PSEUDO');
  assert.equal(gh.value, 'landry-kapgnep');
});

test('URL complète avec https/www : le handle seul est capté', () => {
  const [e] = find('https://www.linkedin.com/in/marie-dupont-123', 'PSEUDO');
  assert.equal(e.value, 'marie-dupont-123');
});

test('un domaine sans handle ne déclenche rien', () => {
  assert.equal(find('on parle de github.com/ ici', 'PSEUDO').length, 0);
  assert.equal(find('le site github.com est connu', 'PSEUDO').length, 0);
});

test('le même handle sur deux plateformes reçoit un seul placeholder', () => {
  const text = 'linkedin.com/in/jdupont et github.com/jdupont';
  const { masked } = maskText(text, mergeEntities(detectRegex(text), []));
  assert.equal(masked, 'linkedin.com/in/[PSEUDO_1] et github.com/[PSEUDO_1]');
});

// ===== Motifs internationaux (constatés manquants sur un texte anglais réel :
// seul l'email était détecté). Approche « motif + mot-clé de contexte », celle
// de référence (catalogue Presidio, porté depuis Python).

test('date de naissance en anglais, tous formats', () => {
  assert.equal(find('born on March 14, 1988 in Ohio', 'DATE_NAISSANCE')[0].value, 'March 14, 1988');
  assert.equal(find('Date of birth: 1988-03-14', 'DATE_NAISSANCE')[0].value, '1988-03-14');
  assert.equal(find('DOB 14 March 1988', 'DATE_NAISSANCE')[0].value, '14 March 1988');
});

test('date de naissance en français toujours détectée (non-régression)', () => {
  assert.equal(find('née le 23/07/1991 à Marseille', 'DATE_NAISSANCE')[0].value, '23/07/1991');
  assert.equal(find('date de naissance : 14 mars 1988', 'DATE_NAISSANCE')[0].value, '14 mars 1988');
});

test('date sensible par libellé (expiration), mois+année seuls', () => {
  assert.equal(find('expiration date set for August 2028', 'DATE')[0].value, 'August 2028');
  assert.equal(find('valid until 12/2027', 'DATE')[0].value, '12/2027');
});

test('les dates SANS libellé sensible ne sont PAS masquées (sinon un CV devient illisible)', () => {
  // Dates d'emploi d'un CV : aucune raison de les masquer.
  assert.equal(find('Data Engineer Janv. - Mars 2026, puis Avr. 2026', 'DATE').length, 0);
  assert.equal(find('Réunion du 12/03/2026 à 14h', 'DATE').length, 0);
});

test('SSN américain détecté (format 3-2-4, sans checksum existant)', () => {
  assert.equal(find('recorded as 900-12-3456, payment', 'ID_NATIONAL')[0].value, '900-12-3456');
});

test('identifiant interne alphanumérique capté par son libellé', () => {
  assert.equal(find('account identifier CUST-849204-X to reflect', 'REFERENCE')[0].value, 'CUST-849204-X');
  assert.equal(find('Policy no: POL-2026-99A', 'REFERENCE')[0].value, 'POL-2026-99A');
});

test('code postal US via nom d\'état, et ZIP+4 seul', () => {
  assert.equal(find('Springfield, Oregon, 97477, United States', 'CODE_POSTAL_VILLE')[0].value, '97477');
  assert.equal(find('adresse 12345-6789 ici', 'CODE_POSTAL_VILLE')[0].value, '12345-6789');
  assert.equal(find('ZIP code: 97477', 'CODE_POSTAL_VILLE')[0].value, '97477');
});

test('4 derniers chiffres de carte captés par le libellé', () => {
  assert.equal(find('Visa card ending in 4242 with', 'CARTE_BANCAIRE')[0].value, '4242');
});

test('AUCUN nouveau faux positif sur les pièges connus', () => {
  // Les fixtures 1-3 sont le vrai garde-fou (suite complète) ; ici les cas
  // limites propres aux nouveaux motifs.
  assert.equal(find('La référence interne du poste: 483 921 657', 'REFERENCE').length, 0, 'libellé non collé à la valeur');
  assert.equal(find('Le point durera 45 minutes environ', 'DATE').length, 0);
  assert.equal(find('slides avant vendredi 17 h', 'DATE_NAISSANCE').length, 0);
  assert.equal(find('un nombre 123-45-6789 sans contexte', 'REFERENCE').length, 0);
});

// --- IBAN international (liste blanche de pays).
test('IBAN suisse à structure correcte : détecté même si mod-97 échoue', () => {
  const [e] = find('Coordonnées : CH76 0023 4000 W123 4567 8 (UBS)', 'IBAN');
  assert.ok(e);
  assert.equal(e.value, 'CH76 0023 4000 W123 4567 8');
});

test('IBAN belge valide (mod-97) détecté, forme sans espaces', () => {
  const [e] = find('IBAN BE71096123456769 pour le virement', 'IBAN');
  assert.ok(e);
  assert.equal(e.validated, true);
});

test('code pays inconnu : pas un IBAN (XX76… ignoré)', () => {
  assert.equal(find('Réf XX76 0023 4000 1234 5678 90', 'IBAN').length, 0);
});

// --- IP v4.
test('IP valide détectée, IP à octet impossible rejetée', () => {
  assert.equal(find('depuis 192.168.1.104 hier', 'IP').length, 1);
  assert.equal(find('depuis 999.168.1.104 hier', 'IP').length, 0);
});

// --- MAC.
test('adresse MAC détectée (les deux séparateurs)', () => {
  assert.equal(find('MAC: 00:1A:2B:3C:4D:5E', 'MAC').length, 1);
  assert.equal(find('MAC: 00-1a-2b-3c-4d-5e', 'MAC').length, 1);
});

test('un hexa isolé de 2 caractères n\'est pas une MAC', () => {
  assert.equal(find('code AB tout seul', 'MAC').length, 0);
});

// --- BIC. findMerged : le motif nu (liste blanche) et le motif contextuel
// (« BIC: ») peuvent matcher le même span - une seule entité après fusion.
test('BIC détecté (8 et 11 caractères), mot en majuscules rejeté', () => {
  assert.equal(findMerged('BIC: BNPAPRRPXXX', 'BIC').length, 1, 'pays hors liste mais libellé BIC explicite');
  assert.equal(findMerged('BIC: SOGEFRPP', 'BIC').length, 1);
  assert.equal(findMerged('virement via SOGEFRPP hier', 'BIC').length, 1, 'BIC nu à pays connu, sans libellé');
  assert.equal(findMerged('MOT PASSWORD ici', 'BIC').length, 0, 'PASSWORD ne doit pas matcher (pays "WO" inconnu, pas de libellé)');
});

// --- Identifiants étudiants FR (constatés sur un vrai certificat de scolarité).
test('INE et numéro étudiant captés par leur libellé', () => {
  assert.equal(find('Id. National : 080924167CD', 'ID_NATIONAL')[0].value, '080924167CD');
  assert.equal(find('N° Etudiant : 12201603', 'ID_NATIONAL')[0].value, '12201603');
  assert.equal(find('INE 1234567890A', 'ID_NATIONAL')[0].value, '1234567890A');
});

test('une suite de chiffres SANS libellé étudiant n\'est pas un identifiant', () => {
  assert.equal(find('le total atteint 12201603 unités', 'ID_NATIONAL').length, 0);
});

test('identifiant interne séparé de son libellé par un verbe (trouvé par le banc)', () => {
  // « His employee identifier IS EMP-4471-KD » : le motif exigeait que la
  // valeur suive immédiatement le libellé, donc il échouait sur une phrase
  // rédigée tout en marchant sur un libellé collé.
  assert.equal(find('His employee identifier is EMP-4471-KD and his card', 'REFERENCE')[0].value, 'EMP-4471-KD');
  // Non-régression : la forme collée marche toujours.
  assert.equal(find('account identifier CUST-849204-X to reflect', 'REFERENCE')[0].value, 'CUST-849204-X');
});

// --- Civilité + nom : le motif ne doit pas franchir une ligne VIDE.
// Trouvé par le banc (sur-masquage) : « Madame Hélène Brassard\n\nSOMMAIRE »
// produisait une seule entité PER incluant le titre de section, parce que le
// séparateur entre composants était `\s+` - qui traverse tout.
test('un nom capté par civilité s\'arrête à la ligne vide', () => {
  const t = 'Tuteur pédagogique : Madame Hélène Brassard\n\nSOMMAIRE\nIntroduction';
  const per = find(t, 'PER');
  assert.equal(per.length, 1);
  assert.equal(per[0].value, 'Hélène Brassard');
});

test('un nom coupé par un retour à la ligne SIMPLE reste recollé', () => {
  // Cas courant en texte au fil de l'eau : on ne veut pas perdre le patronyme
  // (ce serait une fuite), seule la ligne vide est un séparateur.
  const per = find('signé Monsieur Thibault\nNerval, directeur', 'PER');
  assert.equal(per[0].value, 'Thibault\nNerval');
});

// --- Identifiant interne annoncé par un libellé FRANÇAIS. Le motif était
// intégralement anglophone : « employee identifier is EMP-4471-KD » passait,
// « Réf. interne : EMP-4471-KD » fuyait. Trouvé par le document de test manuel.
test('identifiant interne à libellé français (fuite structurée)', () => {
  assert.equal(find('Réf. interne : EMP-4471-KD', 'REFERENCE')[0].value, 'EMP-4471-KD');
  assert.equal(find('Référence : CUST-849204-X', 'REFERENCE')[0].value, 'CUST-849204-X');
  assert.equal(find('Matricule EMP-0012 du service', 'REFERENCE')[0].value, 'EMP-0012');
  assert.equal(find('Identifiant unique : AB-1234-CD', 'REFERENCE')[0].value, 'AB-1234-CD');
  // Non-régression des libellés anglais.
  assert.equal(find('His employee identifier is EMP-4471-KD.', 'REFERENCE')[0].value, 'EMP-4471-KD');
});

test('un mot quelconque suivi d\'un code n\'est pas une référence', () => {
  assert.equal(find('le train TGV-INOUI-2024 part', 'REFERENCE').length, 0);
});

// --- Type de voie ABRÉGÉ et capitalisé. Le motif ne connaissait que « av. »
// en minuscules : « 99 Av. Jean Jaurès » n'était pas une adresse, et le modèle
// contextuel récupérait « Jean Jaurès » comme une PERSONNE - un nom de rue
// affiché comme un individu. Mesuré sur tous-defauts.pdf.
test('adresse : type de voie abrégé, avec ou sans majuscule', () => {
  assert.equal(find('99 Av. Jean Jaurès, 93430 Villetaneuse', 'ADRESSE')[0].value,
    '99 Av. Jean Jaurès');
  assert.equal(find('12 Rue des Cordeliers', 'ADRESSE')[0].value, '12 Rue des Cordeliers');
  assert.equal(find('8 Boulevard Voltaire', 'ADRESSE')[0].value, '8 Boulevard Voltaire');
  // Non-régression : la forme en minuscules marchait déjà.
  assert.equal(find('42 rue des Cordeliers', 'ADRESSE')[0].value, '42 rue des Cordeliers');
});

// ===== P5 - i18n de la couche déterministe (08/08/2026) =====================
// Les pages EN/ES/DE du document piégé l'ont montré : 100 % des fuites étaient
// dans cette couche, ZÉRO dans le contextuel. Le modèle se débrouille en
// espagnol et en allemand ; c'était notre regex franco-française qui était le
// trou. Ces tests figent la couverture ajoutée.

test('DNI et NIE espagnols détectés SANS libellé (clé de contrôle)', () => {
  assert.equal(find('DNI: 12345678Z', 'ID_NATIONAL').length, 1);
  assert.equal(find('NIE del cónyuge: X1234567L', 'ID_NATIONAL').length, 1);
});

test('une forme « 8 chiffres + lettre » à clé FAUSSE reste en clair', () => {
  // Validation stricte, pas maskIfStructureMatches : la forme est faible et un
  // code produit peut la prendre par accident. Même arbitrage que la carte
  // bancaire (Luhn strict) plutôt que l'IBAN ou le NIR.
  assert.equal(find('Référence 12345678A du catalogue', 'ID_NATIONAL').length, 0);
});

test('identifiants ES/DE annoncés par un libellé', () => {
  // Ni la sécurité sociale espagnole ni le Steuer-ID n'ont de clé qu'on sache
  // vérifier à peu de frais, et « 11 chiffres » nu est trop banal pour être
  // masqué sans contexte : le libellé est indispensable.
  assert.equal(find('Seguridad Social: 28 1234567840', 'ID_NATIONAL').length, 1);
  assert.equal(find('Steuer-ID: 12345678901', 'ID_NATIONAL').length, 1);
});

test('un code postal reste détecté quand un MOT s\'intercale avant la ville', () => {
  // « 28013 Madrid » passait déjà ; « 08001 para Barcelona » et « 20095 für
  // Hamburg » fuyaient. Le défaut valait aussi en français - la page
  // multilingue a révélé un bug franco-français.
  for (const t of ['Código postal 08001 para Barcelona', 'Postleitzahl 20095 für Hamburg',
                   'Le siège est au 75001 dans Paris', 'Calle Mayor 12, 28013 Madrid']) {
    assert.equal(find(t, 'CODE_POSTAL_VILLE').length, 1, t);
  }
});

test('un nombre suivi d\'un mot long n\'est pas pris pour un code postal', () => {
  // Le mot de liaison est borné à 5 lettres, sinon on relierait un nombre à
  // une ville trop lointaine.
  assert.equal(find('Il y a 20095 habitants recensés', 'CODE_POSTAL_VILLE').length, 0);
  assert.equal(find('10000 personnes vivent en France', 'CODE_POSTAL_VILLE').length, 0);
});

test('téléphone nord-américain au format national, sans libellé', () => {
  // findMerged et non find : « mobile 617-555-0143 » est vu par DEUX motifs
  // (la forme 3-3-4 nue et le motif à libellé). La fusion doit n'en laisser
  // qu'une - c'est justement ce qu'on vérifie ici.
  assert.equal(findMerged('Phone: (617) 555-0142', 'TELEPHONE').length, 1);
  assert.equal(findMerged('mobile 617-555-0143 disponible', 'TELEPHONE').length, 1);
});

test('téléphone national ES/DE via LIBELLÉ', () => {
  assert.equal(findMerged('fijo: 91 234 56 78', 'TELEPHONE').length, 1);
  assert.equal(findMerged('Festnetz: 030 1234567', 'TELEPHONE').length, 1);
});

test('le piège SIREN n\'est JAMAIS pris pour un téléphone', () => {
  // libphonenumber tourne sans pays par défaut pour cette raison précise :
  // avec `FR`, « 483 921 657 » passerait pour un numéro. Les motifs nationaux
  // ajoutés ici ne doivent pas réintroduire ce risque - d'où le libellé requis.
  assert.equal(find('Siren : 483 921 657', 'TELEPHONE').length, 0);
  assert.equal(find('Le numéro 483 921 657 figure au registre', 'TELEPHONE').length, 0);
});

test('un VERBE de liaison entre le libellé et l\'identifiant national', () => {
  // « Die Steuer-ID LAUTET 12345678901 » : le motif n'attrapait que les
  // libellés suivis de deux-points, donc il marchait sur une fiche et
  // échouait sur une phrase rédigée. Le défaut était déjà connu et corrigé
  // sur REFERENCE ; il n'avait pas été répliqué ici. Trouvé par le harnais
  // d'injection (npm run injection) à son premier passage.
  assert.equal(findMerged('Die Steuer-ID lautet 12345678901 laut Unterlagen.', 'ID_NATIONAL').length, 1);
  assert.equal(findMerged('The tax id is 123-45-6789 on file.', 'ID_NATIONAL').length, 1);
  // Le deux-points continue de marcher.
  assert.equal(findMerged('Steuer-ID: 12345678901', 'ID_NATIONAL').length, 1);
});

test('le mot de liaison n\'est jamais AVALÉ dans la valeur masquée', () => {
  // Le préfixe [A-Z]{0,2} du motif (pour « AB 123456 C ») capturait « is »
  // sous le drapeau `i` : la valeur devenait « is 123-45-6789 », et comme le
  // span le plus long gagne à la fusion, le mot « is » aurait disparu de la
  // phrase. Défaut ANTÉRIEUR, révélé en ajoutant les verbes de liaison.
  for (const e of findMerged('The tax id is 123-45-6789 on file.', 'ID_NATIONAL')) {
    assert.doesNotMatch(e.value, /\bis\b/, 'mot de liaison avalé : ' + e.value);
  }
});
