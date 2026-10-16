import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { cleMarque } from '../config/marques';
import { statutDe } from '../utils/vehicle-filters';
import type { VehicleStatus } from '../types/vehicle';

/** Délai au-delà duquel on affiche les marques sans pastille plutôt que d'attendre. */
const DELAI_MAX_MS = 4000;

export interface StockMarques {
  /** La réponse est arrivée (ou on a renoncé à l'attendre). */
  pret: boolean;
  /** Identifiants des marques ayant au moins une moto en vente ; null si inconnu (Supabase injoignable). */
  enStock: Set<string> | null;
  /** Nom saisi dans le catalogue pour chaque marque en stock (sert aux marques absentes de la liste). */
  nomsCatalogue: Map<string, string>;
}

/**
 * Marques en stock, en une seule requête : motos publiées (`available`) dont le
 * statut est « disponible » (mêmes règles que le catalogue ; réservées et vendues
 * exclues). Lu une fois au chargement de la page : le classement ne bouge pas
 * pendant que le visiteur manipule le carrousel.
 */
export function useStockMarques(): StockMarques {
  const [etat, setEtat] = useState<StockMarques>({ pret: false, enStock: null, nomsCatalogue: new Map() });

  useEffect(() => {
    let fini = false;
    const renoncer = () => {
      if (fini) return;
      fini = true;
      setEtat({ pret: true, enStock: null, nomsCatalogue: new Map() });
    };
    const minuteur = window.setTimeout(renoncer, DELAI_MAX_MS);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('brand,status')
          .eq('available', true);
        if (fini) return;
        if (error || !data) return renoncer();
        const enStock = new Set<string>();
        const nomsCatalogue = new Map<string, string>();
        for (const v of data as { brand: string; status: VehicleStatus }[]) {
          if (!v.brand || statutDe(v) !== 'available') continue;
          const cle = cleMarque(v.brand);
          enStock.add(cle);
          if (!nomsCatalogue.has(cle)) nomsCatalogue.set(cle, v.brand);
        }
        fini = true;
        window.clearTimeout(minuteur);
        setEtat({ pret: true, enStock, nomsCatalogue });
      } catch {
        renoncer();
      }
    })();

    return () => {
      fini = true;
      window.clearTimeout(minuteur);
    };
  }, []);

  return etat;
}
