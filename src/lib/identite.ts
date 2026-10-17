/**
 * Logo et icône du site (admin, « Infos du site ») lus une fois par visite.
 * La dernière valeur est gardée dans le navigateur pour un affichage immédiat.
 * Les balises d'icônes du <head> sont posées par la fonction Netlify « seo » ;
 * appliquerIconesPage() les met aussi à jour dans la page ouverte (aperçu,
 * changement fait dans l'admin).
 */
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { CLE_IDENTITE, IDENTITE_DEFAUT, icones, normaliserIdentite, URL_MANIFESTE, type Identite } from '../config/identite';

const MEMOIRE = 'svm-identite';

function memorisee(): Identite {
  try {
    const brut = localStorage.getItem(MEMOIRE);
    if (brut) return normaliserIdentite(JSON.parse(brut));
  } catch {
    // sans stockage : logo d'origine
  }
  return IDENTITE_DEFAUT;
}

let courante: Identite = memorisee();
let requete: Promise<Identite> | null = null;
const abonnes = new Set<(i: Identite) => void>();

/** Met à jour les icônes de l'onglet ouvert */
export function appliquerIconesPage(id: Identite) {
  if (typeof document === 'undefined') return;
  const x = icones(id);
  const lien = (selecteur: string, href: string) => {
    const el = document.head.querySelector<HTMLLinkElement>(selecteur);
    if (el && el.getAttribute('href') !== href) el.setAttribute('href', href);
  };
  lien('link[rel="icon"][sizes="48x48"]', x.favicon_48);
  lien('link[rel="icon"][sizes="32x32"]', x.favicon_32);
  lien('link[rel="apple-touch-icon"]', x.apple_180);
  lien('link[rel="manifest"]', id.icone ? URL_MANIFESTE : '/site.webmanifest');
}

function publier(i: Identite) {
  courante = i;
  try {
    localStorage.setItem(MEMOIRE, JSON.stringify(i));
  } catch {
    // sans importance
  }
  appliquerIconesPage(i);
  abonnes.forEach((f) => f(i));
}

export function chargerIdentite(): Promise<Identite> {
  if (!supabase) return Promise.resolve(courante);
  requete ??= (async () => {
    const { data, error } = await supabase.from('site_reglages').select('valeur').eq('cle', CLE_IDENTITE).maybeSingle();
    if (error) {
      console.error('Identité : lecture impossible, dernières valeurs connues', error);
      requete = null;
      return courante;
    }
    publier(normaliserIdentite(data?.valeur));
    return courante;
  })();
  return requete;
}

/** Après une modification dans l'admin */
export function appliquerIdentite(i: Identite) {
  requete = Promise.resolve(i);
  publier(i);
}

export function useIdentite(): Identite {
  const [i, setI] = useState(courante);
  useEffect(() => {
    abonnes.add(setI);
    chargerIdentite();
    setI(courante);
    return () => {
      abonnes.delete(setI);
    };
  }, []);
  return i;
}

export const BUCKET_SITE = 'site-images';

/** Enregistre le réglage « identite » (historique automatique) et l'applique au site ouvert */
export async function enregistrerIdentite(valeur: Identite): Promise<boolean> {
  const { error } = await supabase.from('site_reglages').upsert({ cle: CLE_IDENTITE, valeur });
  if (error) return false;
  appliquerIdentite(valeur);
  return true;
}
