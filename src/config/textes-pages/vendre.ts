/**
 * Textes du site : Page Dépôt-vente (/vendre-ma-moto).
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { L, P, atouts, entete, type PageTextes } from '../textes-outils.ts';

const ENTETE = entete('vendre', 'Vendre ma moto en dépôt-vente', 'Confiez-nous votre moto : nous la vendons pour vous, au juste prix, sans les appels, les visites ni les démarches. Estimation gratuite, paiement sous 48 h après la vente.');

export const PAGES_VENDRE: PageTextes[] = [
  {
  cle: 'vendre',
  libelle: 'Dépôt-vente',
  description: 'Page « Vendre ma moto » : présentation du dépôt-vente, formulaire de demande d’estimation et questions fréquentes.',
  chemin: '/vendre-ma-moto',
  sections: [
    {
      titre: 'En-tête de la page',
      textes: [
        ...ENTETE.textes,
        L('vendre.hero.bouton', 'Bouton vers le formulaire', 'Demander une estimation', 'Le second bouton affiche le numéro de téléphone (modifiable dans Édition du site).', 40),
      ],
    },
    {
      titre: 'Votre moto est déjà chez nous ?',
      aide: 'Encadré sous l’introduction, vers l’espace « Suivre ma vente ».',
      textes: [
        L('vendre.suivi.titre', 'Titre', 'Votre moto est déjà chez nous ?', undefined, 60),
        P('vendre.suivi.texte', 'Texte', 'Suivez l\'avancement de la vente et retrouvez votre contrat et vos documents : il suffit de votre adresse e-mail.', undefined, 240),
        L('vendre.suivi.bouton', 'Bouton', 'Suivez votre vente en ligne', undefined, 45),
      ],
    },
    {
      titre: 'Comment ça marche ?',
      textes: [
        L('vendre.etapes.titre', 'Titre', 'Comment ça marche ?', undefined, 50),
        ...atouts('vendre.etapes.', [
          ['Votre demande', 'Décrivez votre moto en 2 minutes, avec quelques photos si vous le pouvez.'],
          ['Échange et estimation', 'Un conseiller vous rappelle sous 48 h ouvrées et vous propose un prix de vente conseillé.'],
          ['Le dépôt et le mandat', 'Au showroom, nous faisons ensemble l’état des lieux. Vous signez le mandat sur votre téléphone : prix et net vendeur y sont écrits.'],
          ['La mise en vente', 'Annonce, appels, visites : nous nous occupons de tout. Aucun essai sans votre accord. Vous suivez chaque étape en ligne.'],
          ['La vente et le paiement', 'Nous gérons l’acheteur et la carte grise. Vous recevez votre net vendeur par virement sous 48 h.'],
        ], 'Étape', 50, 260),
      ],
    },
    {
      titre: 'Pourquoi confier votre moto à SVM Ride ?',
      textes: [
        L('vendre.avantages.titre', 'Titre', 'Pourquoi confier votre moto à {nom} ?', '{nom} est remplacé par le nom du site.', 70),
        ...atouts('vendre.avantages.', [
          ['Un prix juste', 'Un prix de vente conseillé par des professionnels du deux-roues, qui connaissent le marché.'],
          ['Zéro contrainte', 'Annonce sur svmride.com, appels, visites, démarches : nous nous en chargeons, votre moto reste au showroom.'],
          ['Aucun risque après la vente', '{nom} achète votre moto au moment de la vente : la garantie et le service après-vente de l’acheteur sont à notre charge.'],
          ['Une vente transparente', 'Visites, offres, réservation, paiement : suivez chaque étape dans votre espace « Suivre ma vente ».'],
        ], 'Avantage', 50, 260),
        L('vendre.avantages.net.titre', 'Encadré : titre', 'Un net vendeur écrit noir sur blanc', undefined, 60),
        P('vendre.avantages.net.texte', 'Encadré : texte', 'Vous savez dès la signature ce que vous recevrez : le net vendeur est écrit dans le mandat, et vous êtes payé par virement sous 48 h après la vente. Pas de frais cachés.', undefined, 320),
      ],
    },
    {
      titre: 'Formulaire « Demander une estimation »',
      aide: 'Formulaire en trois étapes. Les messages d’erreur et les textes de la zone de dépôt des photos ne sont pas modifiables ici.',
      textes: [
        L('vendre.formulaire.titre', 'Titre', 'Demander une estimation', undefined, 50),
        L('vendre.formulaire.sous_titre', 'Sous-titre', 'Gratuit et sans engagement. Réponse sous 48 h ouvrées.', undefined, 100),
        L('vendre.formulaire.etape1', 'Étape 1 : nom', 'Vous', 'Affiché dans la barre de progression et au-dessus des champs.', 30),
        L('vendre.formulaire.etape2', 'Étape 2 : nom', 'Votre moto', 'Affiché dans la barre de progression et au-dessus des champs.', 30),
        L('vendre.formulaire.etape3', 'Étape 3 : nom', 'Photos et prix', 'Affiché dans la barre de progression et au-dessus des champs.', 30),
        L('vendre.formulaire.prenom', 'Champ “Prénom” : intitulé', 'Prénom', undefined, 30),
        L('vendre.formulaire.nom', 'Champ “Nom” : intitulé', 'Nom', undefined, 30),
        L('vendre.formulaire.email', 'Champ “E-mail” : intitulé', 'E-mail', undefined, 30),
        L('vendre.formulaire.telephone', 'Champ “Téléphone” : intitulé', 'Téléphone', undefined, 30),
        L('vendre.formulaire.marque', 'Champ “Marque” : intitulé', 'Marque', undefined, 30),
        L('vendre.formulaire.marque_exemple', 'Champ “Marque” : exemple dans le champ', 'Ex. Yamaha', undefined, 40),
        L('vendre.formulaire.modele', 'Champ “Modèle” : intitulé', 'Modèle', undefined, 30),
        L('vendre.formulaire.modele_exemple', 'Champ “Modèle” : exemple dans le champ', 'Ex. MT-07', undefined, 40),
        L('vendre.formulaire.version', 'Champ “Version” : intitulé', 'Version', undefined, 30),
        L('vendre.formulaire.version_exemple', 'Champ “Version” : exemple dans le champ', 'Ex. A2, édition limitée…', undefined, 50),
        L('vendre.formulaire.version_aide', 'Champ “Version” : aide sous le champ', 'Facultatif', undefined, 40),
        L('vendre.formulaire.annee', 'Champ “Année” : intitulé', 'Année', undefined, 30),
        L('vendre.formulaire.kilometrage', 'Champ “Kilométrage” : intitulé', 'Kilométrage', undefined, 30),
        L('vendre.formulaire.kilometrage_exemple', 'Champ “Kilométrage” : exemple dans le champ', 'En km', undefined, 30),
        L('vendre.formulaire.etat', 'Champ “État général” : intitulé', 'État général', undefined, 30),
        L('vendre.formulaire.etat_choisir', 'Champ “État général” : texte avant le choix', 'Sélectionnez…', undefined, 30),
        L('vendre.formulaire.etat_excellent', 'Champ “État général” : choix 1', 'Excellent', undefined, 30),
        L('vendre.formulaire.etat_tres_bon', 'Champ “État général” : choix 2', 'Très bon', undefined, 30),
        L('vendre.formulaire.etat_bon', 'Champ “État général” : choix 3', 'Bon', undefined, 30),
        L('vendre.formulaire.etat_correct', 'Champ “État général” : choix 4', 'Correct', undefined, 30),
        L('vendre.formulaire.etat_a_reviser', 'Champ “État général” : choix 5', 'À réviser', undefined, 30),
        L('vendre.formulaire.entretien', 'Champ “Entretien” : intitulé', 'Entretien', undefined, 30),
        L('vendre.formulaire.entretien_choisir', 'Champ “Entretien” : texte avant le choix', 'Facultatif', undefined, 30),
        L('vendre.formulaire.entretien_complet', 'Champ “Entretien” : choix 1', 'Carnet à jour (factures)', undefined, 50),
        L('vendre.formulaire.entretien_partiel', 'Champ “Entretien” : choix 2', 'Entretien partiel', undefined, 40),
        L('vendre.formulaire.entretien_inconnu', 'Champ “Entretien” : choix 3', 'Je ne sais pas', undefined, 40),
        L('vendre.formulaire.immatriculation', 'Champ “Immatriculation” : intitulé', 'Immatriculation', undefined, 30),
        L('vendre.formulaire.immatriculation_exemple', 'Champ “Immatriculation” : exemple dans le champ', 'Ex. AB-123-CD', undefined, 30),
        L('vendre.formulaire.immatriculation_aide', 'Champ “Immatriculation” : aide sous le champ', 'Facultatif à ce stade', undefined, 50),
        L('vendre.formulaire.photos', 'Champ “Photos” : intitulé', 'Photos de la moto (facultatif, {max} au maximum)', '{max} est remplacé par le nombre maximal de photos (10).', 80),
        P('vendre.formulaire.photos_conseil', 'Champ “Photos” : conseil sous le champ', 'Conseil : vue de face, de chaque côté, compteur et éventuels défauts. Les photos sont allégées automatiquement avant l’envoi.', undefined, 240),
        L('vendre.formulaire.prix', 'Champ “Prix souhaité” : intitulé', 'Prix souhaité (€)', undefined, 40),
        L('vendre.formulaire.prix_aide', 'Champ “Prix souhaité” : aide sous le champ', 'Facultatif : laissez vide si vous souhaitez d’abord notre avis', undefined, 110),
        L('vendre.formulaire.commentaire', 'Champ “Commentaire” : intitulé', 'Commentaire', undefined, 30),
        L('vendre.formulaire.commentaire_exemple', 'Champ “Commentaire” : exemple dans le champ', 'Options, accessoires, entretien récent, défauts à signaler…', undefined, 110),
        P('vendre.formulaire.consentement.avant', 'Case d’accord : texte', 'J’accepte que {nom} utilise ces informations pour étudier ma demande et me recontacter. Elles sont conservées au plus 3 ans (12 mois pour les photos) et je peux en demander la suppression à tout moment. Voir la', 'Suivi du lien vers la politique de confidentialité.', 400),
        L('vendre.formulaire.consentement.lien', 'Case d’accord : texte du lien', 'politique de confidentialité', undefined, 50),
        L('vendre.formulaire.consentement.apres', 'Case d’accord : après le lien', '.', undefined, 30),
        L('vendre.formulaire.precedent', 'Bouton “Précédent”', 'Précédent', undefined, 30),
        L('vendre.formulaire.suivant', 'Bouton “Suivant”', 'Suivant', undefined, 30),
        L('vendre.formulaire.envoyer', 'Bouton d’envoi', 'Envoyer ma demande', undefined, 40),
        L('vendre.formulaire.envoi.preparation', 'Pendant l’envoi : préparation', 'Préparation…', 'Affiché dans le bouton pendant l’envoi.', 40),
        L('vendre.formulaire.envoi.photos_preparation', 'Pendant l’envoi : préparation des photos', 'Préparation des photos ({n}/{total})…', '{n} et {total} sont remplacés par le numéro de la photo et le nombre de photos.', 60),
        L('vendre.formulaire.envoi.photos_envoi', 'Pendant l’envoi : envoi des photos', 'Envoi des photos ({n}/{total})…', '{n} et {total} sont remplacés par le numéro de la photo et le nombre de photos.', 60),
        L('vendre.formulaire.envoi.finalisation', 'Pendant l’envoi : finalisation', 'Finalisation…', 'Affiché dans le bouton pendant l’envoi.', 40),
      ],
    },
    {
      titre: 'Après l’envoi de la demande',
      aide: 'Message affiché à la place du formulaire une fois la demande envoyée.',
      textes: [
        L('vendre.confirmation.titre', 'Message après envoi : titre', 'Demande envoyée, merci !', undefined, 50),
        L('vendre.confirmation.reference', 'Avant la référence', 'Votre référence :', 'Suivi de la référence de la demande.', 40),
        P('vendre.confirmation.texte', 'Message après envoi : texte', 'Vous allez recevoir un e-mail de confirmation. Un conseiller {nom} étudie votre moto et vous recontacte sous 48 h ouvrées.', undefined, 260),
        P('vendre.confirmation.photo_refusee', 'Une photo non envoyée', 'Une photo n’a pas pu être envoyée ({photos}). Vous pourrez nous la transmettre en répondant à l’e-mail de confirmation.', '{photos} est remplacé par le nom du fichier.', 240),
        P('vendre.confirmation.photos_refusees', 'Plusieurs photos non envoyées', '{n} photos n’ont pas pu être envoyées ({photos}). Vous pourrez nous les transmettre en répondant à l’e-mail de confirmation.', '{n} est remplacé par le nombre de photos, {photos} par le nom des fichiers.', 240),
        L('vendre.confirmation.lien', 'Lien vers le catalogue', 'Voir nos motos en vente →', undefined, 50),
      ],
    },
    {
      titre: 'Questions fréquentes',
      textes: [
        L('vendre.faq.titre', 'Titre', 'Questions fréquentes', undefined, 50),
        ...([
          ['Combien coûte le dépôt-vente ?', 'L’estimation est gratuite. Notre rémunération est la différence entre le prix de vente et votre net vendeur : ces deux montants sont fixés ensemble et écrits dans le mandat avant toute signature. Aucun autre frais, sauf un entretien que vous auriez accepté sur devis.'],
          ['Combien de temps dure le mandat ?', 'Deux mois, en exclusivité : pendant cette période, la moto n’est pas proposée ailleurs. Il peut être prolongé par un avenant que vous signez au showroom. Les conditions d’une reprise anticipée de la moto sont précisées dans le mandat.'],
          ['Quand et comment suis-je payé ?', '{nom} encaisse le paiement de l’acheteur et vous verse votre net vendeur par virement sous 48 h. Si un acheteur renonce après avoir versé un acompte, cela n’a aucune conséquence pour vous.'],
          ['Où est ma moto pendant la vente ?', 'Au showroom de Chaville, couverte par l’assurance du garage. Aucun essai n’est réalisé sans votre accord, et le prix n’est jamais modifié sans votre accord écrit.'],
          ['Vais-je recevoir une estimation automatique ?', 'Non. Chaque moto est étudiée par un conseiller, qui vous rappelle sous 48 h ouvrées pour en parler avec vous et vous proposer un prix de vente conseillé.'],
          ['Quels documents prévoir ?', 'Pour le dépôt : la carte grise, une pièce d’identité, un certificat de non-gage de moins de 15 jours, le double des clés, et le carnet d’entretien et les factures si vous les avez. Votre RIB vous sera demandé au moment de la vente. Rien n’est demandé pour l’estimation.'],
          ['Que deviennent mes informations ?', 'Elles servent uniquement à traiter votre demande. Sans dépôt, elles sont conservées au plus 3 ans et vos photos 12 mois au plus (7 jours seulement si la demande est classée sans suite). Si vous nous confiez votre moto, le dossier est conservé 5 ans après la fin du mandat (obligations légales). Vous pouvez demander à consulter ou corriger vos données à tout moment.'],
        ] as [string, string][]).flatMap(([q, r], i) => [
          L(`vendre.faq.${i + 1}.question`, `Question ${i + 1}`, q, undefined, 90),
          P(`vendre.faq.${i + 1}.reponse`, `Réponse ${i + 1}`, r, undefined, 600),
        ]),
        L('vendre.faq.contact.avant', 'Phrase de contact : début', 'Une autre question ? Appelez-nous au', 'Suivi du numéro de téléphone (modifiable dans Édition du site).', 70),
        L('vendre.faq.contact.apres', 'Phrase de contact : fin', 'ou passez au showroom de Chaville, sur rendez-vous.', undefined, 100),
        L('vendre.faq.reprise.avant', 'Phrase vers la reprise', 'Vous préférez vendre tout de suite ?', undefined, 70),
        L('vendre.faq.reprise.lien', 'Lien vers la reprise', 'Demandez une reprise immédiate', undefined, 50),
        L('vendre.faq.reprise.apres', 'Après le lien vers la reprise', '.', undefined, 30),
      ],
    },
  ],
},
];
