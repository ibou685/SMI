// backend/src/config/supabase.js
// Configuration Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERREUR: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  console.error('Vérifie que ton fichier backend/.env existe et a les bonnes clés');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase connecté');

