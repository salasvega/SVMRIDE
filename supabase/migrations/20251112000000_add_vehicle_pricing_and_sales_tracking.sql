/*
  # Add Vehicle Pricing and Sales Tracking

  1. New Columns
    - `purchase_price` (numeric) - Prix d'achat du véhicule
    - `sale_price` (numeric, nullable) - Prix de vente final (uniquement pour véhicules vendus)
    - `sale_date` (timestamptz, nullable) - Date de vente du véhicule

  2. Changes
    - The existing `price` column continues to represent the "prix de mise en vente" (listing price)
    - Add default values for purchase_price to prevent null issues
    - sale_price and sale_date remain nullable as they only apply to sold vehicles

  3. Notes
    - This enables margin calculation: sale_price - purchase_price
    - Supports business analytics for stock value and profit tracking
*/

-- Add new columns to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN purchase_price numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN sale_price numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'sale_date'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN sale_date timestamptz;
  END IF;
END $$;

-- Add helpful comment to clarify the price columns
COMMENT ON COLUMN vehicles.price IS 'Prix de mise en vente (listing price)';
COMMENT ON COLUMN vehicles.purchase_price IS 'Prix d''achat du véhicule';
COMMENT ON COLUMN vehicles.sale_price IS 'Prix de vente final (uniquement si vendu)';
COMMENT ON COLUMN vehicles.sale_date IS 'Date de vente du véhicule';
