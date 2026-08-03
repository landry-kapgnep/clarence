// Vérité terrain du banc d'essai : ce QUI DOIT être masqué, et ce qui doit
// SURVIVRE, pour chaque document du corpus.
//
// Annotation PAR VALEUR, jamais par position : un offset casse au moindre
// caractère ajouté au corpus, une valeur littérale non. La contrepartie est
// qu'une valeur qui apparaît plusieurs fois est vérifiée globalement (elle ne
// doit subsister NULLE PART dans la sortie), ce qui est exactement la garantie
// qu'on veut.
//
// La criticité n'est pas annotée à la main : elle se déduit du `type` (voir
// TYPES_STRUCTURES dans run.mjs). Une seule source de vérité, pas deux listes
// à garder synchronisées.
//
// Les valeurs sont TOUTES fictives et reconnaissables comme telles (carte
// 4242…, domaines .example) — règle du projet : ne jamais committer de données
// ressemblant à du réel.

export const CORPUS = [
  {
    fichier: 'rapport-fr.txt',
    quoi: 'Prose longue + sommaire à points de suite (cas P2bis) + civilités',
    aMasquer: [
      { valeur: 'Amandine ROUSSEAU', type: 'PER' },
      { valeur: 'Sébastien Vaquier', type: 'PER' },
      { valeur: 'Hélène Brassard', type: 'PER' },
      { valeur: 'Nadia Belkacem', type: 'PER' },
      { valeur: 'Thibault Nerval', type: 'PER' },
      { valeur: 'Korrigane Labs', type: 'ORG' },
      { valeur: 'contact@korrigane-labs.example', type: 'EMAIL' },
      { valeur: '02 40 11 22 33', type: 'TELEPHONE' },
      { valeur: '732 829 320 00074', type: 'SIRET_SIREN' },
      { valeur: '42 rue des Cordeliers', type: 'ADRESSE' },
      { valeur: 'Nantes', type: 'LOC' }
    ],
    // Termes qui doivent SURVIVRE : sans eux le document n'a plus de sens pour
    // le LLM. C'est le critère d'utilisabilité, aussi bloquant que les fuites
    // pour un produit payant.
    aGarder: [
      'Python', 'Docker', 'PostgreSQL', 'React', 'GitHub', 'Slack', 'Faker',
      'SOMMAIRE', 'INTRODUCTION', 'CONCLUSION', 'REMERCIEMENTS',
      'vérité terrain', 'anonymisation'
    ]
  },

  {
    fichier: 'certificat-fr.txt',
    quoi: 'Administratif : identifiants nationaux, très peu de prose',
    aMasquer: [
      { valeur: 'KAROLINE ANSELME', type: 'PER' },
      { valeur: '080924167CD', type: 'ID_NATIONAL' },
      { valeur: '12201603', type: 'ID_NATIONAL' },
      { valeur: '16 octobre 2004', type: 'DATE_NAISSANCE' },
      { valeur: 'Sarcelles', type: 'LOC' }
    ],
    aGarder: ['CERTIFICAT DE SCOLARITE', 'BUT Informatique', 'IUT de Villetaneuse']
  },

  {
    fichier: 'email-pro-en.txt',
    quoi: 'Internationalisation : SSN, téléphone US, ZIP, date littérale anglaise',
    aMasquer: [
      { valeur: 'Eleanor Vance', type: 'PER' },
      { valeur: 'Marcus Whitfield', type: 'PER' },
      { valeur: 'eleanor.vance@northbridge.example', type: 'EMAIL' },
      { valeur: '900-12-3456', type: 'ID_NATIONAL' },
      { valeur: '+1 617 555 0142', type: 'TELEPHONE' },
      { valeur: 'March 14, 1988', type: 'DATE_NAISSANCE' },
      { valeur: 'GB29 NWBK 6016 1331 9268 19', type: 'IBAN' },
      { valeur: 'EMP-4471-KD', type: 'REFERENCE' },
      { valeur: '1841 Fountain Road', type: 'ADRESSE' },
      { valeur: '97477', type: 'CODE_POSTAL_VILLE' },
      { valeur: 'Halloway Freight', type: 'ORG' }
    ],
    aGarder: ['Onboarding', 'confidential', 'reimbursement']
  },

  {
    fichier: 'tableau-rh.csv',
    quoi: 'Cellules ISOLÉES sans contexte — le cas que seul le zero-shot débloque',
    aMasquer: [
      { valeur: 'Rousseau', type: 'PER' },
      { valeur: 'Amandine', type: 'PER' },
      { valeur: 'Belkacem', type: 'PER' },
      { valeur: 'Vaquier', type: 'PER' },
      { valeur: '1988-03-14', type: 'DATE_NAISSANCE' },
      { valeur: 'a.rousseau@korrigane-labs.example', type: 'EMAIL' },
      { valeur: '06 12 34 56 78', type: 'TELEPHONE' },
      { valeur: 'EMP-0012', type: 'REFERENCE' }
    ],
    // Les en-têtes de colonnes doivent survivre : sans eux le tableau devient
    // illisible pour le LLM, alors qu'ils ne sont pas des données personnelles.
    aGarder: ['Matricule', 'Date de naissance', 'Service', 'Poste', 'Salaire']
  },

  {
    fichier: 'cv-fr.pdf',
    quoi: 'CV MULTI-COLONNES : fragmentation PDF (P1bis), nom TOUT-MAJUSCULE isolé',
    aMasquer: [
      { valeur: 'KAROLINE ANSELME', type: 'PER' },
      { valeur: 'Sebastien Vaquier', type: 'PER' },
      { valeur: 'Korrigane Labs', type: 'ORG' },
      { valeur: 'Wobix Labs', type: 'ORG' },
      { valeur: 'k.anselme@courriel.example', type: 'EMAIL' },
      { valeur: '06 44 55 66 77', type: 'TELEPHONE' },
      { valeur: 'karoline-anselme', type: 'PSEUDO' }
    ],
    aGarder: [
      'Python', 'Docker', 'PostgreSQL', 'Git', 'Linux', 'FastAPI',
      'BUT Informatique',
      // Mot volontairement coupé en fin de ligne dans le PDF généré (voir
      // gen-cv-pdf.mjs) : reproduit le mécanisme réel de P1bis. Doit ressortir
      // RECOLLÉ ; s'il reste fragmenté (« vante » isolée), ce test le signale.
      'innovante'
    ]
  }
];
