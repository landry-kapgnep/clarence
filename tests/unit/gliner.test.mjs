// Moteur GLiNER : contrat de sortie, groupes disjoints, seuil, chevauchements.
// Pipeline SIMULÉ (comme ner-chunk.test.mjs) — aucun modèle chargé ici.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectGliner, GROUPES, GLINER_THRESHOLD } from '../../src/engine/gliner.js';
import { mergeEntities } from '../../src/engine/merge.js';
import { maskText } from '../../src/engine/masking.js';

// Fabrique un pipeline simulé à partir d'une table { texteCherché: [spans] }.
// Reproduit le contrat réel : (text, labels) → spans filtrés sur ces labels.
const fakePipe = (reponses) => async (text, labels) => {
  const spans = [];
  for (const [aiguille, liste] of Object.entries(reponses)) {
    const i = text.indexOf(aiguille);
    if (i === -1) continue;
    for (const s of liste) {
      if (!labels.includes(s.label)) continue;
      spans.push({ ...s, start: i + (s.offset || 0), end: i + (s.offset || 0) + s.len,
        spanText: text.substr(i + (s.offset || 0), s.len) });
    }
  }
  return spans;
};

test('contrat de sortie identique à detectNER (types, offsets, source)', async () => {
  const pipe = fakePipe({ 'Julien Marchand': [{ label: 'person', len: 15, score: 0.96 }] });
  const [e] = await detectGliner('Bonjour Julien Marchand, merci.', pipe);
  assert.equal(e.type, 'PER');
  assert.equal(e.value, 'Julien Marchand');
  assert.equal(e.source, 'ner');
  assert.equal(e.validated, 'n/a');
  assert.equal('Bonjour Julien Marchand, merci.'.slice(e.start, e.end), 'Julien Marchand');
});

test('les labels des trois groupes sont mappés vers les bons types', async () => {
  const cas = [
    ['person', 'PER'], ['company', 'ORG'], ['location', 'LOC'],
    ['date of birth', 'DATE_NAISSANCE'], ['job title', 'POSTE'],
    ['nationality', 'NATIONALITE'], ['school', 'ETABLISSEMENT'],
    ['medical condition', 'SANTE']
  ];
  // La valeur factice doit être plausible pour TOUS les types testés (voir
  // estPlausiblePourLeType) : une majuscule pour PER/ORG/LIEU, et une vraie
  // FORME DE DATE pour DATE_NAISSANCE — « un chiffre » ne suffit plus depuis
  // que « ANNEXE 2 » et « 2021 » passaient pour des dates de naissance.
  // Ce test porte sur le mapping label→type, pas sur la forme.
  const factice = 'C1988-03-14';
  for (const [label, type] of cas) {
    const pipe = fakePipe({ [factice]: [{ label, len: factice.length, score: 0.9 }] });
    const [e] = await detectGliner(`valeur ${factice} ici`, pipe);
    assert.ok(e, `aucune entité pour le label ${label}`);
    assert.equal(e.type, type, `mauvais type pour ${label}`);
  }
});

// --- Forme d'une DATE DE NAISSANCE. « Contient un chiffre » laissait passer
// « ANNEXE 2 », « 2021 » et « 12 mars » sur tous-defauts.pdf — du sur-masquage
// qui abîme le texte sans rien protéger.
//
// Le contrôle est STRUCTUREL et sans liste de mois : le projet doit rester
// multilingue, or les noms de mois sont propres à une langue.
for (const [valeur, garde] of [
  ['1988-03-14', true],        // date numérique nue (cas phare du zero-shot)
  ['13/10/1976', true],
  ['March 14, 1988', true],    // année + quantième, séparés par de l'anglais
  ['16 octobre 2004', true],   // idem en français
  ['14. März 1988', true],     // idem en allemand : aucune liste n'est requise
  ['2021', false],             // année SEULE : pas une date de naissance
  ['ANNEXE 2', false],         // un titre de section numéroté
  ['12 mars', false]           // jour et mois sans année
]) {
  test(`date de naissance : ${JSON.stringify(valeur)} ${garde ? 'reste' : 'est écartée'}`, async () => {
    const pipe = fakePipe({ [valeur]: [{ label: 'date of birth', len: valeur.length, score: 0.9 }] });
    const spans = await detectGliner(`Mention ${valeur} ici`, pipe);
    assert.equal(spans.length, garde ? 1 : 0);
  });
}

