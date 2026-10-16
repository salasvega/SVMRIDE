// Écrit l'adresse Supabase et la clé publique (publishable) dans un petit
// fichier lu par la fonction Netlify « seo ». Lancé avant chaque build : les
// valeurs viennent des mêmes variables d'environnement que le site lui-même.
// La clé publishable est publique par nature (elle est déjà dans le site).
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.env.VITE_SUPABASE_URL ?? '';
const key = process.env.VITE_SUPABASE_ANON_KEY ?? '';

const fichier = new URL('../netlify/generated/supabase-config.ts', import.meta.url);
mkdirSync(new URL('.', fichier), { recursive: true });
writeFileSync(
  fichier,
  `// Fichier généré par scripts/config-edge.mjs — ne pas modifier.\n` +
    `export const SUPABASE_URL = ${JSON.stringify(url)};\n` +
    `export const SUPABASE_KEY = ${JSON.stringify(key)};\n` +
    `export const CONTEXTE = ${JSON.stringify(process.env.CONTEXT ?? 'local')};\n`,
);

console.log(`config-edge : Supabase ${url ? 'configuré' : 'NON configuré (balises par défaut)'}`);
