// Annulation d'un traitement en cours.
//
// POURQUOI CE MODULE EXISTE. Sans signal d'annulation, un traitement abandonné
// (changement de fichier, relance, bouton Annuler) continue à tourner : il
// occupe le modèle et le run suivant fait la queue derrière des centaines
// d'inférences dont plus personne ne veut. C'est ce qui donnait l'impression
// d'un blocage sur « Reconstruction du PDF… » - rien n'était bloqué, tout était
// en file d'attente derrière un mort.
//
// On s'appuie sur `AbortSignal`, le standard du web : il est déjà compris par
// `fetch`, il est disponible en Node pour les tests, et il évite d'inventer un
// protocole maison que chaque orchestrateur interpréterait à sa façon.

// Erreur DÉDIÉE, distincte d'un vrai échec. La différence n'est pas cosmétique :
// un traitement annulé par l'utilisateur ne doit PAS afficher « Traitement
// échoué - le fichier n'a pas été anonymisé », qui laisserait croire à un bug.
export class OperationAnnulee extends Error {
  constructor(message = 'traitement annulé') {
    super(message);
    this.name = 'OperationAnnulee';
  }
}

// Reconnaît une annulation, quelle que soit sa provenance : la nôtre, ou le
// `DOMException{name:'AbortError'}` que le navigateur produit par défaut quand
// `abort()` est appelé sans raison explicite.
export function estAnnulation(err) {
  return err instanceof OperationAnnulee || err?.name === 'AbortError';
}

// À appeler AUX POINTS DE REPRISE d'une boucle longue (entre deux unités, deux
// pages, deux vagues). Lève si le traitement a été abandonné.
//
// Placer la vérification APRÈS chaque `await` et non seulement en tête de
// boucle : c'est pendant l'attente que l'annulation arrive.
export function verifierAnnulation(signal) {
  if (!signal?.aborted) return;
  throw signal.reason instanceof Error ? signal.reason : new OperationAnnulee();
}