test('chaque label déclaré possède un type — aucun placeholder [undefined_N] possible', () => {
  for (const g of GROUPES) {
    for (const label of g.labels) {
      assert.ok(g.types[label], `label sans type : ${label}`);
    }
  }
});

test('les groupes sont DISJOINTS (la dilution mesurée en dépend)', () => {
  const vus = new Set();
  for (const g of GROUPES) {
    for (const label of g.labels) {
      assert.ok(!vus.has(label), `label présent dans deux groupes : ${label}`);
      vus.add(label);
    }
  }
});

test('un span sous le seuil est écarté, au-dessus il est gardé', async () => {
  // Seuil EFFECTIF du groupe qui porte ce label (il peut surcharger le défaut).
  const seuil = GROUPES.find(g => g.labels.includes('company')).seuil ?? GLINER_THRESHOLD;

  const sous = fakePipe({ Krendalyx: [{ label: 'company', len: 9, score: seuil - 0.01 }] });
  assert.equal((await detectGliner('Stage chez Krendalyx hier', sous)).length, 0);

  const dessus = fakePipe({ Krendalyx: [{ label: 'company', len: 9, score: seuil }] });
  assert.equal((await detectGliner('Stage chez Krendalyx hier', dessus)).length, 1);
});

test('un label inconnu du groupe est ignoré (jamais d\'entité sans type)', async () => {
  const pipe = async () => [{ label: 'inventé', start: 0, end: 5, spanText: 'Bonjo', score: 0.99 }];
  assert.deepEqual(await detectGliner('Bonjour tout le monde', pipe), []);
});

test('valeur ISOLÉE sans contexte : le cas que le pipeline figé ne sait pas traiter', async () => {
  // Cellule de tableau nue — mesuré à 0,59 sur le vrai modèle.
  const pipe = fakePipe({ '1988-03-14': [{ label: 'date of birth', len: 10, score: 0.59 }] });
  const [e] = await detectGliner('1988-03-14', pipe);
  assert.equal(e.type, 'DATE_NAISSANCE');
  assert.equal(e.value, '1988-03-14');
});

test('un type désactivé fait SAUTER la passe entière (pas juste un filtre aval)', async () => {
  let passes = 0;
  const pipe = async (text, labels) => {
    passes++;
    return labels.includes('date of birth')
      ? [{ label: 'date of birth', start: 0, end: 10, spanText: '1988-03-14', score: 0.9 }]
      : [];
  };
  // « 1988-03-14 » n'a AUCUNE majuscule : le groupe identité est sauté par son
  // pré-filtre `pertinent` (il ne pourrait produire aucun nom propre). Restent
  // le groupe date et le groupe sensible → 2 appels.
  passes = 0;
  await detectGliner('1988-03-14', pipe);
  assert.equal(passes, 2);

  // DATE_NAISSANCE désactivé → le groupe date n'est plus appelé du tout.
  passes = 0;
  const out = await detectGliner('1988-03-14', pipe, { disabledTypes: new Set(['DATE_NAISSANCE']) });
  assert.equal(passes, 1, 'la passe désactivée a quand même coûté une inférence');
  assert.equal(out.length, 0);
});

test('tous les types désactivés : aucune inférence du tout', async () => {
  let appels = 0;
  const pipe = async () => { appels++; return []; };
  const tous = new Set(GROUPES.flatMap(g => Object.values(g.types)));
  assert.deepEqual(await detectGliner('un texte', pipe, { disabledTypes: tous }), []);
  assert.equal(appels, 0);
});

test('chevauchement entre deux groupes : le span le plus long gagne', async () => {
  // « Université de Bordeaux » vu à la fois comme ETABLISSEMENT (span complet)
  // et comme ORG (« Bordeaux » seul) : on garde le plus complet.
  const texte = "Diplômé de Université de Bordeaux en 2019.";
  const pipe = async (text, labels) => {
    if (labels.includes('school')) {
      return [{ label: 'school', start: 11, end: 33, spanText: text.slice(11, 33), score: 0.6 }];
    }
    if (labels.includes('company')) {
      return [{ label: 'location', start: 25, end: 33, spanText: text.slice(25, 33), score: 0.95 }];
    }
    return [];
  };
  const out = await detectGliner(texte, pipe);
  assert.equal(out.length, 1);
  assert.equal(out[0].type, 'ETABLISSEMENT');
  assert.equal(out[0].value, 'Université de Bordeaux');
});

