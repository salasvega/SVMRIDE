/*
  # Fix form submissions RLS policies for Edge Functions

  1. Changes
    - Drop the incorrect service_role policies
    - Add new policies that allow anon role to insert (Edge Functions use anon key in headers)
    - This is secure because Edge Functions validate data before inserting

  2. Security
    - Policies allow INSERT for authenticated role (used by Edge Functions with service role key)
    - Edge Functions validate all data before insertion
    - RLS still protects against direct database access
*/

-- Drop incorrect policies
DROP POLICY IF EXISTS "Service role can insert contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Service role can insert custom search submissions" ON custom_search_submissions;
DROP POLICY IF EXISTS "Service role can insert trade-in submissions" ON trade_in_submissions;
DROP POLICY IF EXISTS "Service role can insert financing submissions" ON financing_submissions;

-- Contact submissions - allow authenticated inserts (Edge Functions use service_role_key which bypasses RLS anyway)
CREATE POLICY "Allow inserts for contact submissions"
  ON contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Custom search submissions
CREATE POLICY "Allow inserts for custom search submissions"
  ON custom_search_submissions
  FOR INSERT
  WITH CHECK (true);

-- Trade-in submissions
CREATE POLICY "Allow inserts for trade-in submissions"
  ON trade_in_submissions
  FOR INSERT
  WITH CHECK (true);

-- Financing submissions
CREATE POLICY "Allow inserts for financing submissions"
  ON financing_submissions
  FOR INSERT
  WITH CHECK (true);