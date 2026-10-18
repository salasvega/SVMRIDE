/**
 * Studio Design — miniature de la page d'accueil dessinée avec les couleurs
 * d'un thème (sections personnalisées comprises). Sert aux cartes de la
 * bibliothèque et à l'aperçu immédiat de l'éditeur.
 */
import type { CSSProperties } from 'react';
import { variablesDuTheme, type CleSection, type ThemeConfig } from '../../../config/design';
import { couleursMiniature } from './outils';

type Vars = Record<string, string>;


const ligne = (couleur: string, largeur: string, hauteur = 4): CSSProperties => ({
  background: couleur, width: largeur, height: hauteur, borderRadius: 2,
});

function Bouton({ v, plein, petit }: { v: Vars; plein: boolean; petit?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: petit ? '3px 7px' : '5px 10px',
        fontSize: petit ? 7 : 9,
        fontWeight: 600,
        lineHeight: 1.2,
        borderRadius: `min(${v['rayon-bouton']}, 99px)`,
        background: plein ? v.bleu : v.surface,
        color: plein ? v['sur-bouton'] : v.noir,
        border: `1.5px solid ${plein ? 'transparent' : v.or}`,
        boxShadow: plein ? v['ombre-bleu'] : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {plein ? 'Voir les motos' : 'Contact'}
    </span>
  );
}

