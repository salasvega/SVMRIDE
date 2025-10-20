# Activation de la Protection contre les Mots de Passe Compromis

## Contexte

Supabase Auth peut vérifier si les mots de passe ont été compromis en les comparant avec la base de données HaveIBeenPwned.org. Cette fonctionnalité améliore considérablement la sécurité de votre application.

## Comment Activer

### Via le Tableau de Bord Supabase

1. Connectez-vous à votre [Tableau de Bord Supabase](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **Policies** (ou **Settings**)
4. Recherchez l'option **"Enable password breach check"** ou **"Check passwords against HaveIBeenPwned"**
5. Activez cette option
6. Sauvegardez les modifications

### Via l'API Supabase Management (Alternative)

Si vous préférez utiliser l'API, vous pouvez configurer cela programmatiquement :

```bash
curl -X PATCH 'https://api.supabase.com/v1/projects/{ref}/config/auth' \
  -H "Authorization: Bearer {management_api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "SECURITY_PASSWORD_BREACH_CHECK_ENABLED": true
  }'
```

## Vérification

Une fois activé, Supabase vérifiera automatiquement tous les nouveaux mots de passe et les changements de mots de passe contre la base de données HaveIBeenPwned.

Les utilisateurs recevront une erreur s'ils tentent d'utiliser un mot de passe qui a été compromis dans une violation de données connue.

## Impact

- ✅ Meilleure sécurité des comptes utilisateurs
- ✅ Protection contre les mots de passe faibles ou compromis
- ✅ Conformité avec les meilleures pratiques de sécurité
- ⚠️ Légère augmentation du temps de création/modification de compte (négligeable)

## Notes Importantes

- Cette fonctionnalité utilise l'API k-anonymity de HaveIBeenPwned, ce qui signifie que les mots de passe complets ne sont jamais envoyés
- Seul un hash partiel du mot de passe est utilisé pour la vérification
- Aucune donnée sensible n'est exposée dans ce processus
