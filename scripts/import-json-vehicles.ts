import { createClient } from '@supabase/supabase-js';
import vehiclesData from '../src/data/vehicles.json' assert { type: 'json' };

const SUPABASE_URL = 'https://fthoybkgbnxzlrjbprrh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aG95YmtnYm54emxyamJwcnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTA1MTMsImV4cCI6MjA3NjYyNjUxM30.rVGAQqw8aOyFRwqMpx52xi2-Vr7LzImObjS71qkI3xk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importVehicles() {
  console.log(`Found ${vehiclesData.length} vehicles in JSON file`);

  const vehiclesToInsert = vehiclesData.map((vehicle: any) => ({
    slug: vehicle.slug,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    type: vehicle.type,
    displacement: vehicle.displacement || 0,
    price: vehicle.price,
    mileage: vehicle.mileage,
    condition: vehicle.condition,
    description: vehicle.description,
    images: vehicle.images,
    features: vehicle.features,
    warranty: vehicle.warranty || '',
    available: vehicle.available !== false,
    status: 'available'
  }));

  console.log('Inserting vehicles into database...');

  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehiclesToInsert)
    .select();

  if (error) {
    console.error('Error inserting vehicles:', error);
    return;
  }

  console.log(`Successfully imported ${data?.length || 0} vehicles!`);
  console.log('\nVehicles imported:');
  data?.forEach((v: any) => {
    console.log(`  - ${v.brand} ${v.model} (${v.year}) - ${v.price}€`);
  });
}

importVehicles().catch(console.error);
