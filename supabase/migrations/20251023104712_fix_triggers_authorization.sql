/*
  # Fix Authorization Headers for Email Notification Triggers

  This migration adds the missing Authorization headers to the triggers for:
  - custom_search_submissions
  - financing_submissions  
  - trade_in_submissions

  This ensures the Edge Functions can be properly invoked when new submissions are created.
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS "SendMailOnCustom-search-form" ON custom_search_submissions;
DROP TRIGGER IF EXISTS "SendMailOnFinancing-form" ON financing_submissions;
DROP TRIGGER IF EXISTS "SendMailOnTrade-in-form" ON trade_in_submissions;

-- Recreate triggers with Authorization header

-- Custom Search Form Trigger
CREATE TRIGGER "SendMailOnCustomSearchForm"
  AFTER INSERT ON custom_search_submissions
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/custom-search-form',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer <CLE_RETIREE>"}',
    '{}',
    '5000'
  );

-- Financing Form Trigger
CREATE TRIGGER "SendMailOnFinancingForm"
  AFTER INSERT ON financing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/financing-form',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer <CLE_RETIREE>"}',
    '{}',
    '5000'
  );

-- Trade-In Form Trigger
CREATE TRIGGER "SendMailOnTradeInForm"
  AFTER INSERT ON trade_in_submissions
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/trade-in-form',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer <CLE_RETIREE>"}',
    '{}',
    '5000'
  );
