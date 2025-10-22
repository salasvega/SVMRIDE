/*
  # Fix all form submissions insert policies

  1. Changes
    - Add INSERT policies for service role on all form submission tables
    - This allows Edge Functions to insert form submissions

  2. Security
    - Only service role can insert (via Edge Functions)
    - Public users cannot insert directly into tables
*/

-- Custom search submissions
CREATE POLICY "Service role can insert custom search submissions"
  ON custom_search_submissions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Trade-in submissions
CREATE POLICY "Service role can insert trade-in submissions"
  ON trade_in_submissions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Financing submissions
CREATE POLICY "Service role can insert financing submissions"
  ON financing_submissions
  FOR INSERT
  TO service_role
  WITH CHECK (true);