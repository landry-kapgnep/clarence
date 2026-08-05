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
  // estPlausiblePourLeType) : une majuscule pour PER/ORG/LIEU, un chiffre pour
  // DATE_NAISSANCE. Ce test porte sur le mapping label→type, pas sur la forme.
  for (const [label, type] of cas) {
    const pipe = fakePipe({ Cib88: [{ label, len: 5, score: 0.9 }] });
    const [e] = await detectGliner('valeur Cib88 ici', pipe);
    assert.ok(e, `aucune entité pour le label ${label}`);
    assert.equal(e.type, type, `mauvais type pour ${label}`);
  }
});

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
  // Les 3 groupes actifs → 3 appels.
  passes = 0;
  await detectGliner('1988-03-14', pipe);
  assert.equal(passes, 3);

  // DATE_NAISSANCE désactivé → le groupe 2 n'est plus appelé du tout.
  passes = 0;
  const out = await detectGliner('1988-03-14', pipe, { disabledTypes: new Set(['DATE_NAISSANCE']) });
  assert.equal(passes, 2, 'la passe désactivée a quand même coûté une inférence');
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

test('progression : un tick par (fenêtre x groupe actif)', async () => {
  const pipe = async () => [];
  const ticks = [];
  await detectGliner('texte court', pipe, { onProgress: p => ticks.push(p) });
  assert.equal(ticks.length, 3, 'une fenêtre x 3 groupes');
  assert.deepEqual(ticks[2], { done: 3, total: 3 });
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
  assert.ok(identite.seuil <= 0.45, 'un nom de CV isolé sort à 0,47 : le seuil doit passer dessous');
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

// --- Seuil abaissé une seconde fois (0,45 → 0,38), trouvé sur un vrai
// rapport : « Amandine ROUSSEAU » ne dépassait 0,45 sur AUCUNE occurrence
// (0,364 / 0,398 mesurés), donc jamais proposé comme PER — la fuite ne
// venait pas de la fusion (merge.js gère déjà le cas ROUSSEAU/BIC) mais du
// modèle qui ne le franchissait jamais.
test('un nom réel sous l\'ancien seuil (0,45) mais au-dessus du nouveau (0,38) est masqué', async () => {
  const texte = 'Amandine ROUSSEAU, c\'est moi.';
  const pipe = async (t, labels) => labels.includes('person')
    ? [{ label: 'person', start: 0, end: 17, spanText: 'Amandine ROUSSEAU', score: 0.398 }]
    : [];
  const spans = await detectGliner(texte, pipe);
  assert.deepEqual(spans.map(e => e.value), ['Amandine ROUSSEAU']);
});

// --- Borne basse : sous 0,38, un titre en capitales devient un faux positif
// PER sur un vrai document (« CERTIFICAT DE SCOLARITE », 0,36 mesuré). Ce
// test fige le seuil comme point pivot, pas comme valeur arbitraire.
test('le seuil ne doit PAS descendre au point de masquer un titre en capitales', async () => {
  const identite = GROUPES.find(g => g.labels.includes('person'));
  assert.ok(identite.seuil > 0.36,
    'à 0,36 ou moins, « CERTIFICAT DE SCOLARITE » (titre) devient un faux positif PER mesuré au banc');
});