function Carte({ v, petit }: { v: Vars; petit?: boolean }) {
  return (
    <div style={{ background: v.surface, borderRadius: `calc(${v['rayon-carte-moto']} / 2)`, boxShadow: v['ombre-vehicule'], overflow: 'hidden', border: `1px solid ${v.bordure}` }}>
      <div style={{ height: petit ? 26 : 44, background: `linear-gradient(135deg, ${v['noir-profond']}, ${v['gris-texte']})`, position: 'relative' }}>
        <span style={{ position: 'absolute', right: 4, top: 4, background: v.surface, border: `1px solid ${v.or}`, borderRadius: 99, fontSize: 6, padding: '1px 4px', color: v.noir, fontWeight: 700 }}>9 990 €</span>
      </div>
      <div style={{ padding: petit ? 5 : 7, display: 'grid', gap: 4 }}>
        <div style={ligne(v.noir, '80%', petit ? 4 : 5)} />
        <div style={ligne(v['gris-texte'], '55%', 3)} />
        {!petit && (
          <div style={{ marginTop: 3 }}>
            <span style={{ display: 'block', textAlign: 'center', fontSize: 7, fontWeight: 600, padding: '4px 0', borderRadius: `min(${v['rayon-bouton']}, 99px)`, background: v.bleu, color: v['sur-bouton'] }}>Voir le véhicule</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function Miniature({ config, petit = false, className = '' }: { config: ThemeConfig; petit?: boolean; className?: string }) {
  const { zone } = couleursMiniature(config);
  const h = zone('header');
  const hero = zone('hero');
  const cat = zone('catalogue');
  const cartes = zone('cartes');
  const pied = zone('footer');
  const titre = (v: Vars, sombre = false): CSSProperties => ({
    fontFamily: v['police-titres'], fontWeight: Number(v['graisse-titres']), textTransform: v['casse-titres'] as CSSProperties['textTransform'],
    letterSpacing: v['casse-titres'] === 'uppercase' ? 0.3 : 0, fontSynthesisWeight: 'none',
    color: sombre ? v.inverse : v.noir, fontSize: (petit ? 10 : 15) * Number(v['echelle-titres']), lineHeight: 1.1,
  });
  return (
    <div className={`overflow-hidden select-none ${className}`} style={{ background: cat.fond, fontFamily: cat['police-texte'] }} aria-hidden="true">
      {/* Barre du haut */}
      <div style={{ background: h.surface, padding: petit ? '5px 8px' : '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: petit ? 8 : 10, fontWeight: 700, color: h.noir }}>SVM Ride</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 7, color: h.lien, fontWeight: 600 }}>Accueil</span>
        {!petit && <span style={{ fontSize: 7, color: h['gris-texte'] }}>Nos véhicules</span>}
        <span style={{ fontSize: 7, color: h['gris-texte'] }}>Contact</span>
      </div>
      <div style={{ height: 2, background: h['degrade-or'] }} />
      {/* Bandeau d'accueil */}
      <div style={{ background: `linear-gradient(180deg, ${hero['noir-profond']}CC, ${hero['noir-profond']})`, padding: petit ? '10px 8px' : '18px 12px' }}>
        <div style={ligne(hero['degrade-or-sombre'], '22px', 2)} />
        <div style={{ ...titre(hero, true), marginTop: 5 }}>Bienvenue chez SVM Ride</div>
        <div style={{ ...ligne(hero['inverse-91'], '60%', 3), marginTop: 5 }} />
        <div style={{ display: 'flex', gap: 5, marginTop: petit ? 7 : 10 }}>
          <Bouton v={hero} plein petit={petit} />
          <Bouton v={hero} plein={false} petit={petit} />
        </div>
      </div>
      {/* Derniers arrivages */}
      <div style={{ background: cat.fond, padding: petit ? '8px' : '12px' }}>
        <div style={titre(cat)}>Derniers arrivages</div>
        <div style={{ ...ligne(cat['degrade-or'], '22px', 2), marginTop: 4 }} />
        <div style={{ display: 'grid', gridTemplateColumns: petit ? '1fr 1fr' : '1fr 1fr 1fr', gap: petit ? 5 : 8, marginTop: petit ? 6 : 10 }}>
          <Carte v={cartes} petit={petit} />
          <Carte v={cartes} petit={petit} />
          {!petit && <Carte v={cartes} />}
        </div>
        {!petit && (
          <p style={{ fontSize: 8, color: cat.lien, fontWeight: 600, marginTop: 8, textAlign: 'right' }}>Voir toutes nos motos →</p>
        )}
      </div>
      {!petit && <SectionsSupplementaires zone={zone} titre={titre} />}
      {/* Pied de page */}
      <div style={{ height: 2, background: pied['degrade-or-sombre'] }} />
      <div style={{ background: pied['noir-profond'], padding: petit ? '6px 8px' : '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 7, fontWeight: 700, color: pied.inverse }}>SVM Ride</span>
        <span style={ligne(pied['inverse-66'], '30%', 3)} />
        <span style={{ fontSize: 7, color: pied['or-clair'] }}>●</span>
      </div>
    </div>
  );
}

/** Sections de l'aperçu détaillé : marques, avis, équipe et formulaire */
function SectionsSupplementaires({ zone, titre }: { zone: (cle: CleSection) => Vars; titre: (v: Vars, sombre?: boolean) => CSSProperties }) {
  const m = zone('marques');
  const a = zone('avis');
  const e = zone('equipe');
  const f = zone('formulaires');
  return (
    <>
      <div style={{ background: m.fond, padding: '10px 12px', borderTop: `1px solid ${m.bordure}` }}>
        <div style={{ ...titre(m), fontSize: 11 }}>Explorez les marques</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ flex: 1, height: 18, borderRadius: `calc(${m['rayon-carte']} / 2)`, background: m.surface, border: `1px solid ${m.bordure}`, boxShadow: m['ombre-carte'] }} />
          ))}
        </div>
      </div>
      <div style={{ background: a.fond, padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: a.surface, borderRadius: `calc(${a['rayon-carte']} / 2)`, padding: 7, border: `1px solid ${a.bordure}` }}>
          <span style={{ fontSize: 8, color: a.or }}>★★★★★</span>
          <div style={{ ...ligne(a['gris-texte'], '90%', 3), marginTop: 4 }} />
          <div style={{ ...ligne(a['gris-texte'], '70%', 3), marginTop: 3 }} />
        </div>
        <div style={{ background: e['noir-profond'], borderRadius: `calc(${e['rayon-carte']} / 2)`, padding: 7, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 18, height: 18, borderRadius: 99, border: `1.5px solid ${e['or-clair']}`, background: e['inverse-84'] }} />
          <div style={{ flex: 1 }}>
            <div style={ligne(e.inverse, '70%', 4)} />
            <div style={{ ...ligne(e['or-clair'], '45%', 3), marginTop: 3 }} />
          </div>
        </div>
      </div>
      <div style={{ background: f.fond, padding: '10px 12px' }}>
        <div style={{ background: f.surface, borderRadius: `calc(${f['rayon-carte']} / 2)`, padding: 8, border: `1px solid ${f.bordure}`, display: 'grid', gap: 5 }}>
          <span style={{ height: 12, borderRadius: 4, border: `1.5px solid ${f.champ}`, background: f.surface }} />
          <span style={{ height: 12, borderRadius: 4, border: `1.5px solid ${f.lien}`, background: f.surface, boxShadow: `0 0 0 2px ${f.lien}26` }} />
          <span style={{ justifySelf: 'start' }}><Bouton v={f} plein /></span>
        </div>
      </div>
    </>
  );
}

/** Pastilles de la palette principale d'un thème */
export function Palette({ config, taille = 'h-4 w-4' }: { config: ThemeConfig; taille?: string }) {
  const v = variablesDuTheme(config);
  const couleurs = [v['noir-profond'], v.or, v.bleu, v.fond, v.noir];
  return (
    <span className="inline-flex -space-x-1" aria-hidden="true">
      {couleurs.map((c, i) => (
        <span key={i} className={`${taille} rounded-full border-2 border-white`} style={{ background: c }} />
      ))}
    </span>
  );
}