test('offsets globaux corrects au-delà de la première fenêtre', async () => {
  const filler = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(40);
  const texte = filler + 'Le contact est Jean Dupont, merci.';
  const pipe = fakePipe({ 'Jean Dupont': [{ label: 'person', len: 11, score: 0.9 }] });
  const out = await detectGliner(texte, pipe);
  assert.ok(out.length >= 1);
  assert.equal(texte.slice(out[0].start, out[0].end), 'Jean Dupont');
});

test('recalage sur frontières de mot : un span à cheval ne laisse pas fuir le reste', async () => {
  // Défaut réel de la lib avant patch du découpeur : « Associ » au lieu de
  // « Associés ». Le recalage partagé avec ner.js doit rattraper.
  const texte = 'Le cabinet Fontaine & Associés relira.';
  const pipe = fakePipe({ 'Fontaine & Associ': [{ label: 'company', len: 17, score: 0.9 }] });
  const [e] = await detectGliner(texte, pipe);
  assert.equal(e.value, 'Fontaine & Associés');
});

test('l\'aval est inchangé : merge + masquage cohérent fonctionnent tels quels', async () => {
  const texte = 'Julien Marchand travaille chez Krendalyx. Julien Marchand signe.';
  const pipe = fakePipe({
    'Julien Marchand': [{ label: 'person', len: 15, score: 0.96 }],
    Krendalyx: [{ label: 'company', len: 9, score: 0.83 }]
  });
  const ents = mergeEntities([], await detectGliner(texte, pipe));
  const { masked, mapping } = maskText(texte, ents);
  assert.equal(masked, '[PERSONNE_1] travaille chez [ENTREPRISE_1]. [PERSONNE_1] signe.');
  assert.equal(mapping.length, 2);
});

test('progression : un tick par passe RÉELLEMENT exécutée', async () => {
  const pipe = async () => [];
  // « Texte court 2024 » : une majuscule ET un chiffre, donc les 3 groupes
  // passent leur pré-filtre.
  const ticks = [];
  await detectGliner('Texte court 2024', pipe, { onProgress: p => ticks.push(p) });
  assert.equal(ticks.length, 3, 'une fenêtre x 3 groupes');
  assert.deepEqual(ticks[2], { done: 3, total: 3 });
});

test('progression : le total EXCLUT les passes sautées par le pré-filtre', async () => {
  // Sans ce calcul exact, `total` compterait chunks × groupes et la barre
  // n'atteindrait jamais 100 % — défaut introduit par le pré-filtre lui-même.
  const ticks = [];
  await detectGliner('texte sans majuscule ni chiffre', async () => [], { onProgress: p => ticks.push(p) });
  assert.ok(ticks.length > 0, 'au moins une passe doit tourner');
  const dernier = ticks[ticks.length - 1];
  assert.equal(dernier.done, dernier.total, 'la progression doit finir à 100 %');
});

test('pré-filtre : une passe dont le résultat serait DE TOUTE FAÇON jeté est sautée', async () => {
  // `estPlausiblePourLeType` écarte déjà les PER/ORG/LIEU sans majuscule. Si le
  // texte entier n'en a aucune, la passe ne peut rien produire qui survive :
  // on la saute. Zéro perte par construction.
  const vus = [];
  await detectGliner('aucune majuscule ici', async (t, labels) => { vus.push(labels); return []; });
  assert.ok(!vus.some(l => l.includes('person')), 'le groupe identité aurait dû être sauté');

  const vus2 = [];
  await detectGliner('Avec Une Majuscule', async (t, labels) => { vus2.push(labels); return []; });
  assert.ok(vus2.some(l => l.includes('person')), 'avec une majuscule, le groupe identité doit tourner');
  assert.ok(!vus2.some(l => l.includes('date of birth')), 'sans chiffre, le groupe date doit être sauté');
});

test('pipeline absent : aucune entité, aucune exception (repli silencieux)', async () => {
  assert.deepEqual(await detectGliner('Julien Marchand', null), []);
});

// --- Seuil par groupe + pontage des noms en deux morceaux.
// Régression réelle : sur un vrai CV, « LANDRY KAPGNEP » (titre du document,
// seul sur sa ligne) sortait en DEUX spans à 0,47 et 0,36. Avec un seuil
// unique à 0,50 le nom fuyait entièrement ; sans pontage, seul le prénom
// aurait été masqué et le patronyme serait resté en clair à côté.

