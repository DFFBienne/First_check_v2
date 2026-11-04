# Profil et signature électronique — V1.2.5

## Ce qui change pour l'utilisateur

**👤 Mon profil** (bouton rond en haut à droite) :

| Rubrique | Repris dans le protocole |
|---|---|
| Nom, prénom | « Nom et prénom » de l'installateur |
| E-mail | compte de signature |
| Appareils de mesure (instrument + n° d'inventaire, autant que nécessaire) | liste déroulante « Instrument » des paramètres de mesure ; le choix remplit « N° inventaire » (« Autre… » permet une saisie libre) |
| Signature tactile | champ « Signature » du protocole + signatures électroniques |

Le profil reste sur l'appareil. Un nouveau protocole est prérempli automatiquement.

**Compte de signature** : nécessaire **uniquement pour signer électroniquement**. Sans compte, l'app reste utilisable normalement.

## Inscription (une fois par personne)

1. Remplir le profil (nom, prénom, e-mail, signature).
2. **Créer mon compte** → choisir un mot de passe (12 caractères minimum, ne peut pas être récupéré).
3. Une fenêtre explique la marche à suivre et pourquoi, puis ouvre un message prêt pour **cedric.pedroza@sbb.ch** → **Envoyer** :
   - **Outlook sur le web (Microsoft 365)** : proposé en premier sur PC, ouvre la rédaction dans le navigateur (se connecter à Outlook si demandé) ;
   - **Application e-mail de l'appareil** : proposé en premier sur téléphone, ouvre le programme e-mail par défaut ;
   - **Copier le bloc** si aucun des deux ne convient.
   (« Plus tard » : l'envoi reste possible depuis Mon profil → Renvoyer l'e-mail.)
4. Statut « ⏳ En attente de validation » jusqu'à l'ajout par le responsable.

## Validation par le responsable

1. Vérifier que l'e-mail vient bien de l'adresse de la personne.
2. Copier le bloc entre les deux lignes de tirets : la ligne `# Nom – e-mail – date` et les lignes qui commencent par `SBB1.`.
3. Le coller **à la fin de `utilisateurs.txt`** (fichier texte simple : aucune syntaxe à respecter, les lignes vides, espaces, accents graves ou virgules copiés par erreur sont ignorés).
4. Incrémenter `CACHE_NAME` dans `sw.js` (ex. `'sbb-protocole-v1.2.6'` — **garder les deux apostrophes**), puis commit → GitHub Pages redéploie.

Si un code est incomplet, la fenêtre de connexion l'indique (« utilisateurs.txt contient 1 code illisible »).

**Révoquer** quelqu'un : ne pas supprimer son bloc, ajouter juste en dessous la ligne
```
REVOQUE 2026-12-31
```
Ses signatures antérieures restent valides, les suivantes sont refusées.

Le code contient la clé de signature **chiffrée** par le mot de passe de la personne (AES-256, PBKDF2 600 000 itérations). Le responsable ne peut pas signer à sa place.

## Connexion sur un autre appareil (PC, nouveau téléphone)

Au moment de signer (ou via Mon profil → Se connecter) : choisir son nom, saisir son mot de passe. Pas de nouvelle inscription.
Le bouton **?** de la fenêtre de connexion (et le lien « Comment créer ma signature ? ») explique le fonctionnement de la signature et sa création.
- « Rester connecté sur cet appareil » : à décocher sur un PC partagé.
- Le profil (appareils, signature dessinée) est à refaire sur chaque appareil ; nom, prénom et e-mail sont repris du compte.
- Mot de passe oublié : se réinscrire ; le responsable révoque l'ancien code.

## Signer un protocole

**✍️ Signer électroniquement** (sous « Installateur électricien ») :

| Case | Où apparaît la signature sur le PDF |
|---|---|
| Données communes | **en bas de page**, bloc « Installateur électricien » |
| Circuits cochés | **sur chaque ligne**, colonne « Collaborateur » |

Ce qui est signé est verrouillé 🔒. Plusieurs personnes : exporter le JSON → le collègue l'importe (**Tout remplacer**), ajoute ses circuits et signe ses lignes.
Le dernier signataire peut retirer sa propre signature pour corriger.

**PDF** : page 1 avec les signatures (« SIGNATURE INVALIDE » si les données ont été modifiées), page 2 « Signatures électroniques » (détail et statut), JSON signé joint au PDF.

## PDF scellé (non modifiable sans trace)

Quand la personne qui génère le PDF est connectée et autorisée, le PDF reçoit une **signature numérique PDF** (certification « aucune modification autorisée »). Si le protocole contient des signatures et que personne n'est connecté, la connexion est proposée ; en cas d'annulation, le PDF sort **non scellé** (message d'avertissement).

Dans PDF-XChange ou Acrobat, panneau **Signatures** :
- PDF intact → signature valide, signataire = la personne qui a généré le PDF ;
- toute modification (texte, annotation, page, même enregistrée par PDF-XChange) → signature **invalide** / « document modifié depuis la certification ».

Le lecteur indique « identité inconnue » (certificat auto-signé, pas d'autorité reconnue) : c'est normal, l'intégrité est vérifiée quand même. Aucun format PDF ne peut empêcher techniquement un logiciel de réécrire le fichier ; le sceau rend la modification **visible**.

## Limites

- Signature électronique **avancée** (identification + intégrité), pas qualifiée (ZertES).
- Les codes sont publiés avec l'app : la sécurité repose sur la solidité des mots de passe.
- La date de signature vient de l'horloge de l'appareil.
- L'e-mail d'inscription doit être envoyé manuellement (une web app ne peut pas envoyer d'e-mail seule).
