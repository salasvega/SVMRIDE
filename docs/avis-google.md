# Avis Google — mise en service

Section d'accueil « Votre confiance, notre plus belle récompense ».
État au 16/10/2026 : **phase A terminée** (affichage, données, synchronisation prêts).
Sur svmride.com la section est **masquée** : pas de lien vérifié, pas de connexion Google.
En local et dans les aperçus Netlify, des avis **fictifs** marqués « démo » la remplissent.

## Architecture

| Rôle | Fichier |
| --- | --- |
| Affichage (section, carrousel, carte, étoiles, logo) | `src/components/avis/*` |
| Format commun des avis | `src/lib/avis/types.ts` |
| Choix de la source, fraîcheur, ordre | `src/lib/avis/source.ts` |
| Avis de démonstration (exclus de la version production) | `src/lib/avis/demo.ts` |
| Réglages du site (activation, Place ID, liens) | `src/config/avisGoogle.ts` |
| Service Google (OAuth, pagination, conversion) | `netlify/lib/avis-google.ts` |
| Synchronisation quotidienne (5 h 17 UTC) | `netlify/functions/avis-google-sync.mts` |
| Lecture par le site (`/.netlify/functions/avis-google`) | `netlify/functions/avis-google.mts` |

Les avis sont stockés dans **Netlify Blobs** (magasin `avis-google`), sans modifier Supabase.
Chaque synchronisation remplace tout l'instantané : nouveaux avis ajoutés, avis modifiés à jour,
avis supprimés chez Google retirés, aucun doublon. Le site ne contacte jamais Google.
Données de plus de 7 jours : masquées. Plus de 30 jours : effacées.

Dépendance ajoutée : `@netlify/blobs` (gratuit, inclus dans Netlify).

## Étape 1 — Boutons « Voir tous les avis » et « Donner mon avis » (sans API)

1. Trouver le **Place ID** de la fiche SVM Ride : outil « Place ID Finder » de Google
   (Google Maps Platform), rechercher « SVM Ride Chaville ». Il commence souvent par `ChIJ`.
2. Le renseigner dans `src/config/avisGoogle.ts` → `placeId`.
3. Tester les deux liens sur ordinateur et sur mobile (ils sont construits ainsi) :
   - `https://search.google.com/local/reviews?placeid=<PLACE_ID>`
   - `https://search.google.com/local/writereview?placeid=<PLACE_ID>`
4. Passer `liensVerifies: true`. Les deux boutons apparaissent alors sur svmride.com
   (sans note ni avis tant que l'étape 2 n'est pas faite).

## Étape 2 — Connexion à Google Business Profile API

1. **Demander l'accès à l'API** (formulaire « Business Profile APIs access request » de Google)
   depuis un projet Google Cloud, avec le compte propriétaire de la fiche. Délai : quelques jours.
   Vérifier à cette occasion les conditions d'utilisation et d'affichage des avis.
2. Dans ce projet Google Cloud, **activer** : *Google My Business API* (avis, v4),
   *My Business Account Management API* et *My Business Business Information API*.
3. **Écran de consentement OAuth** : type externe, puis le passer « En production »
   (en mode « Test », l'autorisation expire au bout de 7 jours).
4. **Identifiants OAuth** : client « Application Web », URI de redirection
   `https://developers.google.com/oauthplayground`.
5. **Jeton d'actualisation** : sur OAuth 2.0 Playground, réglages ⚙ → « Use your own OAuth
   credentials » ; portée `https://www.googleapis.com/auth/business.manage` ; se connecter avec le
   **compte propriétaire de la fiche** ; « Exchange authorization code for tokens » → copier le
   *refresh token*.
6. **Identifiants de la fiche** : avec ce jeton, `GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts`
   (→ `accounts/<GBP_ACCOUNT_ID>`) puis
   `GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/<id>/locations?readMask=name,title`
   (→ `locations/<GBP_LOCATION_ID>`).
7. **Netlify** → Site configuration → Environment variables, en **secret**, portée « Functions » :
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GBP_ACCOUNT_ID`, `GBP_LOCATION_ID`.
   Ces valeurs ne doivent jamais être écrites dans le code ni envoyées au navigateur.
8. **Premier passage** : Netlify → Functions → `avis-google-sync` → « Run now », puis ouvrir
   `https://svmride.com/.netlify/functions/avis-google` : la note, le nombre d'avis et les avis
   doivent correspondre à la fiche Google.
9. Passer `actif: true` dans `src/config/avisGoogle.ts` et mettre en ligne.
10. Ajouter une ligne à la politique de confidentialité (affichage des avis publics Google :
    nom public, note, commentaire, date ; source Google).

## Règles d'affichage (non négociables)

- Aucun avis fictif en production (le fichier de démonstration n'est même pas compilé).
- Aucun filtrage des avis négatifs : ordre chronologique, du plus récent au plus ancien.
- Texte original de l'auteur conservé (la traduction automatique de Google est retirée).
- Note moyenne et nombre d'avis repris tels que Google les fournit, jamais saisis à la main.
