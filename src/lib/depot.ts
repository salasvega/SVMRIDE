/**
 * Dépôt-vente : types, libellés et appels aux fonctions serveur
 * (depot-admin, depot-signature, depot-proprietaire).
 *
 * Règles métier (réponses de Mattia, 16/10/2026) : mandat exclusif de 2 mois,
 * SVM rachète la moto au moment de la vente, le déposant perçoit le « net
 * vendeur » sous 48 h, rémunération d'environ 10 % (1 000 € minimum, 1 500 € en
 * moyenne, jusqu'à 2 000 € au-delà de 20 000 €), jamais affichée publiquement.
 */
import { supabase } from './supabase';

export type StatutMandat = 'preparation' | 'a_signer' | 'actif' | 'vendu' | 'resilie' | 'expire' | 'cloture';
export type StatutVente = 'a_publier' | 'en_ligne' | 'reservee' | 'vendue' | 'preparation' | 'livree' | 'payee';

export interface EtatDesLieux {
  fait_le?: string;
  /** Heure de l'état des lieux, « HH:MM » (ajoutée le 17/10/2026) */
  heure?: string;
  kilometrage?: number | null;
  etat?: string;
  accessoires?: string;
  cles?: string;
  remarques?: string;
}

export interface Dossier {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  demande_id: string | null;
  vehicle_id: string | null;
  prop_civilite: 'M.' | 'Mme' | null;
  prop_prenom: string;
  prop_nom: string;
  prop_email: string;
  prop_telephone: string;
  prop_adresse: string | null;
  prop_piece_type: 'cni' | 'passeport' | 'titre_sejour' | 'permis' | null;
  prop_piece_numero: string | null;
  marque: string;
  modele: string;
  version: string | null;
  annee: number | null;
  kilometrage: number | null;
  immatriculation: string | null;
  vin: string | null;
  date_mise_circulation: string | null;
  prix_affiche: number | null;
  net_vendeur: number | null;
  duree_mois: number;
  date_debut: string | null;
  date_fin: string | null;
  frais_resiliation: number;
  gardiennage_par_jour: number;
  gardiennage_delai_jours: number;
  statut_mandat: StatutMandat;
  statut_vente: StatutVente;
  pieces: Record<string, { recu?: boolean; le?: string }>;
  etat_des_lieux: EtatDesLieux | null;
  notes_internes: string | null;
  vendu_le: string | null;
  prix_vente: number | null;
  paye_le: string | null;
  cloture_le: string | null;
}

