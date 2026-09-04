// Les mots de forme d'un document, par format et par langue.
//
// Les mots qui permettent de reconnaître un format sont exactement ceux qui ne
// doivent jamais y être masqués : « SOMMAIRE » dit « ceci est un rapport » ET
// doit survivre, sinon le LLM ne sait plus lire la structure. Deux besoins, un
// seul vocabulaire, donc un seul endroit.
//
// Consommé par type-document.js (proposer un profil) et profiles.js (remplir
// « ne jamais masquer »).
//
// Y entrent des mots de mise en forme : intitulés de rubrique, formules
// consacrées, en-têtes normalisés. Jamais un mot de contenu, un nom
// d'entreprise ou de personne.
//
// N'y entre pas un mot trop générique : la correspondance de « ne jamais
// masquer » est bidirectionnelle et mot à mot, donc inscrire « formations »
// démasquerait « Formations Dupont SARL ». Dans le doute on n'inscrit rien, un
// mot de forme oublié coûtant un masque de trop quand un mot de trop coûte une
// fuite.

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

// Tous les mots d'un format, toutes langues confondues, dédoublonnés.
//
// Le dédoublonnage n'est pas cosmétique : « introduction » et « conclusion »
// s'écrivent pareil en français et en anglais, « índice » et « certifica que »
// en espagnol et en portugais. Comptés deux fois, ils gonflaient le score de
// leur type - défaut mesuré sur dossier-rh.txt, qu'un simple « conclusion »
// suffisait à tirer vers le rapport.
export function motsDeForme(format) {
  const parLangue = MOTS_DE_FORME[format] || {};
  return [...new Set(Object.values(parLangue).flat())];
}

export const TOUS_LES_MOTS_DE_FORME = [
  ...new Set(FORMATS.flatMap(motsDeForme))
];
