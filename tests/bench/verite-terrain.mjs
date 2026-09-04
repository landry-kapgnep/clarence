// Vérité terrain du banc d'essai : ce qui doit être masqué, et ce qui doit
// Survivre, pour chaque document du corpus.
//
// Annotation par valeur, jamais par position : un offset casse au moindre
// caractère ajouté au corpus, une valeur littérale non. La contrepartie est
// qu'une valeur qui apparaît plusieurs fois est vérifiée globalement (elle ne
// doit subsister nulle part dans la sortie), ce qui est exactement la garantie
// qu'on veut.
//
// La criticité n'est pas annotée à la main : elle se déduit du `type` (voir
// TYPES_STRUCTURES dans run.mjs). Une seule source de vérité, pas deux listes
// à garder synchronisées.
//
// Les valeurs sont toutes fictives et reconnaissables comme telles (carte
// 4242…, domaines .example) - règle du projet : ne jamais committer de données
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
    // Termes qui doivent survivre : sans eux le document n'a plus de sens pour
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
      { valeur: 'Sarcelles', type: 'LOC' },
      // Ajoutée le 30/08/2026. Le commentaire ci-dessous affirmait déjà que
      // la ville est masquée, mais rien ne le vérifiait : elle apparaît deux
      // fois dans le document (« IUT de Villetaneuse », « Fait à Villetaneuse »)
      // et n'était dans aucune assertion. Un banc dont un commentaire promet
      // plus que ses tests laisse passer exactement ce qu'il prétend couvrir.
      { valeur: 'Villetaneuse', type: 'LOC' }
    ],
    // « IUT » et non « IUT de Villetaneuse » : la ville est masquée en LIEU,
    // exactement comme « Sarcelles » deux lignes plus haut dans le même
    // document - attendre l'inverse ici serait se contredire. Ce qui doit
    // survivre, c'est le sigle : sans lui le LLM ne sait plus qu'il s'agit
    // d'un institut universitaire.
    aGarder: ['CERTIFICAT DE SCOLARITE', 'BUT Informatique', 'IUT']
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
    fichier: 'rapport-interligne.pdf',
    quoi: 'PROSE en INTERLIGNE 1,5 — le réglage de tout mémoire/rapport académique',
    aMasquer: [
      { valeur: 'Korrigane Labs', type: 'ORG' },
      { valeur: 'Sebastien Vaquier', type: 'PER' },
      { valeur: 'Amandine Rousseau', type: 'PER' },
      { valeur: 'Nantes', type: 'LOC' },
      { valeur: 'recherche@korrigane-labs.example', type: 'EMAIL' },
      { valeur: '02 40 11 22 33', type: 'TELEPHONE' }
    ],
    // Mots ordinaires que le modèle masquait quand il recevait des demi-phrases
    // (un paragraphe par ligne). Ce sont eux qui font de ce document une garde :
    // s'ils repartent, c'est que le regroupement en paragraphes a régressé.
    aGarder: [
      'industrie', 'leadership', 'protagoniste', 'compagnons', 'culture',
      'Python', 'PostgreSQL', 'Docker'
    ]
  },

  {
    fichier: 'formulaire-fr.txt',
    quoi: 'FORMULAIRE administratif : libellé en casse normale, VALEUR EN CAPITALES',
    // Ce document manquait, et son absence a coûté une fuite chez un vrai
    // utilisateur (P12). Tout le corpus était fait de CV et de mémoires, où les
    // noms sont en casse mixte - or dans un formulaire officiel (casier
    // judiciaire, acte d'état civil, attestation), les valeurs sont en
    // capitales et les libellés ne le sont pas.
    //
    // Mesuré : « ADRIEN MESNARD » sortait en ENTREPRISE à 0,72 sur le texte
    // naturel, et en PERSONNE à 0,99 une fois la casse adoucie. Le nom recevait
    // donc un pseudonyme d'entreprise, et le prénom isolé n'était jamais
    // masqué - la décomposition par composant ne vaut que pour les PER.
    //
    // Données ENTIÈREMENT INVENTÉES : le document réel qui a servi au
    // diagnostic n'est jamais entré dans le dépôt, et aucune de ses valeurs
    // n'est reprise ici.
    aMasquer: [
      { valeur: 'MARCHESSEAU', type: 'PER' },
      // Le prénom seul derrière son libellé : c'est lui qui fuyait.
      { valeur: 'THIBAULT', type: 'PER' },
      { valeur: 'Camille DUVERNOY', type: 'PER' },
      { valeur: 'MONTLUÇON', type: 'LOC' },
      { valeur: 'BEAUVAIS', type: 'LOC' },
      { valeur: '18 RUE DES GLYCINES', type: 'ADRESSE' },
      { valeur: '16 octobre 1994', type: 'DATE_NAISSANCE' }
    ],
    // L'autre moitié du marché, et c'est pour ça que ce document est une garde :
    // adoucir la casse rend les intitulés en capitales plus « nom propre » aux
    // yeux du modèle. Si ceux-ci repartent, la passe P12 coûte plus qu'elle ne
    // rapporte et il faut la resserrer.
    aGarder: [
      'RÉPUBLIQUE FRANÇAISE', 'MINISTÈRE DE LA JUSTICE', 'IDENTITÉ',
      'ADRESSE DÉCLARÉE', 'MENTIONS', 'NÉANT', 'Masculin',
      'Nom', 'Sexe', 'Date de naissance', 'Lieu de naissance'
    ]
  },

  {
    fichier: 'dossier-rh.txt',
    quoi: 'Le SEUL document qui éprouve POSITIVEMENT poste/santé/établissement',
    // Ce document manquait, et son absence bloquait une décision : le 3e groupe
    // de labels (POSTE/NATIONALITE/ETABLISSEMENT/SANTE) ne produisait que du
    // bruit sur tout le corpus - mais aucun document ne contenait de vraie
    // valeur de ces types. Impossible de dire si le désactiver par défaut
    // coûterait quelque chose. Il le dit maintenant.
    //
    // Les données de santé relèvent de l'article 9 du RGPD : une fuite ici est
    // la plus grave que le produit puisse commettre.
    //
    // POSTE/SANTE/NATIONALITE/ETABLISSEMENT restent listés ici alors qu'ils sont
    // Décochés par défaut (TYPES_PEU_fiables) : décider de ne pas chercher une
    // donnée ne la rend pas moins sensible. Le banc doit continuer à afficher
    // qu'on ne les attrape pas - c'est le même refus de fausse confiance qu'on
    // applique à l'utilisateur, appliqué à notre propre métrique.
    aMasquer: [
      { valeur: 'Nadia Belkacem', type: 'PER' },
      { valeur: 'Thibault Nerval', type: 'PER' },
      { valeur: 'aide-soignante de nuit', type: 'POSTE' },
      { valeur: 'diabète de type 2', type: 'SANTE' },
      { valeur: 'suivi psychologique', type: 'SANTE' },
      { valeur: 'portugaise', type: 'NATIONALITE' },
      { valeur: 'Camille-Claudel', type: 'ETABLISSEMENT' },
      { valeur: 'rh@clinique-lesorme.example', type: 'EMAIL' }
    ],
    // Vocabulaire RH ordinaire : sans lui le compte rendu n'a plus de sens.
    aGarder: [
      'entretien annuel', 'ressources humaines', 'commission paritaire',
      'budget formation', 'trimestre', 'documents'
    ]
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
      // Recollé ; s'il reste fragmenté (« vante » isolée), ce test le signale.
      'innovante'
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Le document piégé - borne basse, jamais fondu dans les moyennes.
  //
  // `tests/manuel/tous-defauts.pdf` empile délibérément tous les défauts connus
  // et n'a aucune vocation à être réaliste : page 2 faite de lignes courtes sans
  // phrases, sommaire à points de suite, blocs d'identifiants nus. Le lire comme
  // un document représentatif tirerait les trois chiffres du banc vers le bas
  // sans rien dire de vrai sur un fichier d'utilisateur.
  //
  // D'où `borneBasse` : run.mjs le rapporte À part. Une seule exception, le
  // Structuré - un raté déterministe est un bug partout, y compris ici.
  //
  // Sa vérité terrain vivait en prose dans tests/manuel/README.md, avec la
  // mention « à industrialiser ». La voici. Elle sert de banc d'essai à P9 :
  // toute variante sur les intitulés doit être mesurée dans les deux sens,
  // et c'est ce document qui porte le contre-exemple (voir aMasquer, en tête).
  {
    fichier: '../manuel/tous-defauts.pdf',
    borneBasse: true,
    quoi: 'DOCUMENT PIÉGÉ (borne basse) — 6 pages, 4 langues, tous les défauts connus',
    aMasquer: [
      // Le contre-exemple de p9. « ÉLÉONORE VASSEUR » est une unité-titre
      // isolée (21 pt), tout en capitales, deux mots, sans ponctuation ni
      // chiffre : `ressembleAUnIntitule` la reconnaîtrait comme un intitulé de
      // section, exactement comme « COMPÉTENCES ». Formellement indiscernables.
      // Toute variante qui épargne les unités-titres fait donc fuir le nom de
      // la candidate - c'est LE garde-fou à ne pas franchir.
      { valeur: 'ÉLÉONORE VASSEUR', type: 'PER' },
      { valeur: 'Sébastien de La Villardière', type: 'PER' },
      { valeur: 'Hélène Brassard', type: 'PER' },
      { valeur: 'Amandine ROUSSEAU', type: 'PER' },
      { valeur: 'Sébastien Vaquier', type: 'PER' },
      { valeur: 'Ahmed Al-Mansour', type: 'PER' },
      { valeur: 'Clara SCHNEIDER', type: 'PER' },
      { valeur: 'Rose Fontaine', type: 'PER' },
      { valeur: 'Korrigane Labs', type: 'ORG' },
      { valeur: 'Wobix Labs', type: 'ORG' },
      { valeur: 'e.vasseur@courriel.example', type: 'EMAIL' },
      { valeur: 'contact@korrigane-labs.example', type: 'EMAIL' },
      { valeur: '06 44 55 66 77', type: 'TELEPHONE' },
      { valeur: 'eleonore-vasseur', type: 'PSEUDO' },
      { valeur: 'FR76 3000 6000 0112 3456 7890 189', type: 'IBAN' },
      { valeur: 'AGRIFRPP882', type: 'BIC' },
      { valeur: '4242 4242 4242 4242', type: 'CARTE_BANCAIRE' },
      { valeur: '1 88 03 44 109 019 91', type: 'NIR' },
      { valeur: '732 829 320 00074', type: 'SIRET_SIREN' },
      { valeur: '080924167CD', type: 'ID_NATIONAL' },
      { valeur: 'EMP-4471-KD', type: 'REFERENCE' },
      { valeur: '192.168.1.254', type: 'IP' },
      { valeur: '3C:5A:B4:0F:11:22', type: 'MAC' },
      { valeur: '42 rue des Cordeliers', type: 'ADRESSE' },
      { valeur: '99 Av. Jean Jaurès', type: 'ADRESSE' },

      // Page 4 - anglais
      { valeur: '(617) 555-0142', type: 'TELEPHONE' },
      { valeur: '617-555-0143', type: 'TELEPHONE' },
      { valeur: '123-45-6789', type: 'ID_NATIONAL' },
      { valeur: 'Kwame Nkrumah-Boateng', type: 'PER' },
      { valeur: 'Siobhán Ó Braonáin', type: 'PER' },
      { valeur: 'Ravenscroft & Bell LLP', type: 'ORG' },

      // Page 5 - espagnol
      { valeur: '12345678Z', type: 'ID_NATIONAL' },
      { valeur: 'X1234567L', type: 'ID_NATIONAL' },
      { valeur: 'ES91 2100 0418 4502 0005 1332', type: 'IBAN' },
      { valeur: '+34 612 345 678', type: 'TELEPHONE' },
      { valeur: '91 234 56 78', type: 'TELEPHONE' },
      { valeur: 'Calle Mayor 12', type: 'ADRESSE' },
      { valeur: 'María del Carmen Ruiz Salinas', type: 'PER' },

      // Page 6 - allemand
      { valeur: '12345678901', type: 'ID_NATIONAL' },
      { valeur: 'DE89 3704 0044 0532 0130 00', type: 'IBAN' },
      { valeur: '+49 30 123456', type: 'TELEPHONE' },
      { valeur: '030 1234567', type: 'TELEPHONE' },
      { valeur: 'Hauptstraße 15', type: 'ADRESSE' },
      { valeur: 'Bahnhofstr. 7a', type: 'ADRESSE' },
      { valeur: 'Jürgen Müller', type: 'PER' },
      { valeur: 'Katharina von der Weiden', type: 'PER' },
      { valeur: 'Nordwind Logistik GmbH', type: 'ORG' }
    ],

    // Ce qui doit survivre. Les intitulés de section en tête : ce sont EUX que
    // P9 cherche à démasquer, dans les quatre langues - la règle est formelle,
    // donc elle doit être indépendante de la langue.
    aGarder: [
      // Intitulés - français
      'COMPÉTENCES', 'FORMATION', 'LANGUES', 'EXPÉRIENCES PROFESSIONNELLES',
      'SOMMAIRE', 'IDENTIFIANTS', 'COORDONNÉES', 'ÉTAT CIVIL',
      'AUTRES CANDIDATS', 'CELLULES NUES', 'OUTILS UTILISÉS',
      'TABLEAU DE SUIVI', 'ANNEXE',
      // Intitulés - anglais / espagnol / allemand
      'SUMMARY', 'CONTACT DETAILS', 'PEOPLE', 'AMBIGUOUS WORDS',
      'OTHER SECTIONS', 'APPENDIX',
      'DATOS PERSONALES', 'OBSERVACIONES', 'IDIOMAS', 'COMPETENCIAS',
      'EXPERIENCIA LABORAL', 'ANEXO',
      'PERSÖNLICHE DATEN', 'SPRACHEN', 'AUSBILDUNG', 'BERUFSERFAHRUNG',
      'ANLAGE',
      // Noms communs que le modèle étiquette volontiers ORG ou LIEU quand ils
      // sont isolés. L'allemand est le pire cas : il met une majuscule à tous
      // les noms communs, donc le filtre de casse ne protège rien.
      'Contents', 'Overview', 'Conclusion',
      'Contenido', 'Resumen', 'Conclusión',
      'Besprechung', 'Vertrag', 'Unternehmen', 'Bescheinigung', 'Abteilung',
      // Le piège le plus fin du document : le même mot, nom propre puis nom
      // commun. Aucun lexique ne peut trancher - seule la position le peut.
      'the baker', 'rose grower', 'une rose ancienne',
      // Technos et sigles : sans eux le CV ne veut plus rien dire.
      'Python', 'Docker', 'PostgreSQL', 'Kubernetes', 'IUT', 'BUT',
      // Le piège SIREN : Luhn-invalide, et pris pour un numéro FR par
      // libphonenumber si on lui donnait un pays par défaut.
      '483 921 657'
    ]
  }
];
