/**
 * Server-Side Gemini AI Verification Script
 * Validates that GEMINI_API_KEY is configured in .env.local,
 * that the API connects securely using x-goog-api-key headers,
 * and that structured JSON generation works properly.
 */

import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);

if (!keyMatch || !keyMatch[1].trim()) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

const apiKey = keyMatch[1].trim();
console.log('✅ Found GEMINI_API_KEY in .env.local (length: ' + apiKey.length + ' chars)');

// Verify that key is NOT exposed to browser (starts with NEXT_PUBLIC_)
if (envContent.includes('NEXT_PUBLIC_GEMINI_API_KEY')) {
  console.error('❌ Security Violation: NEXT_PUBLIC_GEMINI_API_KEY detected in .env.local!');
  process.exit(1);
}
console.log('✅ Key security verified: Not prefixed with NEXT_PUBLIC_');

async function callModel(model) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'Generate a diagnostic question about Newton Second Law in JSON: {"topic": "Newtonian Mechanics", "question": "string", "correctAnswer": "string"}' }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    })
  });
}

async function verifyGemini() {
  console.log('\n--- 1. Testing Gemini Connectivity ---');
  const start = Date.now();

  let activeModel = 'gemini-3.6-flash';
  let response = await callModel(activeModel);

  if (response.status === 503) {
    console.warn(`⚠️ ${activeModel} reported 503 (high demand). Retrying with fallback model="gemini-3-flash-preview"...`);
    activeModel = 'gemini-3-flash-preview';
    response = await callModel(activeModel);
  }

  const latency = Date.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Request failed (${response.status}):`, errorText);
    process.exit(1);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  console.log(`✅ Success in ${latency}ms! HTTP Status: ${response.status}`);
  console.log('\n--- 2. Structured JSON Output ---');
  console.log(rawText);

  const parsed = JSON.parse(rawText);
  if (!parsed.topic || !parsed.question) {
    console.error('❌ JSON structure did not match expected schema');
    process.exit(1);
  }

  console.log('\n--- 3. Validation Summary ---');
  console.log(`✅ Active Model: ${activeModel}`);
  console.log('✅ Transport: HTTPS with x-goog-api-key header');
  console.log('✅ Structured JSON Output: Validated');
  console.log('✅ Latency:', latency + 'ms');
  console.log('🎉 Gemini AI Integration is fully operational!\n');
}

verifyGemini().catch(err => {
  console.error('❌ Unhandled Exception:', err);
  process.exit(1);
});
