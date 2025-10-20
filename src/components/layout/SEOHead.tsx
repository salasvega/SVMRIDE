import { useEffect } from 'react';
import { siteConfig } from '../../config/site';

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  schema?: Record<string, any>;
}

export function SEOHead({
  title,
  description,
  path = '',
  image = siteConfig.ogImage,
  type = 'website',
  schema,
}: SEOHeadProps) {
  const fullTitle = title === siteConfig.name ? title : `${title} | ${siteConfig.name}`;
  const url = `${siteConfig.baseUrl}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${siteConfig.baseUrl}${image}`;

  useEffect(() => {
    document.title = fullTitle;

    const updateMeta = (property: string, content: string, isProperty = true) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', description, false);
    updateMeta('og:title', fullTitle);
    updateMeta('og:description', description);
    updateMeta('og:url', url);
    updateMeta('og:type', type);
    updateMeta('og:image', imageUrl);
    updateMeta('og:site_name', siteConfig.name);
    updateMeta('twitter:card', 'summary_large_image', false);
    updateMeta('twitter:title', fullTitle, false);
    updateMeta('twitter:description', description, false);
    updateMeta('twitter:image', imageUrl, false);

    if (schema) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    }

    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.href = url;
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = url;
      document.head.appendChild(link);
    }
  }, [fullTitle, description, url, imageUrl, type, schema]);

  return null;
}
