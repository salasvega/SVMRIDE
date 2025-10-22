/*
  # Fix contact_submissions insert policy

  1. Changes
    - Add INSERT policy for service role to allow Edge Function to insert data
    - This is required because the Edge Function needs to insert form submissions

  2. Security
    - Only service role can insert (via Edge Functions)
    - Public users cannot insert directly
*/

-- Add policy to allow service role to insert contact submissions
CREATE POLICY "Service role can insert contact submissions"
  ON contact_submissions
  FOR INSERT
  TO service_role
  WITH CHECK (true);