test('le groupe identité a un seuil PROPRE, plus bas que le défaut', () => {
  const identite = GROUPES.find(g => g.labels.includes('person'));
  assert.ok(identite.seuil < GLINER_THRESHOLD, 'le groupe identité doit surcharger le seuil');
  // Borne HAUTE, re-mesurée sur les poids fp16 le 06/08/2026 : le titre de CV
  // isolé « LANDRY KAPGNEP » sort à 0,494 (contre 0,47 + 0,36 en int8 — le fp16
  // relève le score ET fusionne les deux spans en un seul). C'est la plus basse
  // vraie valeur du corpus : le seuil doit rester dessous, sinon le nom fuit.
  assert.ok(identite.seuil < 0.494,
    'un nom de CV isolé sort à 0,494 en fp16 : le seuil doit passer dessous');
});

test('un nom de CV isolé à 0,47 est masqué ENTIÈREMENT (seuil + pontage)', async () => {
  const texte = 'LANDRY KAPGNEP';
  // Scores réels mesurés sur le vrai modèle pour cette entrée exacte.
  const pipe = async (t, labels) => labels.includes('person')
    ? [{ label: 'person', start: 0, end: 6, spanText: 'LANDRY', score: 0.47 },
       { label: 'person', start: 7, end: 14, spanText: 'KAPGNEP', score: 0.36 }]
    : [];
  const out = await detectGliner(texte, pipe);
  assert.equal(out.length, 1, 'le nom doit former UNE entité');
  assert.equal(out[0].value, 'LANDRY KAPGNEP', 'le patronyme ne doit pas rester en clair');
  const { masked } = maskText(texte, out);
  assert.equal(masked, '[PERSONNE_1]');
});

// Revers du pontage ci-dessus : il absorbait AUSSI les sigles suivis d'un
// identifiant. « Nadia Belkacem EMP-0012 » produisait le patronyme fantôme
// « Belkacem EMP » (mesuré sur tous-defauts.pdf), qui masque un bout du
// matricule ET affiche un nom qui n'existe pas.
test('le pontage n\'absorbe PAS un sigle suivi d\'un identifiant', async () => {
  const texte = 'Nadia Belkacem EMP-0012 est en poste.';
  const pipe = async (t, labels) => labels.includes('person')
    ? [{ label: 'person', start: 0, end: 14, spanText: 'Nadia Belkacem', score: 0.95 }]
    : [];
  const [e] = await detectGliner(texte, pipe);
  assert.equal(e.value, 'Nadia Belkacem', 'le matricule ne fait pas partie du nom');
});

test('le pontage marche TOUJOURS sur un vrai patronyme en capitales', async () => {
  // Garde-fou du correctif précédent : il ne doit pas avoir tué le cas réel.
  const texte = 'Amandine ROUSSEAU, chargée du dossier.';
  const pipe = async (t, labels) => labels.includes('person')
    ? [{ label: 'person', start: 0, end: 8, spanText: 'Amandine', score: 0.9 }]
    : [];
  const [e] = await detectGliner(texte, pipe);
  assert.equal(e.value, 'Amandine ROUSSEAU');
});

test('les groupes sans seuil propre gardent le défaut', async () => {
  const pipe = async (t, labels) => labels.includes('date of birth')
    ? [{ label: 'date of birth', start: 0, end: 10, spanText: '1988-03-14', score: 0.47 }]
    : [];
  // 0,47 passerait le seuil du groupe identité, mais PAS celui du groupe date.
  assert.equal((await detectGliner('1988-03-14', pipe)).length, 0);
});

// --- P6 : le label zero-shot « person » désigne toute expression RÉFÉRANT à
// une personne (« vendor », « candidate », « le protagoniste »), pas seulement
// un nom. Mesuré sur un vrai formulaire de consentement : 797 placeholders sur
// un document quasi vierge de données. PERSONNE/ENTREPRISE/LIEU étant par
// définition des noms PROPRES, un span sans la moindre majuscule est écarté.
test('un nom commun en minuscules n\'est pas une PERSONNE/ENTREPRISE/LIEU', async () => {
  const texte = 'Le protagoniste et ses compagnons quittent le vendor.';
  const spans = await detectGliner(texte, fakePipe({
    protagoniste: [{ label: 'person', len: 12, score: 0.9 }],
    compagnons: [{ label: 'person', len: 10, score: 0.9 }],
    vendor: [{ label: 'company', len: 6, score: 0.9 }]
  }));
  assert.deepEqual(spans, [], 'des noms communs en minuscules ne doivent pas être masqués');
});

