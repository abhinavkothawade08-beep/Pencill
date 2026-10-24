import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

async function checkDatabase() {
  console.log('=== TEST 6: DATABASE PERSISTENCE & MIGRATION STATE ===');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Supabase URL configured:', !!url, url ? url.slice(0, 25) + '...' : '');
  console.log('Supabase Anon Key configured:', !!key);

  if (!url || !key) {
    console.log('Supabase credentials missing.');
    return;
  }

  const supabase = createClient(url, key);

  // 1. Check master_educators table
  console.log('\nQuerying public.master_educators table...');
  try {
    const { data, error, count } = await supabase
      .from('master_educators')
      .select('educator_id, educator_name, primary_domain, verification_status', { count: 'exact' })
      .limit(5);

    if (error) {
      console.log('master_educators query result: ERROR', error.message, error.code, error.details);
    } else {
      console.log(`master_educators query result: SUCCESS. Total rows: ${count}`);
      console.log('Sample records:', data);
    }
  } catch (err: any) {
    console.error('master_educators threw error:', err.message);
  }

  // 2. Check resources table
  console.log('\nQuerying public.resources table for educator columns...');
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, educator_id, educator_name, discovery_source, verification_status')
      .limit(3);

    if (error) {
      console.log('resources query result: ERROR', error.message, error.code);
    } else {
      console.log('resources query result: SUCCESS. Columns educator_id, educator_name exist.');
      console.log('Sample rows:', data);
    }
  } catch (err: any) {
    console.error('resources query threw error:', err.message);
  }

  // 3. Check lessons table
  console.log('\nQuerying public.lessons table for educator columns...');
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('id, title, educator_id, educator_name, discovery_source, verification_status')
      .limit(3);

    if (error) {
      console.log('lessons query result: ERROR', error.message, error.code);
    } else {
      console.log('lessons query result: SUCCESS. Columns educator_id, educator_name exist.');
      console.log('Sample rows:', data);
    }
  } catch (err: any) {
    console.error('lessons query threw error:', err.message);
  }

  // 4. Check courses table
  console.log('\nQuerying public.courses table to verify existing courses work...');
  try {
    const { data, error, count } = await supabase
      .from('courses')
      .select('id, title, user_id', { count: 'exact' })
      .limit(3);

    if (error) {
      console.log('courses query result: ERROR', error.message);
    } else {
      console.log(`courses query result: SUCCESS. Total existing courses: ${count}`);
    }
  } catch (err: any) {
    console.error('courses query threw error:', err.message);
  }
}

checkDatabase().catch(console.error);
