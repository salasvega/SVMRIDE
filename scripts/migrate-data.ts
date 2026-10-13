import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = 'https://qvwmztoqpltyvoowziok.supabase.co';
const OLD_SUPABASE_KEY = '<CLE_RETIREE>';

const NEW_SUPABASE_URL = 'https://fthoybkgbnxzlrjbprrh.supabase.co';
const NEW_SUPABASE_KEY = '<CLE_RETIREE>';

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

async function migrateVehicles() {
  console.log('Fetching vehicles from old database...');
  const { data: vehicles, error } = await oldSupabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching vehicles:', error);
    return;
  }

  console.log(`Found ${vehicles?.length || 0} vehicles`);

  if (!vehicles || vehicles.length === 0) {
    console.log('No vehicles to migrate');
    return;
  }

  console.log('Inserting vehicles into new database...');
  const { error: insertError } = await newSupabase
    .from('vehicles')
    .insert(vehicles);

  if (insertError) {
    console.error('Error inserting vehicles:', insertError);
  } else {
    console.log(`Successfully migrated ${vehicles.length} vehicles`);
  }
}

async function migrateContactSubmissions() {
  console.log('Fetching contact submissions from old database...');
  const { data: submissions, error } = await oldSupabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching contact submissions:', error);
    return;
  }

  console.log(`Found ${submissions?.length || 0} contact submissions`);

  if (!submissions || submissions.length === 0) {
    console.log('No contact submissions to migrate');
    return;
  }

  console.log('Inserting contact submissions into new database...');
  const { error: insertError } = await newSupabase
    .from('contact_submissions')
    .insert(submissions);

  if (insertError) {
    console.error('Error inserting contact submissions:', insertError);
  } else {
    console.log(`Successfully migrated ${submissions.length} contact submissions`);
  }
}

async function migrateFinancingSubmissions() {
  console.log('Fetching financing submissions from old database...');
  const { data: submissions, error } = await oldSupabase
    .from('financing_submissions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching financing submissions:', error);
    return;
  }

  console.log(`Found ${submissions?.length || 0} financing submissions`);

  if (!submissions || submissions.length === 0) {
    console.log('No financing submissions to migrate');
    return;
  }

  console.log('Inserting financing submissions into new database...');
  const { error: insertError } = await newSupabase
    .from('financing_submissions')
    .insert(submissions);

  if (insertError) {
    console.error('Error inserting financing submissions:', insertError);
  } else {
    console.log(`Successfully migrated ${submissions.length} financing submissions`);
  }
}

async function migrateTradeInSubmissions() {
  console.log('Fetching trade-in submissions from old database...');
  const { data: submissions, error } = await oldSupabase
    .from('trade_in_submissions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching trade-in submissions:', error);
    return;
  }

  console.log(`Found ${submissions?.length || 0} trade-in submissions`);

  if (!submissions || submissions.length === 0) {
    console.log('No trade-in submissions to migrate');
    return;
  }

  console.log('Inserting trade-in submissions into new database...');
  const { error: insertError } = await newSupabase
    .from('trade_in_submissions')
    .insert(submissions);

  if (insertError) {
    console.error('Error inserting trade-in submissions:', insertError);
  } else {
    console.log(`Successfully migrated ${submissions.length} trade-in submissions`);
  }
}

async function migrateCustomSearchSubmissions() {
  console.log('Fetching custom search submissions from old database...');
  const { data: submissions, error } = await oldSupabase
    .from('custom_search_submissions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching custom search submissions:', error);
    return;
  }

  console.log(`Found ${submissions?.length || 0} custom search submissions`);

  if (!submissions || submissions.length === 0) {
    console.log('No custom search submissions to migrate');
    return;
  }

  console.log('Inserting custom search submissions into new database...');
  const { error: insertError } = await newSupabase
    .from('custom_search_submissions')
    .insert(submissions);

  if (insertError) {
    console.error('Error inserting custom search submissions:', insertError);
  } else {
    console.log(`Successfully migrated ${submissions.length} custom search submissions`);
  }
}

async function main() {
  console.log('Starting data migration...\n');

  await migrateVehicles();
  console.log('');

  await migrateContactSubmissions();
  console.log('');

  await migrateFinancingSubmissions();
  console.log('');

  await migrateTradeInSubmissions();
  console.log('');

  await migrateCustomSearchSubmissions();
  console.log('');

  console.log('Migration completed!');
}

main().catch(console.error);
