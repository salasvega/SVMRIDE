/*
  # Create Sales Folders System

  ## Overview
  Creates a comprehensive system for managing vehicle sales and client information,
  including document storage for sales-related files.

  ## New Tables
  
  ### `sales_folders`
  Main table for managing sales transactions
  - `id` (uuid, primary key) - Unique identifier for each sales folder
  - `folder_number` (text, unique) - Human-readable folder reference number (auto-generated)
  - `vehicle_id` (uuid, foreign key) - Reference to the vehicle being sold/reserved
  - `status` (text) - Folder status: 'en_cours', 'complete', 'archive'
  - Client Information:
    - `client_first_name` (text) - Client's first name
    - `client_last_name` (text) - Client's last name
    - `client_email` (text) - Client's email address
    - `client_phone` (text) - Client's phone number
    - `client_address` (text) - Client's full address
  - Sale Information:
    - `sale_date` (date) - Date of the sale/reservation
    - `sale_price` (numeric) - Final sale price
    - `deposit_amount` (numeric) - Deposit/down payment amount
    - `balance_amount` (numeric) - Remaining balance to pay
    - `payment_method` (text) - Payment method used
  - Documents:
    - `documents` (jsonb) - Array of document metadata (type, filename, path, upload_date)
  - Metadata:
    - `admin_notes` (text) - Internal notes for admin team
    - `created_at` (timestamptz) - When the folder was created
    - `updated_at` (timestamptz) - Last update timestamp

  ## Storage
  
  ### `sales-documents` bucket
  Secure storage for all sales-related documents (invoices, ID cards, registration, contracts)
  - Public access: disabled
  - File size limit: 10MB
  - Allowed file types: PDF, images, documents

  ## Security
  
  - Enable RLS on `sales_folders` table
  - Admin-only access policies for all operations
  - Storage policies restrict access to authenticated admin users only
*/

-- Create sales_folders table
CREATE TABLE IF NOT EXISTS sales_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_number text UNIQUE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'complete', 'archive')),
  
  -- Client information
  client_first_name text NOT NULL,
  client_last_name text NOT NULL,
  client_email text,
  client_phone text,
  client_address text,
  
  -- Sale information
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  sale_price numeric(10,2),
  deposit_amount numeric(10,2) DEFAULT 0,
  balance_amount numeric(10,2) DEFAULT 0,
  payment_method text,
  
  -- Documents metadata
  documents jsonb DEFAULT '[]'::jsonb,
  
  -- Admin notes
  admin_notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_folders_vehicle_id ON sales_folders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sales_folders_status ON sales_folders(status);
CREATE INDEX IF NOT EXISTS idx_sales_folders_sale_date ON sales_folders(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_folders_folder_number ON sales_folders(folder_number);

-- Function to generate folder number (format: DSV-YYYY-NNNN)
CREATE OR REPLACE FUNCTION generate_folder_number()
RETURNS text AS $$
DECLARE
  year_part text;
  sequence_part text;
  next_number integer;
BEGIN
  year_part := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN folder_number LIKE 'DSV-' || year_part || '-%' 
      THEN CAST(substring(folder_number from 10) AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM sales_folders;
  
  sequence_part := LPAD(next_number::text, 4, '0');
  
  RETURN 'DSV-' || year_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate folder number
CREATE OR REPLACE FUNCTION set_folder_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.folder_number IS NULL OR NEW.folder_number = '' THEN
    NEW.folder_number := generate_folder_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_folder_number
  BEFORE INSERT ON sales_folders
  FOR EACH ROW
  EXECUTE FUNCTION set_folder_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_folder_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_folder_timestamp
  BEFORE UPDATE ON sales_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_folder_timestamp();

-- Enable RLS
ALTER TABLE sales_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only access
CREATE POLICY "Admins can view all sales folders"
  ON sales_folders FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Admins can insert sales folders"
  ON sales_folders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Admins can update sales folders"
  ON sales_folders FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Admins can delete sales folders"
  ON sales_folders FOR DELETE
  TO authenticated
  USING (
    auth.jwt()->>'role' = 'admin'
  );

-- Create storage bucket for sales documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sales-documents',
  'sales-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sales-documents bucket
CREATE POLICY "Admins can view sales documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sales-documents' AND
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Admins can upload sales documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sales-documents' AND
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Admins can update sales documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'sales-documents' AND
    auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    bucket_id = 'sales-documents' AND
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Admins can delete sales documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sales-documents' AND
    auth.jwt()->>'role' = 'admin'
  );