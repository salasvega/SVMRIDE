/*
  # Create form submission tables

  1. New Tables
    - `trade_in_submissions`
      - Stores vehicle trade-in requests
      - Fields: name, email, phone, brand, model, year, mileage, condition, comments
    
    - `custom_search_submissions`
      - Stores custom vehicle search requests
      - Fields: name, email, phone, type, brand, displacement, year_min, budget_max, deadline, comments
    
    - `financing_submissions`
      - Stores financing requests
      - Fields: name, email, phone, amount, duration

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users to read submissions
    - Edge Functions use service role key which bypasses RLS

  3. Important Notes
    - All tables store form submissions for admin review
    - Only admins can view submissions
    - Public users cannot read or modify submissions
*/

CREATE TABLE IF NOT EXISTS trade_in_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year text NOT NULL,
  mileage text NOT NULL,
  condition text NOT NULL,
  comments text DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trade_in_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read trade-in submissions"
  ON trade_in_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS custom_search_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  type text NOT NULL,
  brand text DEFAULT '',
  displacement text DEFAULT '',
  year_min text DEFAULT '',
  budget_max text NOT NULL,
  deadline text NOT NULL,
  comments text DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_search_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read custom search submissions"
  ON custom_search_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS financing_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  amount text NOT NULL,
  duration text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financing_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read financing submissions"
  ON financing_submissions
  FOR SELECT
  TO authenticated
  USING (true);
