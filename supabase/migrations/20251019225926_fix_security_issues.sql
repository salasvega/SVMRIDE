/*
  # Fix Security Issues

  ## Overview
  This migration addresses multiple security concerns identified in the database:
  
  ## Changes Made
  
  ### 1. Remove Unused Indexes
  The following indexes were identified as unused and are being dropped to improve performance:
  - `idx_vehicles_type` - Type filtering index on vehicles table
  - `idx_vehicles_brand` - Brand filtering index on vehicles table  
  - `idx_vehicles_available` - Availability filtering index on vehicles table
  - `trade_in_submissions_submitted_at_idx` - Timestamp index on trade-in submissions
  - `custom_search_submissions_submitted_at_idx` - Timestamp index on custom search submissions
  - `financing_submissions_submitted_at_idx` - Timestamp index on financing submissions
  
  Note: We're keeping `idx_vehicles_slug` as it's used for vehicle detail page lookups
  
  ### 2. Fix Multiple Permissive Policies
  Consolidate overlapping SELECT policies on vehicles table:
  - Remove duplicate policy "Les administrateurs peuvent tout voir"
  - Keep "Tout le monde peut voir les véhicules disponibles" which covers both public and authenticated users
  
  ### 3. Secure Function Search Path
  Fix the `update_updated_at_column` function to use an immutable search_path:
  - Add `SET search_path = public` to prevent search path manipulation attacks
  - Recreate function with security definer properties
  
  ## Security Impact
  - Reduces attack surface by removing unused indexes
  - Eliminates policy confusion with single clear SELECT policy
  - Prevents search path hijacking in trigger functions
*/

-- ============================================================================
-- 1. DROP UNUSED INDEXES
-- ============================================================================

-- Drop unused vehicle indexes
DROP INDEX IF EXISTS idx_vehicles_type;
DROP INDEX IF EXISTS idx_vehicles_brand;
DROP INDEX IF EXISTS idx_vehicles_available;

-- Drop unused submission timestamp indexes
DROP INDEX IF EXISTS trade_in_submissions_submitted_at_idx;
DROP INDEX IF EXISTS custom_search_submissions_submitted_at_idx;
DROP INDEX IF EXISTS financing_submissions_submitted_at_idx;

-- ============================================================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES ON VEHICLES TABLE
-- ============================================================================

-- Drop the redundant admin-specific SELECT policy
DROP POLICY IF EXISTS "Les administrateurs peuvent tout voir" ON vehicles;

-- The public policy "Tout le monde peut voir les véhicules disponibles" remains
-- and covers both public and authenticated users, so no replacement needed

-- ============================================================================
-- 3. SECURE FUNCTION SEARCH_PATH
-- ============================================================================

-- Drop and recreate the function with a secure search_path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers that use this function
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trade_in_submissions_updated_at ON trade_in_submissions;
CREATE TRIGGER update_trade_in_submissions_updated_at
  BEFORE UPDATE ON trade_in_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_search_submissions_updated_at ON custom_search_submissions;
CREATE TRIGGER update_custom_search_submissions_updated_at
  BEFORE UPDATE ON custom_search_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financing_submissions_updated_at ON financing_submissions;
CREATE TRIGGER update_financing_submissions_updated_at
  BEFORE UPDATE ON financing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
