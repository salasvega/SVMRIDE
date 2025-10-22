/*
  # Création de la table véhicules pour SVM Ride

  1. Nouvelle table
    - `vehicles`
      - `id` (uuid, clé primaire)
      - `slug` (text, unique) - URL conviviale
      - `brand` (text) - Marque du véhicule
      - `model` (text) - Modèle
      - `year` (integer) - Année
      - `type` (text) - Type: 'moto' ou 'scooter'
      - `displacement` (integer) - Cylindrée en cc
      - `price` (integer) - Prix en euros
      - `mileage` (integer) - Kilométrage
      - `condition` (text) - État: 'excellent', 'bon', 'correct', 'a-reviser'
      - `description` (text) - Description détaillée
      - `images` (jsonb) - Array d'URLs d'images
      - `features` (jsonb) - Array de caractéristiques
      - `warranty` (text) - Garantie
      - `available` (boolean) - Disponibilité
      - `status` (text) - Statut du véhicule
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de modification

  2. Sécurité
    - Enable RLS sur `vehicles`
    - Les véhicules sont visibles par tous (lecture publique)
    - Seuls les utilisateurs authentifiés peuvent modifier (administrateurs)
*/

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  type text NOT NULL CHECK (type IN ('moto', 'scooter')),
  displacement integer DEFAULT 0,
  price integer NOT NULL,
  mileage integer NOT NULL,
  condition text CHECK (condition IN ('excellent', 'bon', 'correct', 'a-reviser')),
  description text NOT NULL DEFAULT '',
  images jsonb DEFAULT '[]'::jsonb,
  features jsonb DEFAULT '[]'::jsonb,
  warranty text DEFAULT '',
  available boolean DEFAULT true,
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les véhicules disponibles"
  ON vehicles FOR SELECT
  TO public
  USING (available = true);

CREATE POLICY "Les administrateurs peuvent tout voir"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les administrateurs peuvent insérer des véhicules"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Les administrateurs peuvent modifier des véhicules"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Les administrateurs peuvent supprimer des véhicules"
  ON vehicles FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_vehicles_slug ON vehicles(slug);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(available);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
