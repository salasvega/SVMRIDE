#!/bin/bash

# Script pour créer l'utilisateur admin dans Supabase
# Usage: SUPABASE_SERVICE_ROLE_KEY="votre_clé" ./scripts/create-admin.sh

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Erreur: SUPABASE_SERVICE_ROLE_KEY n'est pas défini"
  echo ""
  echo "Pour obtenir votre service role key:"
  echo "1. Allez sur https://supabase.com/dashboard/project/fthoybkgbnxzlrjbprrh/settings/api"
  echo "2. Copiez la 'service_role key'"
  echo "3. Exécutez: SUPABASE_SERVICE_ROLE_KEY='votre_clé' ./scripts/create-admin.sh"
  exit 1
fi

echo "🔐 Création de l'utilisateur admin..."

RESPONSE=$(curl -s -X POST \
  'https://fthoybkgbnxzlrjbprrh.supabase.co/auth/v1/admin/users' \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@svmride.com",
    "password": "AdminSVM2025!",
    "email_confirm": true
  }')

if echo "$RESPONSE" | grep -q "id"; then
  echo "✅ Utilisateur admin créé avec succès!"
  echo ""
  echo "📧 Email: admin@svmride.com"
  echo "🔑 Mot de passe: AdminSVM2025!"
  echo ""
  echo "Vous pouvez maintenant vous connecter à l'interface admin."
else
  echo "❌ Erreur lors de la création:"
  echo "$RESPONSE"
fi
