/*
  # Ajouter le champ "Montant du financement" à la table user_financing_profiles

  1. Modifications
    - Ajout de la colonne `financing_amount` (numeric) à la table `user_financing_profiles`
    - Valeur par défaut: 0
    - Description: Montant du financement en euros, pré-rempli avec le prix du véhicule sélectionné

  2. Notes importantes
    - Ce champ stocke le montant du financement demandé par l'utilisateur
    - Il est initialisé avec le prix du véhicule mais peut être modifié par l'utilisateur
    - Utilisé pour calculer les mensualités et évaluer la demande de financement
*/

-- Ajouter la colonne financing_amount si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_financing_profiles' AND column_name = 'financing_amount'
  ) THEN
    ALTER TABLE user_financing_profiles 
    ADD COLUMN financing_amount numeric DEFAULT 0;
  END IF;
END $$;