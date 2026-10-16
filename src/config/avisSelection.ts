/**
 * Sélection d'avis Google RÉELS, recopiés mot pour mot depuis la fiche SVM Ride,
 * affichés en attendant la synchronisation automatique par l'API Google.
 *
 * Règle de choix : les 5 avis les plus récents au moment du relevé (tri « Avis les
 * plus récents » de Google Maps), sans filtrer selon la note.
 * - Texte : jamais modifié (fautes comprises).
 * - Auteur : prénom + initiale du nom public Google (pseudonyme gardé tel quel).
 * - Date : Google n'affiche qu'une date relative (« il y a 2 semaines ») ; on indique
 *   la période correspondante au jour du relevé.
 * Quand l'API Google est active (AVIS_GOOGLE.actif), cette sélection n'est plus utilisée.
 * Pour la retirer : vider le tableau AVIS_SELECTION.avis.
 */
import type { Avis } from '../lib/avis/types';

export const AVIS_SELECTION: { releveLe: string; avis: Avis[] } = {
  releveLe: '2026-10-17',
  avis: [
    {
      id: 'Ci9DQUlRQUNvZENodHljRjlvT2xCbFJXVjNjMFkyYjFvMVRXSm5TMGhQUVdsc2EyYxAB',
      auteur: 'Clement L.',
      note: 5,
      texte:
        "Expérience au top !\nJe viens d'acheter une superbe Streetfighter 848 chez eux en y laissant ma Ténéré en dépôt vente.\nExpérience parfaite de A à Z, Mattia est sympa, réactif, très bon conseiller et très pro, je recommande fortement !\nA bientôt !\nUn Client heureux.",
      publieLe: '2026-10-15',
      dateLibelle: 'Octobre 2026',
    },
    {
      id: 'Ci9DQUlRQUNvZENodHljRjlvT25NdGVsWkViMTlST0VwMU5qUlFWa05JYVZCd1MxRRAB',
      auteur: 'Vimax 93',
      note: 5,
      texte: "J'ai été très bien accueilli par Mattia, personne très agréable encore merci à toi pour ton professionnalisme.",
      publieLe: '2026-10-03',
      dateLibelle: 'Fin sept. – début oct. 2026',
    },
    {
      id: 'Ci9DQUlRQUNvZENodHljRjlvT25KSk1VNXVTSEV4TlhGeFpqUjZabGRzVGtvM1VtYxAB',
      auteur: 'Kevin M.',
      note: 5,
      texte:
        "Je recommande vivement Mattia ! Tout s’est parfaitement bien passé, de la vente jusqu’à la livraison de la moto. Échanges sérieux, rapides et transparents, avec un vrai suivi tout au long de la transaction. La moto était conforme à la description et la livraison s’est déroulée sans aucun problème.\n\nMerci encore à Mattia pour son professionnalisme et son sérieux. Je n’hésiterai pas à repasser par lui pour un prochain achat !",
      publieLe: '2026-10-03',
      dateLibelle: 'Fin sept. – début oct. 2026',
    },
    {
      id: 'Ci9DQUlRQUNvZENodHljRjlvT2tOa00wWjVkVVl4Ukc5bFJqbHNVMWRrYjFOWU0wRRAB',
      auteur: 'Alexis F.',
      note: 5,
      texte:
        "Bonjour, pris en charge par Mattia pour le rachat de mon véhicule. Très commercial au final nous sommes repartis avec une nouvelle moto. 100% confiant bien que c'était la 1er fois pour moi de faire un rachat de moto sans de base en racheter une. En tout cas je recommande fortement cette société pour le rachat de vos motos sans hésiter. Est sacher aussi que vous avez l'argent en instantané sur votre compte bancaire pour ceux qui se pose la question. Un accueil chaleureux et vraiment professionnels.",
      publieLe: '2026-10-03',
      dateLibelle: 'Fin sept. – début oct. 2026',
    },
    {
      id: 'Ci9DQUlRQUNvZENodHljRjlvT2taT2JXZFZSRWhDUWs1TVREY3dWVmcyUlZsaFNHYxAB',
      auteur: 'Boris M.',
      note: 5,
      texte: 'Très bonne expérience avec SVM, réponse rapide, reprise de mon scooter sous 48h, tout était parfait. Je recommande.',
      publieLe: '2026-10-03',
      dateLibelle: 'Fin sept. – début oct. 2026',
    },
  ],
};
