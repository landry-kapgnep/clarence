# Politique de confidentialité — Clarence

**Dernière mise à jour : 4 septembre 2026**

## En une phrase

Clarence ne collecte, ne transmet et ne stocke aucune donnée personnelle sur
aucun serveur. Tout se passe dans votre navigateur, sur votre machine.

## Ce que Clarence fait de vos documents

Le texte et les fichiers que vous lui donnez sont analysés **entièrement en
local**, par du code qui s'exécute dans votre navigateur. Ils ne sont envoyés
nulle part : ni à nous, ni à un service tiers, ni à un modèle d'IA distant.

Il n'existe aucun serveur derrière Clarence. Il n'y a donc rien où vos données
pourraient être copiées, mises en cache ou consultées — pas même par erreur.

**Vous pouvez le vérifier vous-même**, et c'est la seule preuve qui compte :
ouvrez les outils de développement de votre navigateur (F12), onglet
« Réseau », puis anonymisez un document. Vous ne verrez aucune requête
contenant votre texte. Les seules requêtes réseau que Clarence émet sont
décrites ci-dessous.

## Les seules requêtes réseau émises

| Quand | Vers quoi | Ce qui part | Ce qui revient |
|---|---|---|---|
| Au premier lancement | `huggingface.co` et ses miroirs de fichiers (`cdn-lfs.huggingface.co`, `cdn-lfs-us-1.hf.co`, `us.aws.cdn.hf.co`, `cas-bridge.xethub.hf.co`) | rien de vous — une simple demande de fichier | le modèle de détection, mis en cache ensuite |

Ces cinq domaines sont les seuls que l'extension est autorisée à contacter ; ils
sont déclarés dans son manifeste et le navigateur lui interdit tout le reste.

Ce téléchargement contient **uniquement** le modèle. Aucun contenu de vos
documents n'y figure, ni dans la requête, ni dans une quelconque en-tête.
Une fois le modèle en cache, Clarence fonctionne hors ligne.

## Ce qui est conservé, et où

Tout est stocké par le navigateur, sur votre machine, via `chrome.storage.local`
et le cache du navigateur. Rien n'est synchronisé vers un compte.

| Donnée | Pourquoi | Effacée quand |
|---|---|---|
| Vos **profils d'anonymisation** (listes « toujours masquer » / « ne jamais masquer ») | pour ne pas les ressaisir | vous les supprimez, ou vous désinstallez |
| Votre **profil d'identité** (nom, e-mails, employeurs que vous déclarez) | pour masquer votre identité de façon certaine, sans dépendre d'un modèle | vous le videz, ou vous désinstallez |
| Le **modèle de détection** | pour éviter de le retélécharger | vous videz le cache, ou vous désinstallez |
| La **table de correspondance** placeholder ↔ valeur réelle | pour permettre la ré-injection dans la réponse du LLM | à la fermeture de la fenêtre |

Le profil d'identité utilise `chrome.storage.local` et **jamais**
`chrome.storage.sync` : ce dernier remonterait vos données vers votre compte
Google, ce qui contredirait la promesse de cette page.

## Permissions demandées, et pourquoi

| Permission | À quoi elle sert |
|---|---|
| `storage` | conserver vos profils et votre profil d'identité sur votre machine |
| `clipboardWrite` | le bouton « Copier », qui place le texte anonymisé dans votre presse-papier |
| Accès à `huggingface.co` et ses quatre miroirs | télécharger le modèle de détection, une seule fois |

L'extension installe par ailleurs un script sur quatre sites — `chatgpt.com`,
`chat.openai.com`, `claude.ai`, `gemini.google.com` — et **uniquement** sur
ceux-là. Son unique rôle est de déposer le contenu anonymisé dans le champ de
saisie quand vous cliquez sur « Dans la page ». Il ne lit pas vos conversations,
n'observe pas votre navigation et n'envoie rien nulle part.

## Ce que Clarence ne fait pas

- Aucune analytique, aucune télémétrie, aucun traceur — pas même anonymisé.
- Aucun compte, aucune inscription, aucune adresse e-mail demandée.
- Aucun cookie.
- Aucune publicité, aucune revente de données. Il n'y a pas de données à
  revendre.

## Enfants

Clarence ne s'adresse pas particulièrement aux mineurs et ne collecte aucune
donnée, donc aucune donnée d'enfant.

## Une limite qu'il faut connaître

Clarence est un outil d'aide, pas une garantie. **La détection n'est pas
infaillible** : elle peut manquer un nom, une adresse ou un identifiant.
L'interface vous montre systématiquement ce qui a été détecté pour que vous
relisiez avant de coller. Ne considérez jamais un document comme sûr sans
l'avoir relu.

## Modifications

Toute modification de cette politique sera datée en tête de page. Comme Clarence
n'a pas votre adresse e-mail, il ne peut pas vous prévenir autrement — la page
publiée fait foi.

## Contact

Une question, un doute, un défaut à signaler :
[github.com/landry-kapgnep/clarence/issues](https://github.com/landry-kapgnep/clarence/issues)
