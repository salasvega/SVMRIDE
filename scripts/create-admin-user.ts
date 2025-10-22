import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fthoybkgbnxzlrjbprrh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('Creating admin user...');

  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@svmride.com',
    password: 'AdminSVM2025!',
    email_confirm: true,
  });

  if (error) {
    console.error('Error creating admin user:', error);
    return;
  }

  console.log('Admin user created successfully!');
  console.log('Email:', data.user?.email);
  console.log('ID:', data.user?.id);
  console.log('\nYou can now login with:');
  console.log('Email: admin@svmride.com');
  console.log('Password: AdminSVM2025!');
}

createAdminUser().catch(console.error);
