# Configuration des Notifications Email

## ✅ Ce qui a été mis en place

### 1. Edge Function déployée
- **Nom:** `send-notification-email`
- **Service:** Resend
- **Email destinataire:** salasvega@gmail.com

### 2. Triggers de base de données créés
Les triggers suivants ont été créés pour envoyer automatiquement un email lors de chaque nouvelle soumission :
- ✅ `contact_submissions` (formulaire de contact)
- ✅ `financing_submissions` (demandes de financement)
- ✅ `trade_in_submissions` (demandes de reprise)
- ✅ `custom_search_submissions` (recherches personnalisées)

## 🔧 Configuration requise

### Étape 1 : Obtenir une clé API Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Allez dans **API Keys** dans le dashboard
3. Créez une nouvelle clé API
4. Copiez la clé (elle commence par `re_`)

### Étape 2 : Configurer la clé dans Supabase

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Edge Functions** → **Secrets**
4. Cliquez sur **Add Secret**
5. Ajoutez :
   - **Name:** `RESEND_API_KEY`
   - **Value:** votre clé API Resend (ex: `re_xxxxxxxxxxxxx`)
6. Cliquez sur **Save**

### Étape 3 : Vérifier le domaine d'envoi (optionnel mais recommandé)

Par défaut, l'Edge Function utilise `notifications@yourdomain.com` comme expéditeur.

#### Option A : Utiliser le domaine de test Resend (gratuit, limité)
- Aucune configuration nécessaire
- Les emails peuvent arriver en spam

#### Option B : Utiliser votre propre domaine (recommandé)
1. Dans Resend, allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Suivez les instructions pour vérifier votre domaine via DNS
4. Une fois vérifié, modifiez l'Edge Function pour utiliser votre domaine :
   - Dans le fichier `supabase/functions/send-notification-email/index.ts`
   - Ligne avec `from: 'notifications@yourdomain.com'`
   - Remplacez par `from: 'notifications@votredomaine.com'`

### Étape 4 : Configurer les variables d'environnement Supabase (si nécessaire)

Si les triggers ne fonctionnent pas, vous devrez peut-être configurer ces paramètres dans Supabase :

1. Allez dans **Settings** → **Database** → **Connection string**
2. Copiez votre URL Supabase
3. Exécutez cette requête SQL dans l'éditeur SQL :

```sql
ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'https://votre-projet.supabase.co';
ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'votre-service-role-key';
```

## 🧪 Test du système

Pour tester si tout fonctionne :

1. Allez sur votre site
2. Remplissez n'importe quel formulaire (contact, financement, etc.)
3. Soumettez le formulaire
4. Vérifiez votre email `salasvega@gmail.com`
5. Vous devriez recevoir un email avec les détails de la soumission

## 📧 Format des emails

Chaque type de formulaire génère un email différent avec toutes les informations soumises :

- **Contact** : nom, email, téléphone, message
- **Financement** : informations personnelles, montant, durée, situation professionnelle
- **Reprise** : informations du véhicule à reprendre
- **Recherche personnalisée** : critères de recherche détaillés

## 🔍 Dépannage

### Les emails ne sont pas envoyés

1. Vérifiez que `RESEND_API_KEY` est bien configuré dans Supabase
2. Vérifiez les logs de l'Edge Function :
   - Dashboard Supabase → **Edge Functions** → `send-notification-email` → **Logs**
3. Vérifiez les logs de la base de données :
   - Dashboard Supabase → **Database** → **Logs**

### Les emails arrivent en spam

- Configurez votre propre domaine dans Resend (Option B ci-dessus)
- Ajoutez des enregistrements SPF, DKIM et DMARC

### Erreur "RESEND_API_KEY not configured"

- La clé API n'est pas configurée dans Supabase
- Suivez l'Étape 2 ci-dessus

## 📊 Limites Resend (plan gratuit)

- 3000 emails par mois
- 100 emails par jour
- Largement suffisant pour un site de vente de véhicules

## 🎯 Prochaines étapes

Une fois la clé API configurée, le système est complètement automatique :
- Chaque nouvelle soumission déclenche automatiquement un email
- Aucune intervention manuelle requise
- Les emails sont envoyés en quelques secondes
