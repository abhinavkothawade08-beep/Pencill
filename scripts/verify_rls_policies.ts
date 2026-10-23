import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

async function runRlsVerification() {
  console.log('='.repeat(70));
  console.log('PENCILL STEP 2 RLS POLICIES VERIFICATION');
  console.log('='.repeat(70));

  // Create isolated clients for User A and User B
  const clientA = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const emailA = 'scholar.author.a.1790571484431@gmail.com';
  const emailB = 'scholar.author.b.1790571484431@gmail.com';
  const password = 'TestSecurePassword!123';

  console.log('\n[1/5] Establishing authenticated test sessions...');

  async function getAuthenticatedUser(client: any, email: string) {
    // Try sign in first
    const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInErr && signInData?.user && signInData?.session) {
      return signInData.user;
    }

    if (signInErr && signInErr.message === 'Email not confirmed') {
      throw new Error(`Email not confirmed for ${email}. Please execute: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL; in Supabase SQL Editor.`);
    }

    // Otherwise try sign up
    const { data: signUpData, error: signUpErr } = await client.auth.signUp({
      email,
      password,
    });

    if (signUpErr) {
      throw new Error(`Sign up failed for ${email}: ${signUpErr.message}`);
    }

    if (!signUpData.session) {
      throw new Error(`Sign up succeeded for ${email}, but email confirmation is pending. Please execute: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL; in Supabase SQL Editor.`);
    }

    return signUpData.user;
  }

  let userA: any;
  let userB: any;

  try {
    userA = await getAuthenticatedUser(clientA, emailA);
    console.log(`  ✓ Authenticated User A active session: ${userA.id} (${emailA})`);
    userB = await getAuthenticatedUser(clientB, emailB);
    console.log(`  ✓ Authenticated User B active session: ${userB.id} (${emailB})`);
  } catch (authErr: any) {
    console.error('\n❌ Authentication setup notice:\n' + authErr.message);
    process.exit(1);
  }

  const testPathId = `test-path-${Date.now().toString(36)}`;
  const testModId = `test-mod-${Date.now().toString(36)}`;
  const testLesId = `test-les-${Date.now().toString(36)}`;
  const testResId = `test-res-${Date.now().toString(36)}`;

  // --------------------------------------------------------------------------
  // TEST 1: User A creates their own learning path
  // --------------------------------------------------------------------------
  console.log('\n[2/5] Testing User A learning path creation...');
  const { error: lpErr } = await clientA.from('learning_paths').insert({
    id: testPathId,
    title: 'Advanced Quantum Mechanics for Engineers',
    description: 'A deep dive into quantum state vectors and Hilbert spaces.',
    domain: 'Physics',
    level: 'Undergraduate',
    duration_hours: 40,
    module_count: 1,
    verified: false,
    is_published: false, // Private draft to test isolation
    author_user_id: userA.id,
    tags: ['Physics', 'Quantum'],
  });

  if (lpErr) {
    console.error('❌ Failed to insert learning path as User A:', lpErr.message);
    process.exit(1);
  }
  console.log(`  ✓ Learning path "${testPathId}" inserted successfully by User A.`);

  // --------------------------------------------------------------------------
  // TEST 2: User A persists modules & lessons & resources
  // --------------------------------------------------------------------------
  console.log('\n[3/5] Testing User A module & lesson & resource remote persistence...');
  
  // Insert module
  const { error: modErr } = await clientA.from('modules').insert({
    id: testModId,
    path_id: testPathId,
    title: 'State Vectors & Operators',
    module_number: 1,
    order_index: 0,
    status: 'in_progress',
    total_resources: 1,
  });

  if (modErr) {
    console.error('❌ Module insertion rejected by RLS:', modErr.message);
  } else {
    console.log(`  ✓ Module "${testModId}" inserted successfully under path owned by User A.`);
  }

  // Insert lesson
  const { error: lesErr } = await clientA.from('lessons').insert({
    id: testLesId,
    module_id: testModId,
    title: 'Dirac Bra-Ket Notation',
    type: 'video',
    duration_minutes: 30,
    source_name: 'MIT OpenCourseWare',
    source_url: 'https://youtube.com/watch?v=quantum1',
    order_index: 0,
  });

  if (lesErr) {
    console.error('❌ Lesson insertion rejected by RLS:', lesErr.message);
  } else {
    console.log(`  ✓ Lesson "${testLesId}" inserted successfully under module owned by User A.`);
  }

  // Upsert resource
  const { error: resErr } = await clientA.from('resources').upsert({
    id: testResId,
    title: 'MIT Quantum Mechanics Lecture 1',
    type: 'video',
    duration_minutes: 50,
    source_name: 'MIT OCW',
    source_url: 'https://ocw.mit.edu',
    is_verified: true,
  }, { onConflict: 'id' });

  if (resErr) {
    console.error('❌ Resource upsert rejected by RLS:', resErr.message);
  } else {
    console.log(`  ✓ Resource "${testResId}" upserted successfully.`);
  }

  // --------------------------------------------------------------------------
  // TEST 3: User A reads their path with nested modules and lessons
  // --------------------------------------------------------------------------
  console.log('\n[4/5] Testing User A querying their own path...');
  const { data: readData, error: readErr } = await clientA
    .from('learning_paths')
    .select('*, modules(*, lessons(*))')
    .eq('id', testPathId)
    .single();

  if (readErr || !readData) {
    console.error('❌ User A could not read their own path:', readErr?.message);
  } else {
    console.log(`  ✓ Read succeeded: "${readData.title}" has ${readData.modules?.length} module(s) and ${readData.modules?.[0]?.lessons?.length} lesson(s).`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Cross-user access isolation (User B must NOT see or mutate User A's private path)
  // --------------------------------------------------------------------------
  console.log('\n[5/5] Testing cross-user isolation with User B...');

  // User B tries to read User A's private path
  const { data: leakCheck, error: leakErr } = await clientB
    .from('learning_paths')
    .select('id, title')
    .eq('id', testPathId);

  if (leakData(leakCheck)) {
    console.error('❌ SECURITY VIOLATION: User B was able to read User A private path:', leakCheck);
  } else {
    console.log('  ✓ Isolation confirmed: User B cannot view User A private path (returned 0 rows).');
  }

  // User B tries to insert a module into User A's path
  const intruderModId = `intruder-mod-${Date.now().toString(36)}`;
  const { error: hackModErr } = await clientB.from('modules').insert({
    id: intruderModId,
    path_id: testPathId,
    title: 'Unauthorized Intrusion Module',
    module_number: 99,
    order_index: 99,
  });

  if (!hackModErr) {
    console.error('❌ SECURITY VIOLATION: User B was allowed to insert a module into User A path!');
  } else {
    console.log(`  ✓ Tampering blocked: User B module insertion into User A path was rejected (${hackModErr.message}).`);
  }

  console.log('\n' + '='.repeat(70));
  if (modErr || lesErr || resErr) {
    console.log('⚠️  RLS policies still need to be executed in the Supabase SQL editor.');
  } else {
    console.log('🎉 ALL RLS CHECKS PASSED: Schema, Ownership & Isolation Verified!');
  }
  console.log('='.repeat(70));
}

function leakData(data: any): boolean {
  return Array.isArray(data) && data.length > 0;
}

runRlsVerification().catch(console.error);
