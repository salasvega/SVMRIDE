/**
 * Studio Design (admin) : lecture et enregistrement des thèmes dans Supabase.
 * Tables design_themes et design_publications, fonctions publier_theme() et
 * restaurer_version() (voir supabase/migrations/20261018020000_studio_design.sql).
 */
import { supabase } from './supabase';
import { themeValide, type ThemeConfig } from '../config/design';

export type Statut = 'brouillon' | 'enregistre' | 'archive';

export interface ThemeLigne {
  id: string;
  nom: string;
  description: string;
  predefini: boolean;
  ordre: number;
  origine_id: string | null;
  statut: Statut;
  config: ThemeConfig;
  cree_par: string | null;
  maj_par: string | null;
  created_at: string;
  updated_at: string;
}

export interface Publication {
  version: number;
  theme_id: string | null;
  theme_nom: string;
  config: ThemeConfig;
  type: 'installation' | 'publication' | 'restauration';
  restaure_version: number | null;
  publie_par: string | null;
  publie_le: string;
}

export interface ThemeEnLigne {
  version: number;
  theme_id: string | null;
  nom: string;
  config: ThemeConfig;
}

const COLONNES = 'id, nom, description, predefini, ordre, origine_id, statut, config, cree_par, maj_par, created_at, updated_at';

/** Message clair pour les erreurs renvoyées par la base (déclencheurs, droits) */
export function messageErreur(e: unknown, defaut: string): string {
  const m = (e as { message?: string })?.message ?? '';
  if (/prédéfinis|thème actif|Réservé|introuvable|Studio Design/.test(m)) return m;
  return defaut;
}

export async function chargerStudio(): Promise<{ themes: ThemeLigne[]; publications: Publication[]; enLigne: ThemeEnLigne | null }> {
  const [t, p, r] = await Promise.all([
    supabase.from('design_themes').select(COLONNES).order('predefini', { ascending: false }).order('ordre').order('updated_at', { ascending: false }),
    supabase.from('design_publications').select('*').order('version', { ascending: false }).limit(100),
    supabase.from('site_reglages').select('valeur').eq('cle', 'theme').maybeSingle(),
  ]);
  if (t.error) throw t.error;
  if (p.error) throw p.error;
  const v = r.data?.valeur as Partial<ThemeEnLigne> | undefined;
  return {
    themes: (t.data as ThemeLigne[]).filter((x) => themeValide(x.config)),
    publications: (p.data as Publication[]) ?? [],
    enLigne: v && themeValide(v.config) ? { version: Number(v.version), theme_id: v.theme_id ?? null, nom: v.nom ?? '', config: v.config } : null,
  };
}

export async function creerTheme(
  champs: Pick<ThemeLigne, 'nom' | 'description' | 'config' | 'statut'> & { origine_id?: string | null },
): Promise<ThemeLigne> {
  const { data, error } = await supabase.from('design_themes').insert(champs).select(COLONNES).single();
  if (error) throw error;
  return data as ThemeLigne;
}

export async function modifierTheme(id: string, champs: Partial<Pick<ThemeLigne, 'nom' | 'description' | 'config' | 'statut'>>): Promise<ThemeLigne> {
  const { data, error } = await supabase.from('design_themes').update(champs).eq('id', id).select(COLONNES).single();
  if (error) throw error;
  return data as ThemeLigne;
}

export async function supprimerTheme(id: string): Promise<void> {
  const { error } = await supabase.from('design_themes').delete().eq('id', id);
  if (error) throw error;
}

export async function publierTheme(id: string): Promise<number> {
  const { data, error } = await supabase.rpc('publier_theme', { p_theme: id });
  if (error) throw error;
  return Number(data);
}

export async function restaurerVersion(version: number): Promise<number> {
  const { data, error } = await supabase.rpc('restaurer_version', { p_version: version });
  if (error) throw error;
  return Number(data);
}

/** Une moto en vente, pour l'aperçu d'une fiche */
export async function slugExemple(): Promise<string | null> {
  const { data } = await supabase.from('vehicles').select('slug').eq('available', true).order('updated_at', { ascending: false }).limit(1);
  return (data?.[0] as { slug?: string } | undefined)?.slug ?? null;
}
