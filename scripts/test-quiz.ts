import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

import { QuizProvider } from '../src/lib/resource-engine-v2';

async function main() {
  console.log('Testing QuizProvider direct synthesis...');
  const provider = new QuizProvider();
  console.log('Availability:', provider.isAvailable());

  const quiz = await provider.generateQuiz('Units and Measurements', {
    difficulty: 'intermediate',
    examContext: 'JEE',
    timeoutMs: 30000,
  });

  if (!quiz) {
    console.error('Quiz generation returned null');
    process.exit(1);
  }

  console.log('Generated Quiz:');
  console.log('- Title:', quiz.title);
  console.log('- Type:', quiz.type);
  console.log('- Duration:', quiz.durationMinutes, 'minutes');
  console.log('- Questions Generated:', quiz.metadata?.questionCount);
  console.log('\nSample Question:');
  const questions = (quiz.metadata?.questions as unknown[]) || [];
  console.log(JSON.stringify(questions[0], null, 2));
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
