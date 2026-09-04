// Le découpage NER protège contre la troncature silencieuse à 512 tokens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkText, detectNER, CHUNK_SIZE, CHUNK_OVERLAP } from '../../src/engine/ner.js';

test('texte court : une seule fenêtre, offset 0', () => {
  const chunks = chunkText('Bonjour Jean.');
  assert.deepEqual(chunks, [{ offset: 0, text: 'Bonjour Jean.' }]);
});

test('texte long : couverture totale, fenêtres bornées, recouvrement présent', () => {
  const text = ('Phrase de test numéro X. ').repeat(300); // ~7500 caractères
  const chunks = chunkText(text);
  assert.ok(chunks.length > 1);
  // chaque fenêtre respecte la taille max
  for (const c of chunks) assert.ok(c.text.length <= CHUNK_SIZE);
  // couverture : chaque fenêtre commence avant la fin de la précédente (recouvrement)
  for (let i = 1; i < chunks.length; i++) {
    const prevEnd = chunks[i - 1].offset + chunks[i - 1].text.length;
    assert.ok(chunks[i].offset < prevEnd, 'trou entre fenêtres');
  }
  // la dernière fenêtre atteint la fin du texte
  const last = chunks[chunks.length - 1];
  assert.equal(last.offset + last.text.length, text.length);
});

test('detectNER trouve une entité située au-delà de la 1re fenêtre (offsets globaux)', async () => {
  const filler = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(40); // ~2300 chars
  const text = filler + 'Le contact est Jean Dupont, merci.';
  // Faux pipeline : "détecte" Jean Dupont si présent dans la fenêtre reçue.
  const fakePipe = async chunk => chunk.includes('Jean Dupont')
    ? [
        { entity: 'B-PER', word: 'Jean', score: 0.99 },
        { entity: 'I-PER', word: 'Du', score: 0.98 },
        { entity: 'I-PER', word: '##pont', score: 0.97 }
      ]
    : [];
  const out = await detectNER(text, fakePipe);
  assert.equal(out.length, 1);
  assert.equal(out[0].value, 'Jean Dupont');
  assert.equal(text.slice(out[0].start, out[0].end), 'Jean Dupont');
});

test('une entité sous le seuil de confiance est écartée (bruit du boost de casse)', async () => {
  // Le pipeline réel ne renvoie déjà que les tokens taggés (jamais 'O').
  const fakePipe = async () => [
    { entity: 'B-PER', word: 'Jean', score: 0.99 },
    { entity: 'I-PER', word: 'Dupont', score: 0.98 },
    { entity: 'B-PER', word: 'Ha', score: 0.52 }
  ];
  const out = await detectNER('Jean Dupont et habite ici', fakePipe);
  assert.deepEqual(out.map(e => e.value), ['Jean Dupont']);
});

test('la passe boostée comble un trou même si la passe naturelle a du bruit au même endroit', async () => {
  // Sur du texte tout minuscule, la passe naturelle peut renvoyer un fragment
  // bruité et peu sûr à la même position que la vraie entité (typique : un nom
  // scindé en sous-mots avec un score très faible). Il ne doit jamais bloquer
  // la détection solide de la passe boostée puis disparaître lui-même au
  // filtre, en laissant la position sans aucune entité.
  const fakePipe = async chunk => {
    if (chunk.includes('Jean Dupont')) {
      return [
        { entity: 'B-PER', word: 'Jean', score: 0.99 },
        { entity: 'I-PER', word: 'Dupont', score: 0.97 }
      ];
    }
    if (chunk.includes('jean dupont')) {
      return [
        { entity: 'B-PER', word: 'du', score: 0.55 },
        { entity: 'I-PER', word: '##pont', score: 0.45 }
      ];
    }
    return [];
  };
  const out = await detectNER('contact : jean dupont ici', fakePipe);
  assert.deepEqual(out.map(e => e.value), ['jean dupont']);
});

test('les noms de famille à trait d\'union sont étendus au-delà du tiret (rattrapage du NER cased)', async () => {
  // Le modèle cased s'arrête souvent à "Amandine ROUSSEAU" et laisse fuir
  // "-LEFEBVRE" ; l'extension déterministe doit récupérer la partie manquante.
  const fakePipe = async chunk => chunk.includes('Amandine')
    ? [{ entity: 'B-PER', word: 'Amandine', score: 0.99 }, { entity: 'I-PER', word: 'ROUSSEAU', score: 0.98 }]
    : [];
  const out = await detectNER('Mme Amandine ROUSSEAU-LEFEBVRE arrive.', fakePipe);
  assert.equal(out.length, 1);
  assert.equal(out[0].value, 'Amandine ROUSSEAU-LEFEBVRE');
});

