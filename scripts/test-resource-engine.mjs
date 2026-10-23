import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Since the project is TypeScript, we dynamically import the built or transpile via tsx/node
// Or import directly if running via tsx or node with loader
console.log('='.repeat(70));
console.log('PENCILL RESOURCE ENGINE — LIVE VERIFICATION SUITE');
console.log('='.repeat(70));
console.log('Environment:');
console.log(`- Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}`);
console.log(`- Gemini Key configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
console.log(`- YouTube Key configured: ${Boolean(process.env.YOUTUBE_API_KEY)}`);
console.log('='.repeat(70));
