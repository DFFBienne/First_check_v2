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
`SBB1.eyJ2IjoxLCJub20iOiJQZWRyb3phIiwicHJlbm9tIjoiQ8OpZHJpYyIsImV 
   tYWlsIjoiY2VkcmljLnBlZHJvemFAZ21haWwuY29tIiwiZCI6IjIwMjYtMTEtMDQ 
   iLCJ4IjoiRWpubS1CWnBnaVlYT0pfdGN1QmY4dUVqWnFONXFlOUpRUi0wZ3Z0ekZ 
   rayIsInkiOiJJWnJoZUJseHBjZ3RTRnZURFNtOEMyOU92M0Npay1lbmNaSGRxR0d 
   zUlFVIiwicyI6InpQSFFYSDE4X01aUmZnRVVYbzJqMHciLCJpIjoialczWE5NT0p 
   ERzJ1OWZ6ZCIsIml0Ijo2MDAwMDAsImsiOiJwN05KYjJ1Y2xUSGRUTVVhaWx5LTh 
   Oa1MyTjhpZGItRUtBeE1rS2dNVVk4cG1JYnU4UzFqQXRDRzFBWDh1cFRPemFaM0g 
   zUzFRZjZaaDB2NDluN01POXpTbDF5bzF0c0pBeEZTM0FzS0NtWDFsLUNDdnc2WEs 
   zSVlMSHlha2JrbWpGcVFWSE44WUJhTnNNZTZOYWkyWlA1TWZDc0RrRS1CRWNBZVQ 
   2RWpZZlNTa0FScE5tbE9pYUk5OU41NnRiM1hVUWNxVUNrdnJLZGpvZyJ9`,  // Pedroza Cédric – cedric.pedroza@gmail.com – 2026-11-04

];
