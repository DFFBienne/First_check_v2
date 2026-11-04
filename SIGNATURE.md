# Profil et signature électronique — V1.2.2

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
3. Une fenêtre explique la marche à suivre et pourquoi, puis **Ouvrir l'e-mail** ouvre un message prêt pour **cedric.pedroza@sbb.ch** → **Envoyer**. (« Plus tard » : l'envoi reste possible depuis Mon profil → Renvoyer l'e-mail.)
4. Statut « ⏳ En attente de validation » jusqu'à l'ajout par le responsable.

## Validation par le responsable

1. Vérifier que l'e-mail vient bien de l'adresse de la personne.
2. Copier le bloc entre les deux lignes de tirets : la ligne `# Nom – e-mail – date` et les lignes qui commencent par `SBB1.`.
3. Le coller **à la fin de `utilisateurs.txt`** (fichier texte simple : aucune syntaxe à respecter, les lignes vides, espaces, accents graves ou virgules copiés par erreur sont ignorés).
4. Incrémenter `CACHE_NAME` dans `sw.js` (ex. `'sbb-protocole-v1.2.3'` — **garder les deux apostrophes**), puis commit → GitHub Pages redéploie.

Si un code est incomplet, la fenêtre de connexion l'indique (« utilisateurs.txt contient 1 code illisible »).

**Révoquer** quelqu'un : ne pas supprimer son bloc, ajouter juste en dessous la ligne
```
REVOQUE 2026-12-31
```
Ses signatures antérieures restent valides, les suivantes sont refusées.

Le code contient la clé de signature **chiffrée** par le mot de passe de la personne (AES-256, PBKDF2 600 000 itérations). Le responsable ne peut pas signer à sa place.

## Connexion sur un autre appareil (PC, nouveau téléphone)

Au moment de signer (ou via Mon profil → Se connecter) : choisir son nom, saisir son mot de passe. Pas de nouvelle inscription.
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

## Limites

- Signature électronique **avancée** (identification + intégrité), pas qualifiée (ZertES).
- Les codes sont publiés avec l'app : la sécurité repose sur la solidité des mots de passe.
- La date de signature vient de l'horloge de l'appareil.
- L'e-mail d'inscription doit être envoyé manuellement (une web app ne peut pas envoyer d'e-mail seule).