test('un vrai nom propre passe toujours, y compris TOUT-MAJUSCULE', async () => {
  const texte = 'Encadré par Sébastien Vaquier chez KORRIGANE à Nantes.';
  const spans = await detectGliner(texte, fakePipe({
    'Sébastien Vaquier': [{ label: 'person', len: 17, score: 0.9 }],
    KORRIGANE: [{ label: 'company', len: 9, score: 0.9 }],
    Nantes: [{ label: 'location', len: 6, score: 0.9 }]
  }));
  assert.deepEqual(spans.map(e => e.value), ['Sébastien Vaquier', 'KORRIGANE', 'Nantes']);
});

test('le filtre ne s\'applique PAS aux types qui sont des noms communs par nature', async () => {
  // « développeur », « diabète », « française » sont légitimement en minuscules :
  // les filtrer comme des noms propres les ferait tous fuir.
  const texte = 'Poste : développeur. Origine : française.';
  const spans = await detectGliner(texte, fakePipe({
    'développeur': [{ label: 'job title', len: 11, score: 0.9 }],
    'française': [{ label: 'nationality', len: 9, score: 0.9 }]
  }));
  assert.deepEqual(spans.map(e => e.type).sort(), ['NATIONALITE', 'POSTE']);
});

test('une date de naissance sans le moindre chiffre est écartée', async () => {
  // Le modèle sortait « trimestre » en date de naissance à 0,74 sur un compte
  // rendu RH. Une date porte toujours au moins l'année.
  const spans = await detectGliner('avant la fin du trimestre prochain', fakePipe({
    trimestre: [{ label: 'date of birth', len: 9, score: 0.9 }]
  }));
  assert.deepEqual(spans, []);
});

test('une vraie date nue reste détectée', async () => {
  const spans = await detectGliner('1988-03-14', fakePipe({
    '1988-03-14': [{ label: 'date of birth', len: 10, score: 0.59 }]
  }));
  assert.deepEqual(spans.map(e => [e.type, e.value]), [['DATE_NAISSANCE', '1988-03-14']]);
});

// --- « Amandine ROUSSEAU » (rapport-fr.txt) : le cas qui avait fait descendre
// le seuil à 0,38 en int8, où il ne sortait qu'à 0,364 / 0,398 — jamais
// proposé comme PER, donc fuite (et non un défaut de fusion : merge.js gère
// déjà le cas où « ROUSSEAU » matche le motif BIC).
//
// Re-mesuré en fp16 : **0,998**. Le nom a quitté la zone de bordure, ce qui
// est précisément ce qui autorise le seuil à remonter à 0,46 sans le reperdre.
// On garde le score RÉEL plutôt qu'une valeur commode : le test doit dire ce
// que le modèle livré fait, pas ce qui arrangerait l'assertion.
test('un nom réel qu\'un seuil trop haut avait déjà fait fuir est masqué', async () => {
  const texte = 'Amandine ROUSSEAU, c\'est moi.';
  const pipe = async (t, labels) => labels.includes('person')
    ? [{ label: 'person', start: 0, end: 17, spanText: 'Amandine ROUSSEAU', score: 0.998 }]
    : [];
  const spans = await detectGliner(texte, pipe);
  assert.deepEqual(spans.map(e => e.value), ['Amandine ROUSSEAU']);
});

// --- Borne BASSE, re-mesurée en fp16 : « CERTIFICAT DE SCOLARITE » (titre en
// capitales de certificat-fr.txt) sort à 0,469 en ORG quand on le soumet SEUL,
// contre 0,36 en PER sous int8. En contexte réel il reste sous le seuil — le
// banc donne 100 % de termes préservés sur ce document à 0,46.
//
// La marge est donc MINCE (0,469 isolé contre un seuil à 0,46) : ce test fige
// la borne basse pour qu'une future baisse de seuil ne se fasse pas sans
// revenir sur CE cas précis.
test('le seuil ne doit PAS descendre au point de masquer un titre en capitales', async () => {
  const identite = GROUPES.find(g => g.labels.includes('person'));
  assert.ok(identite.seuil > 0.42,
    'sous 0,42, « CERTIFICAT DE SCOLARITE » et « SOMMAIRE » deviennent des faux positifs mesurés au banc (préservé 98 % → 93 %)');
});
