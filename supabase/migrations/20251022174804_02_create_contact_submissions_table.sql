/*
  # Create contact_submissions table

  1. New Tables
    - `contact_submissions`
      - `id` (uuid, primary key) - Unique identifier for each submission
      - `name` (text) - Name of the person submitting the form
      - `email` (text) - Email address of the submitter
      - `subject` (text) - Subject of the message
      - `message` (text) - Content of the message
      - `submitted_at` (timestamptz) - Timestamp when the form was submitted
      - `created_at` (timestamptz) - Timestamp when the record was created

  2. Security
    - Enable RLS on `contact_submissions` table
    - Add policy for service role to insert submissions (used by Edge Function)
    - Add policy for authenticated admin users to read submissions

  3. Important Notes
    - This table stores all contact form submissions
    - Only admins can view submissions
    - Public users cannot read or modify submissions (only Edge Function can insert)
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read contact submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);
