/**
 * Coordonnées du site (contact, showroom, horaires) lues dans Supabase : une
 * seule lecture par visite, partagée par toutes les pages.
 *
 * Pour un affichage immédiat, la dernière valeur lue est gardée dans le
 * navigateur ; à la toute première visite, ce sont les valeurs de secours
 * (src/config/coordonnees.ts) qui s'affichent le temps de la lecture.
 */
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { CLE_COORDONNEES, COORDONNEES_DEFAUT, normaliserCoordonnees, type Coordonnees } from '../config/coordonnees';

const MEMOIRE = 'svm-coordonnees';

function memorisees(): Coordonnees {
  try {
    const brut = localStorage.getItem(MEMOIRE);
    if (brut) return normaliserCoordonnees(JSON.parse(brut));
  } catch {
    // navigateur sans stockage : valeurs de secours
  }
  return COORDONNEES_DEFAUT;
}

let courantes: Coordonnees = memorisees();
let requete: Promise<Coordonnees> | null = null;
const abonnes = new Set<(c: Coordonnees) => void>();

export function chargerCoordonnees(): Promise<Coordonnees> {
  if (!supabase) return Promise.resolve(courantes);
  requete ??= (async () => {
    const { data, error } = await supabase.from('site_reglages').select('valeur').eq('cle', CLE_COORDONNEES).maybeSingle();
    if (error || !data) {
      if (error) console.error('Coordonnées : lecture impossible, dernières valeurs connues affichées', error);
      requete = null;
      return courantes;
    }
    courantes = normaliserCoordonnees(data.valeur);
    try {
      localStorage.setItem(MEMOIRE, JSON.stringify(courantes));
    } catch {
      // sans importance
    }
    abonnes.forEach((f) => f(courantes));
    return courantes;
  })();
  return requete;
}

/** Après une modification dans l'admin */
export function appliquerCoordonnees(c: Coordonnees) {
  courantes = c;
  requete = Promise.resolve(c);
  try {
    localStorage.setItem(MEMOIRE, JSON.stringify(c));
  } catch {
    // sans importance
  }
  abonnes.forEach((f) => f(c));
}

/** Coordonnées à jour (jamais vides : dernières connues ou valeurs de secours) */
export function useCoordonnees(): Coordonnees {
  const [c, setC] = useState(courantes);
  useEffect(() => {
    abonnes.add(setC);
    chargerCoordonnees();
    setC(courantes);
    return () => {
      abonnes.delete(setC);
    };
  }, []);
  return c;
}
