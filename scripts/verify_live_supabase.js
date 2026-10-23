const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const client = createClient(url, key);

async function testQuery() {
  console.log('Connecting to:', url);
  const { data: paths, error: e1 } = await client
    .from('learning_paths')
    .select('*, modules(*, lessons(*))')
    .eq('is_published', true)
    .order('enrolled_count', { ascending: false });

  if (e1) {
    console.error('Error fetching paths:', e1);
    return;
  }
  console.log('--- ALL PUBLISHED LEARNING PATHS (JOINED) ---');
  console.log('Count:', paths.length);
  paths.forEach(p => {
    console.log(`[${p.id}] ${p.title} | Domain: ${p.domain} | Level: ${p.level} | Modules: ${p.modules.length}`);
  });

  console.log('\n--- COURSE DETAILS TEST (jee-physics) ---');
  const { data: jee, error: e2 } = await client
    .from('learning_paths')
    .select('*, modules(*, lessons(*))')
    .eq('id', 'jee-physics')
    .single();

  if (e2) {
    console.error('Error fetching jee-physics:', e2);
    return;
  }

  console.log(`Path ID: ${jee.id}`);
  console.log(`Title: ${jee.title}`);
  console.log(`Domain: ${jee.domain} | Level: ${jee.level} | Duration: ${jee.duration_hours} hrs`);
  console.log(`Modules Count: ${jee.modules.length}`);
  jee.modules.sort((a, b) => a.order_index - b.order_index).forEach(m => {
    console.log(`  Module ${m.module_number}: ${m.title} (${m.status}, ${m.lessons.length} lessons)`);
    m.lessons.sort((a, b) => a.order_index - b.order_index).forEach(l => {
      console.log(`    - [${l.type}] ${l.title} (${l.duration_minutes}m) [Source: ${l.source_name}]`);
    });
  });

  console.log('\n--- QUIZZES TEST ---');
  const { data: quizzes, error: e3 } = await client
    .from('quizzes')
    .select('*, quiz_questions(*)')
    .eq('path_id', 'jee-physics');

  if (e3) {
    console.error('Error fetching quizzes:', e3);
    return;
  }
  console.log('Quizzes for jee-physics:', quizzes.length);
  quizzes.forEach(q => {
    console.log(`Quiz [${q.id}]: ${q.title} (${q.quiz_questions.length} questions)`);
    q.quiz_questions.forEach(qq => {
      console.log(`  Question ${qq.question_number}: ${qq.prompt.substring(0, 60)}...`);
    });
  });

  console.log('\n>>> SUPABASE INTEGRATION VERIFICATION: ALL QUERIES SUCCEEDED 100% <<<');
}

testQuery();
