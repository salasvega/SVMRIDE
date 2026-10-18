/**
 * Pages d'exemple dans les aperçus de l'admin (Textes du site, Studio Design…).
 *
 * Dans le cadre d'aperçu seulement :
 *  - aucun formulaire n'est vraiment envoyé : les appels aux fonctions du
 *    serveur et les enregistrements répondent par des données fictives ;
 *  - certaines pages s'affichent dans un état précis, choisi par l'adresse
 *    (?demo=…) : message après envoi, dossier de financement ouvert, espace
 *    propriétaire connecté, contrat à signer (/signature/apercu…), contrat signé.
 * Ainsi tous leurs textes sont visibles et modifiables. Les visiteurs du site
 * ne sont jamais concernés (rien n'est actif hors du cadre d'aperçu).
 */

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
/** Vrai dans le cadre d'aperçu de l'admin */
export const EN_APERCU = typeof window !== 'undefined' && window.parent !== window && !!params?.has('apercu');
const DEMO = EN_APERCU ? params?.get('demo') ?? null : null;
const DEMO_CHEMIN = typeof window !== 'undefined' ? window.location.pathname : '';

/** État d'exemple demandé pour la page affichée (null : page normale) */
export function demo(): string | null {
  return DEMO && window.location.pathname === DEMO_CHEMIN ? DEMO : null;
}

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const dans = (jours: number) => new Date(Date.now() + jours * 86_400_000).toISOString().slice(0, 10);

function contratExemple(jeton: string) {
  const avenant = jeton.includes('avenant');
  return {
    titre: avenant ? 'Avenant n° 1 au mandat de dépôt-vente' : 'Mandat de dépôt-vente exclusif',
    type: avenant ? 'avenant' : 'mandat',
    reference: 'DV-2026-0042',
    deposant: 'Jean Dupont',
    email_masque: 'j•••@exemple.fr',
    vehicule: 'Yamaha MT-07 (2021)',
    immatriculation: 'AB-123-CD',
    prix_affiche: 6490,
    net_vendeur: 5490,
    date_debut: aujourdhui(),
    date_fin: dans(61),
    duree_mois: 2,
    frais_resiliation: 290,
    gardiennage_par_jour: 50,
    gardiennage_delai_jours: 7,
    avenant: avenant ? { ancienne_date_fin: dans(10), nouvelle_date_fin: dans(71), prix_modifie: true } : null,
    empreinte: '3f9a1c7e5b2d8f604a1e9c3b7d5f2a8e6c4b1d9f7a3e5c2b8d6f4a1c9e7b3d5f',
    expire_le: dans(7),
    code_envoye: jeton.includes('code'),
  };
}

function dossierProprietaire() {
  const il = (j: number) => new Date(Date.now() - j * 86_400_000).toISOString();
  return {
    email: 'client@exemple.fr',
    dossiers: [{
      id: 'apercu', reference: 'DV-2026-0042', marque: 'Yamaha', modele: 'MT-07', version: 'Pure', annee: 2021,
      immatriculation: 'AB-123-CD', prix_affiche: 6490, net_vendeur: 5490, date_debut: aujourdhui(), date_fin: dans(52),
      statut_mandat: 'actif', statut_vente: 'en_ligne', vendu_le: null, paye_le: null, frais_resiliation: 290,
      annonce: '/vehicules', photo: null, a_signer: false,
      fil: [
        { fait_le: il(1), type: 'visite', titre: 'Visite d’un acheteur intéressé', detail: 'Essai prévu samedi.', montant: null },
        { fait_le: il(4), type: 'publication', titre: 'Annonce en ligne', detail: null, montant: null },
        { fait_le: il(8), type: 'mandat', titre: 'Mandat signé', detail: null, montant: null },
      ],
      documents: [{ type: 'mandat_signe', nom: 'Mandat signé DV-2026-0042.pdf', chemin: 'apercu', ajoute_le: il(8) }],
      demandes: [{ id: 'd1', cree_le: il(2), type: 'question', message: 'Des nouvelles des visites ?', statut: 'terminee', reponse: 'Oui, un essai est prévu samedi.' }],
    }],
  };
}

/** Réponse fictive d'une fonction du serveur */
function reponseFonction(fonction: string, corps: Record<string, unknown>): unknown {
  const action = String(corps.action ?? '');
  switch (fonction) {
    case 'depot-signature':
      if (action === 'ouvrir') return { contrat: contratExemple(String(corps.jeton ?? '')), pdf: null };
      if (action === 'signer') return { pdf: null, signe_le: new Date().toISOString() };
      return { ok: true };
    case 'depot-proprietaire':
      if (action === 'code') return { message: 'Un code vous a été envoyé (exemple).' };
      if (action === 'connexion') return { session: 'apercu', heures: 1 };
      if (action === 'dossiers') return dossierProprietaire();
      if (action === 'document') return { url: '#' };
      return { ok: true };
    case 'financing-dossier':
      if (action === 'create') return { code: 'K7P2QX', session: 'apercu', profile: {} };
      if (action === 'open' || action === 'reopen' || action === 'save' || action === 'attach') return { session: 'apercu', profile: action === 'reopen' ? { status: 'draft' } : {} };
      if (action === 'submit') return { profile: { status: 'submitted' } };
      if (action === 'file-urls') return { urls: {} };
      if (action === 'upload-url') return { path: 'apercu/fichier', token: 'apercu' };
      return { ok: true };
    case 'depot-demande':
      return { reference: 'DV-2026-0042', envois: [] };
    default:
      return { success: true };
  }
}

const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json' } });

/** Interception des envois dans le cadre d'aperçu (appelé au démarrage du site) */
export function demarrerDemo() {
  if (!EN_APERCU) return;
  // Espace propriétaire connecté (Suivre ma vente)
  if (demo() === 'connecte') {
    try {
      sessionStorage.setItem('svm-suivi-vente', JSON.stringify({ jeton: 'apercu', expire: Date.now() + 3_600_000 }));
    } catch { /* sans stockage : écran de connexion */ }
  }
  const origine = window.fetch.bind(window);
  window.fetch = async (entree: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entree === 'string' ? entree : entree instanceof URL ? entree.href : entree.url;
    const methode = (init?.method ?? (entree instanceof Request ? entree.method : 'GET')).toUpperCase();
    const fonction = url.match(/\/functions\/v1\/([a-z0-9-]+)/)?.[1];
    if (fonction) {
      let corps: Record<string, unknown> = {};
      try {
        corps = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      } catch { /* corps non lisible */ }
      await new Promise((r) => setTimeout(r, 400));
      return json(reponseFonction(fonction, corps));
    }
    // Enregistrements et fichiers : jamais envoyés depuis un aperçu
    if (methode !== 'GET' && methode !== 'HEAD' && /\/(rest|storage)\/v1\//.test(url) && !url.includes('/rest/v1/rpc/')) {
      await new Promise((r) => setTimeout(r, 300));
      return /\/storage\/v1\//.test(url) ? json({ Key: 'apercu' }) : new Response(null, { status: 201 });
    }
    return origine(entree, init);
  };
}
