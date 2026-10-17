import { useEffect } from 'react';
import { siteConfig } from '../../config/site';
import { SeoMeta, canonicalUrl, DEFAULT_IMAGE, avecCoordonnees } from '../../config/seo';
import { useCoordonnees } from '../../lib/coordonnees';

interface SEOHeadProps {
  /** Balises de la page : voir src/config/seo.ts (pageSeo, vehicleSeo…) */
  meta: SeoMeta;
}

/**
 * Met à jour les balises SEO quand on navigue dans le site.
 * Au premier chargement, ces balises sont déjà écrites dans le HTML par la
 * fonction Netlify `seo` (rendu serveur) ; ce composant garde le même contenu.
 */
export function SEOHead({ meta: brut }: SEOHeadProps) {
  // Fiche concession et description de Contact avec les coordonnées à jour (admin, « Infos du site »)
  const meta = avecCoordonnees(brut, useCoordonnees());
  const url = canonicalUrl(meta);
  const image = meta.image
    ? meta.image.startsWith('http')
      ? meta.image
      : `${siteConfig.baseUrl}${meta.image}`
    : DEFAULT_IMAGE;
  const schemaJson = meta.schema ? JSON.stringify(meta.schema) : '';

  useEffect(() => {
    document.title = meta.title;

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    setMeta('property', 'og:type', meta.type === 'product' ? 'product' : 'website');
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    setMeta('name', 'twitter:image', image);

    // Adresse canonique (aucune pour une page exclue des moteurs)
    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (meta.noindex) {
      canonical?.remove();
    } else {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }

    // Données structurées : remplacées à chaque page, retirées si la page n'en a pas
    let ld = document.getElementById('seo-jsonld');
    if (schemaJson) {
      if (!ld) {
        ld = document.createElement('script');
        ld.id = 'seo-jsonld';
        ld.setAttribute('type', 'application/ld+json');
        document.head.appendChild(ld);
      }
      ld.textContent = schemaJson;
    } else {
      ld?.remove();
    }
  }, [meta.title, meta.description, meta.noindex, meta.type, url, image, schemaJson]);

  return null;
}
