/*
  # Fix Sales Folders RLS Policies

  ## Overview
  Update RLS policies for sales_folders table to use authenticated check instead of role check,
  matching the pattern used by other admin tables in the system.

  ## Changes
  - Drop existing policies that check for 'admin' role in JWT
  - Create new policies that only check for authenticated users
  - This matches the security model used by vehicles and other admin tables

  ## Security
  All authenticated users are considered admins in this system, so this maintains
  the same security level while fixing the access issue.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all sales folders" ON sales_folders;
DROP POLICY IF EXISTS "Admins can insert sales folders" ON sales_folders;
DROP POLICY IF EXISTS "Admins can update sales folders" ON sales_folders;
DROP POLICY IF EXISTS "Admins can delete sales folders" ON sales_folders;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can view sales folders"
  ON sales_folders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales folders"
  ON sales_folders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales folders"
  ON sales_folders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sales folders"
  ON sales_folders FOR DELETE
  TO authenticated
  USING (true);
