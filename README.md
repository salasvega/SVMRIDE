# SVM Ride - Site Web Officiel

Site web moderne et responsive pour SVM Ride, spécialiste du deux-roues en Île-de-France.

## Fonctionnalités

- **Page d'accueil** avec présentation des services
- **Catalogue de véhicules** avec filtres avancés
- **Fiches véhicules détaillées** avec galerie photos
- **Formulaire de reprise** pour vendre son véhicule
- **Simulateur de financement** avec calcul de mensualités
- **Recherche personnalisée** pour trouver le véhicule idéal
- **Page contact** avec formulaire et coordonnées
- **Pages légales** (Mentions légales, RGPD, Cookies)
- **SEO optimisé** avec Schema.org JSON-LD
- **Cookie banner RGPD** compliant
- **Design responsive** pour mobile, tablette et desktop

## Technologies

- **React 18** + **TypeScript**
- **Vite** pour le build
- **Tailwind CSS** pour le design
- **React Router** pour le routing
- **Supabase** pour la base de données
- **Zod** pour la validation
- **Lucide React** pour les icônes

## Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier .env
cp .env.example .env

# Lancer le serveur de développement
npm run dev
```

Les formulaires sont enregistrés directement dans Supabase (tables + fonctions edge) ; il n'y a plus de serveur API séparé.

## Scripts disponibles

- `npm run dev` - Lance le serveur de développement (port 5173)
- `npm run build` - Compile le projet pour la production
- `npm run preview` - Prévisualise le build de production
- `npm run lint` - Vérifie le code avec ESLint
- `npm run typecheck` - Vérifie les types TypeScript

## 🎯 Gestion du catalogue de véhicules

Le site utilise **Supabase** pour stocker et gérer les véhicules en temps réel.

### ⭐ Interface d'administration intégrée (RECOMMANDÉ)

Votre site dispose maintenant d'une **interface d'administration complète** accessible directement depuis votre navigateur !

**Accès :**
- **Lien dans le footer** : Cliquez sur "Administration" en bas de page (discret)
- **URL directe** : `http://localhost:5173/admin/login` (dev) ou `votre-site.com/admin/login` (prod)

**📖 [Guide d'accès détaillé →](./ACCES_ADMIN.md)**

**Fonctionnalités :**
- ✅ Dashboard avec statistiques en temps réel
- ✅ Ajouter/Modifier/Supprimer des véhicules via formulaire intuitif
- ✅ **Upload direct de photos** - plus besoin de gérer les URLs manuellement !
- ✅ Masquer/Afficher des véhicules en 1 clic
- ✅ Interface responsive (fonctionne sur mobile, tablette, desktop)
- ✅ Stockage automatique des images sur Supabase Storage

**📖 [Guide complet de l'interface admin →](./GUIDE_INTERFACE_ADMIN.md)**

### Méthode alternative : Supabase directement

Vous pouvez aussi gérer le catalogue via l'interface Supabase :
1. Connectez-vous sur https://supabase.com
2. Menu **Table Editor** > table **`vehicles`**

**📖 [Guide Supabase →](./GUIDE_ADMIN.md)** (pour utilisateurs avancés)

### Première connexion

**Pour créer votre compte administrateur :**
1. Allez sur https://supabase.com → votre projet
2. Menu **Authentication** → **Add user**
3. Créez un utilisateur avec email/mot de passe
4. Connectez-vous sur `votre-site.com/admin/login`

### Données actuelles
✅ Les 12 véhicules d'exemple ont été migrés vers Supabase
✅ Le site charge les données en temps réel depuis la base de données
✅ Toutes les modifications sont instantanées sur le site
✅ Interface admin prête à l'emploi

## Configuration des formulaires

Par défaut, les formulaires sont configurés pour envoyer les données à un serveur API local (`http://localhost:3001`).

Pour configurer l'envoi vers un service externe (Supabase, Airtable, etc.), modifiez le fichier `src/hooks/useFormSubmit.ts`.

### Option 1: Supabase
Utilisez les fonctions Edge de Supabase pour gérer les soumissions.

### Option 2: Service email
Configurez un service SMTP pour envoyer les formulaires par email.

### Option 3: Airtable
Envoyez directement vers une base Airtable via leur API.

## Variables d'environnement

Créez un fichier `.env` à la racine du projet:

```env
# Supabase Configuration (OBLIGATOIRE)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon

# Analytics (optionnel)
VITE_ANALYTICS_ENABLED=false
VITE_GA_TRACKING_ID=

# reCAPTCHA (optionnel)
VITE_RECAPTCHA_SITE_KEY=

# API Configuration
VITE_API_URL=http://localhost:3001
```

### ⚠️ Configuration Netlify

**IMPORTANT:** Pour que votre site fonctionne sur Netlify, vous DEVEZ configurer les variables d'environnement suivantes dans les paramètres de votre site:

1. Allez sur **Netlify Dashboard** → Votre site → **Site settings** → **Environment variables**
2. Ajoutez ces variables:
   - `VITE_SUPABASE_URL` = `https://bplfwhzxvlhttukzqgue.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwbGZ3aHp4dmxodHR1a3pxZ3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NjM0OTgsImV4cCI6MjA3NjQzOTQ5OH0.ZmRpuIBt223QuuIDslcu3iEu4WiIJfrvefMuRbgKit0`

3. Sauvegardez et **redéployez** votre site

Sans ces variables, le site affichera une page blanche.

## SEO

Le site inclut:
- Meta tags Open Graph et Twitter Cards
- Schema.org JSON-LD (Organization, Product, Service)
- Sitemap.xml
- Robots.txt
- URLs canoniques
- Fil d'Ariane
- Images optimisées

## Accessibilité

- Sémantique HTML5
- Rôles ARIA appropriés
- Contraste AA/AAA
- Labels associés aux inputs
- Focus states visibles
- Navigation au clavier

## RGPD

- Cookie banner avec choix utilisateur
- Politique de confidentialité
- Politique des cookies
- Consentement explicite sur tous les formulaires
- Droit d'accès, rectification, suppression

## Production

Pour déployer en production:

```bash
# Compiler le projet
npm run build

# Le dossier `dist` contient les fichiers statiques prêts à déployer
```

Déployez le contenu du dossier `dist` sur votre hébergeur (Vercel, Netlify, etc.).

## Structure du projet

```
src/
├── components/         # Composants réutilisables
│   ├── layout/        # Header, Footer, SEO
│   └── ui/            # Button, Input, etc.
├── config/            # Configuration (theme, site)
├── data/              # Données mock (véhicules)
├── hooks/             # Custom hooks
├── pages/             # Pages du site
├── types/             # Types TypeScript
└── utils/             # Fonctions utilitaires
```

## Support

Pour toute question: contact@svmride.com

---

© 2025 SVM Ride. Tous droits réservés. By Tonton Design
