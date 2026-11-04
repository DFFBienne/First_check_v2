/* ============================================================================
 * utilisateurs.js — Personnes autorisées à signer électroniquement
 * ----------------------------------------------------------------------------
 * Géré par le titulaire de l'autorisation d'installer / de contrôler.
 *
 * AJOUTER une personne : copier le bloc reçu par e-mail (de `SBB1. jusqu'à `,)
 *   et le coller dans la liste ci-dessous, puis déployer.
 *   Vérifier que l'e-mail vient bien de l'adresse de la personne.
 *
 * RÉVOQUER une personne (départ, mot de passe compromis) : NE PAS supprimer
 *   l'entrée (ses anciennes signatures resteraient sinon « non autorisées »),
 *   mais la transformer ainsi :
 *     { code: `SBB1.…`, revoque: '2026-12-31' },
 *
 * Les codes contiennent la clé de signature CHIFFRÉE par le mot de passe de
 * la personne : ils sont inutilisables sans ce mot de passe.
 * Après chaque modification : incrémenter CACHE_NAME dans sw.js.
 * ========================================================================== */
window.UTILISATEURS = [

  // ↓ Coller les nouveaux codes ici ↓

];