test('un fragment PER tronqué en plein mot est recalé au début du mot (pas de « A[PERSONNE] »)', async () => {
  // Simule la reconstruction WordPiece qui démarre au milieu ("mandine" pour
  // "Amandine") - le recalage doit récupérer le "A" initial.
  const fakePipe = async () => [{ entity: 'B-PER', word: 'mandine', score: 0.9 }];
  const out = await detectNER('Mme Amandine arrive.', fakePipe);
  assert.equal(out[0].value, 'Amandine');
});

test('extension à trait d\'union : chaîne multiple et arrêt propre avant un non-nom', async () => {
  const fakePipe = async chunk => chunk.includes('Anne')
    ? [{ entity: 'B-PER', word: 'Anne', score: 0.99 }]
    : [];
  const out = await detectNER('Anne-Sophie-Marie, 33 ans.', fakePipe);
  assert.equal(out[0].value, 'Anne-Sophie-Marie');
});

test('pontage nobiliaire vers l\'avant : "Marc-Antoine" + " De La Rochefoucauld"', async () => {
  // Le NER n'attrape que "Antoine" ; word-snap → "Marc-Antoine" ; pontage
  // particules → nom complet.
  const fakePipe = async () => [{ entity: 'B-PER', word: 'Antoine', score: 0.9 }];
  const out = await detectNER('Le client Marc-Antoine De La Rochefoucauld arrive.', fakePipe);
  assert.ok(out.some(e => e.type === 'PER' && e.value === 'Marc-Antoine De La Rochefoucauld'));
});

test('pontage patronyme MAJUSCULES : "Amandine" + " ROUSSEAU-LEFEBVRE"', async () => {
  const fakePipe = async () => [{ entity: 'B-PER', word: 'Amandine', score: 0.9 }];
  const out = await detectNER('Mme Amandine ROUSSEAU-LEFEBVRE, RH.', fakePipe);
  assert.ok(out.some(e => e.type === 'PER' && e.value === 'Amandine ROUSSEAU-LEFEBVRE'));
});

test('pontage arrière : un LIEU précédé de "Prénom + particules" devient un PER complet', async () => {
  // Cas "Sébastien De La Villardière" : le NER ne voit que "Villardière" (LIEU).
  const fakePipe = async () => [{ entity: 'B-LOC', word: 'Villardière', score: 0.9 }];
  const out = await detectNER('Sébastien De La Villardière signe.', fakePipe);
  const e = out.find(x => x.value.includes('Villardière'));
  assert.equal(e.type, 'PER');
  assert.equal(e.value, 'Sébastien De La Villardière');
});

test('pas de pontage arrière sur un vrai lieu sans prénom capitalisé ("rentre de La Rochelle")', async () => {
  const fakePipe = async () => [{ entity: 'B-LOC', word: 'Rochelle', score: 0.9 }];
  const out = await detectNER('Il rentre de La Rochelle demain.', fakePipe);
  const e = out.find(x => x.value.includes('Rochelle'));
  assert.equal(e.type, 'LOC');
  assert.equal(e.value, 'Rochelle');
});

test('sur un chevauchement entre les deux passes, le span le plus long gagne (pas la passe naturelle par défaut)', async () => {
  // Cas réel observé : "jean lefevbre" (orthographe inhabituelle). La passe
  // naturelle ne capture qu'un fragment tronqué mais confiant ("lefev" à
  // 92%) ; la passe boostée reconstruit le nom complet à 99%. Le fragment
  // tronqué ne doit jamais l'emporter juste parce qu'il vient de la passe
  // naturelle.
  const fakePipe = async chunk => {
    if (chunk === 'Jean Lefevbre') {
      return [
        { entity: 'B-PER', word: 'Jean', score: 0.99 },
        { entity: 'I-PER', word: 'Le', score: 0.99 },
        { entity: 'I-PER', word: '##fevbre', score: 0.99 }
      ];
    }
    if (chunk === 'jean lefevbre') {
      return [
        { entity: 'B-PER', word: 'le', score: 0.92 },
        { entity: 'I-PER', word: '##fev', score: 0.96 }
      ];
    }
    return [];
  };
  const out = await detectNER('jean lefevbre', fakePipe);
  assert.deepEqual(out.map(e => e.value), ['jean lefevbre']);
});

test('les doublons du recouvrement sont fusionnés', async () => {
  // entité placée dans la zone de recouvrement entre deux fenêtres
  const pad = 'a'.repeat(CHUNK_SIZE - Math.floor(CHUNK_OVERLAP / 2));
  const text = pad + ' Jean Dupont ' + 'b'.repeat(CHUNK_SIZE);
  const fakePipe = async chunk => chunk.includes('Jean Dupont')
    ? [
        { entity: 'B-PER', word: 'Jean', score: 0.99 },
        { entity: 'I-PER', word: 'Dupont', score: 0.98 }
      ]
    : [];
  const out = await detectNER(text, fakePipe);
  const values = out.filter(e => e.value === 'Jean Dupont');
  assert.equal(values.length, 1, 'entité dupliquée par le recouvrement');
});
