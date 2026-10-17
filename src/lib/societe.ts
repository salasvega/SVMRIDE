/**
 * Informations légales de la société (admin, « Infos du site », bloc Société),
 * lues une fois par visite ; valeurs de secours (src/config/societe.ts) le temps
 * de la lecture ou si la base ne répond pas.
 */
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { CLE_SOCIETE, normaliserSociete, SOCIETE_DEFAUT, type Societe } from '../config/societe';

let courante: Societe = SOCIETE_DEFAUT;
let requete: Promise<Societe> | null = null;

export function chargerSociete(): Promise<Societe> {
  if (!supabase) return Promise.resolve(courante);
  requete ??= (async () => {
    const { data, error } = await supabase.from('site_reglages').select('valeur').eq('cle', CLE_SOCIETE).maybeSingle();
    if (error || !data) {
      if (error) console.error('Société : lecture impossible, valeurs de secours', error);
      requete = null;
      return courante;
    }
    courante = normaliserSociete(data.valeur);
    return courante;
  })();
  return requete;
}

/** Après une modification dans l'admin */
export function appliquerSociete(s: Societe) {
  courante = s;
  requete = Promise.resolve(s);
}

export function useSociete(): Societe {
  const [s, setS] = useState(courante);
  useEffect(() => {
    let actif = true;
    chargerSociete().then((v) => actif && setS(v));
    return () => {
      actif = false;
    };
  }, []);
  return s;
}
