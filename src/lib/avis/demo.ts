/**
 * DONNÉES DE DÉMONSTRATION — avis FICTIFS.
 * Utilisés uniquement en local et dans les aperçus Netlify, jamais sur
 * svmride.com (voir source.ts). Les noms portent la mention « (démo) ».
 */
import type { ResumeAvis } from './types';

const ilYa = (jours: number) => new Date(Date.now() - jours * 86_400_000).toISOString();

export const AVIS_DEMO: ResumeAvis = {
  source: 'demo',
  noteMoyenne: 4.7,
  nombreAvis: 58,
  synchroniseLe: new Date().toISOString(),
  avis: [
    {
      id: 'demo-1',
      auteur: 'Julien R. (démo)',
      note: 5,
      texte:
        "Accueil au top et conseils honnêtes. J'hésitais entre deux roadsters, on m'a laissé le temps d'essayer et de comparer sans aucune pression. La moto a été livrée révisée, avec l'historique d'entretien complet. Je recommande sans hésiter : on sent que l'équipe aime vraiment les motos et prend le temps d'expliquer chaque détail, du financement à la mise en main.",
      publieLe: ilYa(6),
    },
    { id: 'demo-2', auteur: 'Sarah B. (démo)', note: 5, texte: 'Reprise de mon scooter rapide et au juste prix, virement reçu le jour même.', publieLe: ilYa(19) },
    { id: 'demo-3', auteur: 'Karl M. (démo)', note: 4, texte: "Très bon contact. Petit délai pour la carte grise, mais on m'a tenu informé à chaque étape.", publieLe: ilYa(33) },
    { id: 'demo-4', auteur: 'Nadia T. (démo)', note: 5, publieLe: ilYa(47) },
    {
      id: 'demo-5',
      auteur: 'Pierre-Yves L. (démo)',
      note: 3,
      texte: "Moto conforme à l'annonce et bon suivi. J'aurais aimé un peu plus de souplesse sur le prix, mais la transaction s'est bien passée.",
      publieLe: ilYa(71),
    },
    { id: 'demo-6', auteur: 'Inès V. (démo)', note: 5, texte: 'Dossier de financement monté en deux jours, tout expliqué clairement. Merci !', publieLe: ilYa(96) },
  ],
};