export const MANDAT: Record<StatutMandat, { libelle: string; classe: string }> = {
  preparation: { libelle: 'En préparation', classe: 'bg-gray-100 text-gray-800 border-gray-300' },
  a_signer: { libelle: 'Contrat à signer', classe: 'bg-amber-50 text-amber-800 border-amber-200' },
  actif: { libelle: 'Mandat en cours', classe: 'bg-blue-50 text-blue-800 border-blue-200' },
  vendu: { libelle: 'Vendu', classe: 'bg-green-50 text-green-800 border-green-200' },
  resilie: { libelle: 'Repris par le déposant', classe: 'bg-red-50 text-red-800 border-red-200' },
  expire: { libelle: 'Mandat échu', classe: 'bg-orange-50 text-orange-800 border-orange-200' },
  cloture: { libelle: 'Clôturé', classe: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const VENTE: Record<StatutVente, string> = {
  a_publier: 'À publier',
  en_ligne: 'Annonce en ligne',
  reservee: 'Réservée',
  vendue: 'Vendue',
  preparation: 'En préparation',
  livree: 'Livrée',
  payee: 'Déposant payé',
};
export const ORDRE_VENTE: StatutVente[] = ['a_publier', 'en_ligne', 'reservee', 'vendue', 'preparation', 'livree', 'payee'];

/** Pièces du dossier (les 4 premières sont exigées avant la signature du mandat) */
export const PIECES: { cle: string; libelle: string; obligatoire: boolean; aide?: string }[] = [
  { cle: 'carte_grise', libelle: 'Carte grise', obligatoire: true },
  { cle: 'piece_identite', libelle: "Pièce d'identité", obligatoire: true },
  { cle: 'non_gage', libelle: 'Certificat de non-gage', obligatoire: true, aide: 'Moins de 15 jours' },
  { cle: 'double_cles', libelle: 'Double des clés', obligatoire: true },
  { cle: 'carnet_entretien', libelle: "Carnet d'entretien / factures", obligatoire: false, aide: 'Le cas échéant' },
  { cle: 'rib', libelle: 'RIB', obligatoire: false, aide: 'Au moment de la vente' },
];

export const TYPES_DOCUMENT: Record<string, string> = {
  carte_grise: 'Carte grise', piece_identite: "Pièce d'identité", non_gage: 'Non-gage', double_cles: 'Double des clés',
  carnet_entretien: 'Entretien / factures', rib: 'RIB', etat_des_lieux: 'État des lieux', photo: 'Photo',
  contrat: 'Contrat', contrat_signe: 'Contrat signé', preuve: 'Preuve', autre: 'Autre',
};

export const DEMANDES_PROPRIETAIRE: Record<string, string> = {
  rappel: 'Être rappelé',
  prolongation: 'Prolonger le mandat',
  reprise_anticipee: 'Reprendre ma moto',
  baisse_prix: 'Changer le prix',
  question: 'Question',
};
export const STATUTS_DEMANDE: Record<string, string> = {
  nouvelle: 'Nouvelle', en_cours: 'En cours', acceptee: 'Acceptée', refusee: 'Refusée', terminee: 'Traitée',
};

/**
 * Rémunération conseillée (indicative) : ~10 % du prix affiché, arrondie à 50 €,
 * au moins 1 000 €, au plus 1 500 € (2 000 € au-delà de 20 000 €).
 */
export function remunerationConseillee(prix: number): number {
  if (!(prix > 0)) return 0;
  const brute = Math.round((prix * 0.1) / 50) * 50;
  return Math.min(Math.max(brute, 1000), prix > 20000 ? 2000 : 1500);
}

export const euros = (n: number | null | undefined) =>
  n == null ? '—' : `${Math.round(n).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} €`;
export const jour = (iso: string | null | undefined) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
export const dateHeure = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export const aujourdhui = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
/** Heure actuelle à Paris, « HH:MM » */
export const maintenantHeure = () => new Date().toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
/** « 14:30 » → « 14 h 30 » */
export const heureFr = (h: string | null | undefined) => (h && /^\d{2}:\d{2}/.test(h) ? `${h.slice(0, 2)} h ${h.slice(3, 5)}` : '');

/** Jours restants avant la fin du mandat (négatif : dépassé) */
export function joursRestants(dateFin: string | null): number | null {
  if (!dateFin) return null;
  const fin = new Date(`${dateFin}T12:00:00Z`).getTime();
  const auj = new Date(`${aujourdhui()}T12:00:00Z`).getTime();
  return Math.round((fin - auj) / 86_400_000);
}

export class ErreurDepot extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const URL = import.meta.env.VITE_SUPABASE_URL as string;
const CLE = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function appel<T>(fonction: string, corps: Record<string, unknown>, jeton?: string): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${URL}/functions/v1/${fonction}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CLE, ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
      body: JSON.stringify(corps),
    });
  } catch {
    throw new ErreurDepot(0, 'reseau', 'Connexion impossible. Vérifiez votre connexion internet et réessayez.');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErreurDepot(r.status, j.error ?? 'serveur', j.message ?? 'Une erreur est survenue. Réessayez dans un instant.');
  return j as T;
}

/** Fonction réservée à l'administration (jeton de la session admin) */
export async function appelAdmin<T = Record<string, unknown>>(action: string, donnees: Record<string, unknown> = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  return appel<T>('depot-admin', { action, ...donnees }, data.session?.access_token);
}

export const appelSignature = <T = Record<string, unknown>>(action: string, donnees: Record<string, unknown>) =>
  appel<T>('depot-signature', { action, ...donnees });

export const appelProprietaire = <T = Record<string, unknown>>(action: string, donnees: Record<string, unknown> = {}, session?: string) =>
  appel<T>('depot-proprietaire', { action, ...donnees }, session);

export const messageErreur = (e: unknown) =>
  e instanceof ErreurDepot ? e.message : e instanceof Error && e.message ? e.message : 'Une erreur est survenue.';
