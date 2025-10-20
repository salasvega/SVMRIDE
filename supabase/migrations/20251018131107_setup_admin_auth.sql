/*
  # Configuration de l'authentification administrateur

  1. Sécurité renforcée
    - Mise à jour des politiques RLS pour les administrateurs authentifiés
    - Seuls les utilisateurs authentifiés peuvent modifier les véhicules
  
  2. Notes importantes
    - Les administrateurs doivent être créés via l'interface Supabase Auth
    - Tous les utilisateurs authentifiés ont accès à l'administration
    - Pour plus de sécurité, vous pouvez ajouter un système de rôles plus tard
*/

-- Les politiques sont déjà en place, ce fichier documente la configuration
-- Les utilisateurs seront créés via l'interface Supabase Auth
