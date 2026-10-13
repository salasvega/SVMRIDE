import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = 'https://qvwmztoqpltyvoowziok.supabase.co';
const OLD_SUPABASE_KEY = '<CLE_RETIREE>';

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

async function checkTables() {
  console.log('Checking vehicles table...');
  const { data: vehicles, error: vError, count } = await oldSupabase
    .from('vehicles')
    .select('*', { count: 'exact', head: false });

  console.log('Vehicles:', { count, error: vError?.message, sample: vehicles?.[0] });

  console.log('\nChecking contact_submissions table...');
  const { data: contacts, error: cError } = await oldSupabase
    .from('contact_submissions')
    .select('*');

  console.log('Contacts:', { count: contacts?.length, error: cError?.message });

  console.log('\nChecking financing_submissions table...');
  const { data: financing, error: fError } = await oldSupabase
    .from('financing_submissions')
    .select('*');

  console.log('Financing:', { count: financing?.length, error: fError?.message });

  console.log('\nChecking trade_in_submissions table...');
  const { data: tradeIn, error: tError } = await oldSupabase
    .from('trade_in_submissions')
    .select('*');

  console.log('Trade-in:', { count: tradeIn?.length, error: tError?.message });

  console.log('\nChecking custom_search_submissions table...');
  const { data: search, error: sError } = await oldSupabase
    .from('custom_search_submissions')
    .select('*');

  console.log('Custom search:', { count: search?.length, error: sError?.message });
}

checkTables().catch(console.error);
