// LES MOTS DE FORME D'UN DOCUMENT, par format et par langue.
//
// L'IDÉE QUI JUSTIFIE CE MODULE. Les mots qui permettent de RECONNAÎTRE un
// format sont exactement ceux qui ne doivent JAMAIS y être masqués : « SOMMAIRE »
// dit « ceci est un rapport » ET doit survivre à l'anonymisation, sans quoi le
// LLM ne sait plus lire la structure du document. Deux besoins, un seul
// vocabulaire — donc un seul endroit, et une langue ajoutée profite aux deux.
//
// Deux consommateurs :
//   · src/engine/type-document.js — pour PROPOSER un profil ;
//   · src/popup/profiles.js       — pour remplir « ne jamais masquer ».
//
// CE QUI A LE DROIT D'ENTRER ICI : des mots de MISE EN FORME — intitulés de
// rubrique, formules consacrées, en-têtes normalisés. Jamais un mot de contenu,
// jamais un nom d'entreprise, de techno ou de personne. C'est ce qui rend la
// liste courte, stable, et traduisible sans expertise métier.
//
// ⚠️ CE QUI N'A PAS LE DROIT D'ENTRER : un mot trop générique qui pourrait se
// trouver DANS une vraie entité. La correspondance de « ne jamais masquer » est
// bidirectionnelle et mot à mot (voir filterByRules) : inscrire « formations »
// démasquerait « Formations Dupont SARL ». On préfère donc les intitulés
// distinctifs ou composés — et dans le doute, on n'inscrit rien : un mot de
// forme oublié coûte un masque de trop, un mot de trop coûte une FUITE.

export const FORMATS = ['cv', 'administratif', 'scolaire', 'bancaire'];
export const LANGUES = ['fr', 'en', 'es', 'de', 'pt'];

export const MOTS_DE_FORME = {
  cv: {
    fr: ['expériences professionnelles', 'expérience professionnelle', 'compétences',
         'curriculum vitae', 'parcours professionnel', 'centres d’intérêt',
         'langues parlées', 'diplômes', 'certifications'],
    en: ['work experience', 'professional experience', 'skills', 'core skills',
         'curriculum vitae', 'résumé', 'career summary', 'certifications'],
    es: ['experiencia laboral', 'experiencia profesional', 'competencias',
         'currículum vítae', 'currículum', 'formación académica', 'idiomas'],
    de: ['berufserfahrung', 'lebenslauf', 'kenntnisse', 'qualifikationen',
         'werdegang', 'weiterbildung'],
    pt: ['experiência profissional', 'competências', 'currículo',
         'formação académica', 'habilitações']
  },
  administratif: {
    fr: ['république française', 'ministère', 'certificat de scolarité',
         'attestation', 'je soussigné', 'je soussignée', 'certifie que',
         'fait à', 'bulletin numéro', 'casier judiciaire', 'état civil',
         'compte rendu', 'entretien professionnel', 'ressources humaines'],
    en: ['hereby certify', 'affidavit', 'official record', 'issued at',
         'registration number', 'to whom it may concern'],
    es: ['certifica que', 'hace constar', 'ministerio', 'expediente',
         'documento nacional de identidad'],
    de: ['bescheinigung', 'hiermit wird bescheinigt', 'ausgestellt am',
         'aktenzeichen', 'behörde'],
    pt: ['certidão', 'certifica que', 'ministério', 'requerimento', 'declaração']
  },
  scolaire: {
    fr: ['sommaire', 'introduction', 'conclusion', 'bibliographie',
         'remerciements', 'rapport de stage', 'problématique', 'annexes',
         'table des matières', 'soutenance', 'travaux dirigés',
         'travaux pratiques', 'contrôle continu', 'relevé de notes'],
    en: ['table of contents', 'introduction', 'conclusion', 'bibliography',
         'acknowledgements', 'appendix', 'abstract', 'dissertation', 'coursework'],
    es: ['índice', 'introducción', 'conclusión', 'bibliografía',
         'agradecimientos', 'anexos', 'resumen'],
    de: ['inhaltsverzeichnis', 'einleitung', 'fazit', 'literaturverzeichnis',
         'danksagung', 'anhang', 'zusammenfassung'],
    pt: ['índice', 'introdução', 'conclusão', 'bibliografia',
         'agradecimentos', 'anexos', 'resumo']
  },
  bancaire: {
    fr: ['relevé de compte', 'titulaire du compte', 'solde créditeur',
         'solde débiteur', 'virement', 'prélèvement', 'date de valeur'],
    en: ['account statement', 'account holder', 'opening balance',
         'closing balance', 'wire transfer', 'direct debit'],
    es: ['extracto de cuenta', 'titular de la cuenta', 'saldo', 'transferencia'],
    de: ['kontoauszug', 'kontoinhaber', 'kontostand', 'überweisung', 'lastschrift'],
    pt: ['extrato de conta', 'titular da conta', 'saldo', 'transferência']
  }
};

// Tous les mots d'un format, toutes langues confondues, DÉDOUBLONNÉS.
//
// Le dédoublonnage n'est pas cosmétique : « introduction » et « conclusion »
// s'écrivent pareil en français et en anglais, « índice » et « certifica que »
// en espagnol et en portugais. Comptés deux fois, ils gonflaient le score de
// leur type — défaut mesuré sur dossier-rh.txt, qu'un simple « conclusion »
// suffisait à tirer vers le rapport.
export function motsDeForme(format) {
  const parLangue = MOTS_DE_FORME[format] || {};
  return [...new Set(Object.values(parLangue).flat())];
}

export const TOUS_LES_MOTS_DE_FORME = [
  ...new Set(FORMATS.flatMap(motsDeForme))
];
