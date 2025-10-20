import { createClient } from '@supabase/supabase-js';
import vehiclesData from '../src/data/vehicles.json';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateVehicles() {
  console.log('🚀 Starting vehicle data migration to Supabase...\n');

  try {
    const vehiclesToInsert = vehiclesData.map((vehicle) => ({
      slug: vehicle.slug,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      type: vehicle.type,
      displacement: vehicle.displacement,
      price: vehicle.price,
      mileage: vehicle.mileage,
      condition: vehicle.condition,
      description: vehicle.description,
      images: vehicle.images,
      features: vehicle.features,
      warranty: vehicle.warranty,
      available: vehicle.available,
    }));

    const { data, error } = await supabase
      .from('vehicles')
      .upsert(vehiclesToInsert, { onConflict: 'slug' });

    if (error) {
      console.error('❌ Error migrating vehicles:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully migrated ${vehiclesData.length} vehicles to Supabase!`);
    console.log('\nVehicles migrated:');
    vehiclesData.forEach((v) => {
      console.log(`  - ${v.brand} ${v.model} (${v.year})`);
    });
    console.log('\n✨ Migration complete!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

migrateVehicles();
