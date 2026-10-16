/**
 * Liste centrale des marques présentées dans « Explorez les marques » (accueil).
 *
 * Pour ajouter une marque : ajouter une ligne ci-dessous. Pour la retirer du
 * carrousel sans la supprimer : `actif: false`.
 *
 * - id     : identifiant unique, utilisé dans l'URL du catalogue (/vehicules?brand=<id>)
 * - nom    : nom d'affichage
 * - alias  : autres écritures possibles dans le catalogue (« BMW » pour « BMW Motorrad »…).
 *            La comparaison ignore déjà la casse, les accents, les espaces et les tirets.
 * - pays   : pays d'origine de la marque, affiché sous le nom
 * - logo   : facultatif, chemin d'un fichier SVG/WebP placé dans /public/marques/
 *            (logo issu du kit presse officiel ou d'une source autorisée). Sans logo,
 *            le nom est affiché en lettres.
 */
export interface Marque {
  id: string;
  nom: string;
  alias?: string[];
  pays: string;
  logo?: string;
  actif: boolean;
}

export const MARQUES: Marque[] = [
  // Japon
  { id: 'honda', nom: 'Honda', pays: 'Japon', actif: true },
  { id: 'yamaha', nom: 'Yamaha', alias: ['Yamaha Motor'], pays: 'Japon', actif: true },
  { id: 'kawasaki', nom: 'Kawasaki', pays: 'Japon', actif: true },
  { id: 'suzuki', nom: 'Suzuki', pays: 'Japon', actif: true },
  // Europe
  { id: 'bmw', nom: 'BMW Motorrad', alias: ['BMW'], pays: 'Allemagne', actif: true },
  { id: 'ducati', nom: 'Ducati', pays: 'Italie', actif: true },
  { id: 'triumph', nom: 'Triumph', pays: 'Royaume-Uni', actif: true },
  { id: 'ktm', nom: 'KTM', pays: 'Autriche', actif: true },
  { id: 'aprilia', nom: 'Aprilia', pays: 'Italie', actif: true },
  { id: 'moto-guzzi', nom: 'Moto Guzzi', alias: ['Guzzi'], pays: 'Italie', actif: true },
  { id: 'mv-agusta', nom: 'MV Agusta', alias: ['Agusta'], pays: 'Italie', actif: true },
  { id: 'husqvarna', nom: 'Husqvarna', alias: ['Husqvarna Motorcycles'], pays: 'Suède', actif: true },
  { id: 'gasgas', nom: 'GasGas', pays: 'Espagne', actif: true },
  { id: 'beta', nom: 'Beta', pays: 'Italie', actif: true },
  { id: 'sherco', nom: 'Sherco', pays: 'France', actif: true },
  // Amérique
  { id: 'harley-davidson', nom: 'Harley-Davidson', alias: ['Harley'], pays: 'États-Unis', actif: true },
  { id: 'indian', nom: 'Indian Motorcycle', alias: ['Indian'], pays: 'États-Unis', actif: true },
  { id: 'zero', nom: 'Zero Motorcycles', alias: ['Zero'], pays: 'États-Unis', actif: true },
  // Autres
  { id: 'royal-enfield', nom: 'Royal Enfield', alias: ['Enfield'], pays: 'Inde', actif: true },
  { id: 'benelli', nom: 'Benelli', pays: 'Italie', actif: true },
  { id: 'cfmoto', nom: 'CFMOTO', pays: 'Chine', actif: true },
  { id: 'bsa', nom: 'BSA', pays: 'Royaume-Uni', actif: true },
  { id: 'voge', nom: 'Voge', pays: 'Chine', actif: true },
  { id: 'zontes', nom: 'Zontes', pays: 'Chine', actif: true },
  { id: 'qjmotor', nom: 'QJMotor', pays: 'Chine', actif: true },
  { id: 'mash', nom: 'Mash', pays: 'France', actif: true },
  { id: 'fantic', nom: 'Fantic', pays: 'Italie', actif: true },
];

/** « Harley-Davidson », « harley davidson », « HARLEY DAVIDSON » → « harleydavidson ». */
export function normaliser(texte: string): string {
  return (texte ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const PAR_ID = new Map(MARQUES.map((m) => [m.id, m]));
const INDEX = new Map<string, string>();
for (const m of MARQUES) {
  for (const ecriture of [m.id, m.nom, ...(m.alias ?? [])]) INDEX.set(normaliser(ecriture), m.id);
}

/**
 * Identifiant de marque à partir de ce qui est saisi dans le catalogue ou l'URL
 * (« YAMAHA », « Yamaha  », « yamaha » → « yamaha »). Une marque absente de la
 * liste garde sa forme normalisée, pour rester filtrable.
 */
export function cleMarque(brut: string | null | undefined): string {
  const n = normaliser(brut ?? '');
  return INDEX.get(n) ?? n;
}

export function marqueParId(id: string): Marque | undefined {
  return PAR_ID.get(id);
}

/** Nom d'affichage : celui de la liste, sinon le nom saisi, nettoyé (« PEUGEOT » → « Peugeot »). */
export function nomMarque(brut: string | null | undefined): string {
  const connue = PAR_ID.get(cleMarque(brut));
  if (connue) return connue.nom;
  const t = (brut ?? '').trim().replace(/\s+/g, ' ');
  if (t.length > 3 && t === t.toUpperCase()) {
    return t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep, l) => sep + l.toUpperCase());
  }
  return t;
}
