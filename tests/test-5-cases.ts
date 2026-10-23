import fs from 'fs';

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

import { EducatorMatcher } from '../.backup_engine_v1/educators/educator-matcher';
import { educatorRegistry } from '../.backup_engine_v1/educators/educator-registry';
import { YouTubeProvider } from '../.backup_engine_v1/providers/youtubeProvider';

const testCases = [
  {
    name: 'A. Maharashtra HSC Mathematics',
    params: {
      courseTitle: 'Maharashtra State Board Class 12 Mathematics',
      moduleTitle: 'Matrices and Differentiation for HSC Board Exam',
      subject: 'Mathematics',
      academicLevel: 'Class 12',
      examination: 'Maharashtra HSC',
      country: 'India',
      preferredLanguage: 'Marathi',
    },
  },
  {
    name: 'B. JEE Physics',
    params: {
      courseTitle: 'JEE Advanced Physics Mechanics & Electromagnetism',
      moduleTitle: 'Rotational Motion and Angular Momentum for JEE',
      subject: 'Physics',
      academicLevel: 'Competitive',
      examination: 'JEE Advanced',
      country: 'India',
    },
  },
  {
    name: 'C. Complete Python Programming',
    params: {
      courseTitle: 'Complete Python Programming Course',
      moduleTitle: 'Variables, Data Types and Control Flow in Python',
      subject: 'Computer Science / Programming',
      specificTopic: 'Python Programming',
      academicLevel: 'Beginner',
      desiredResourceType: 'full_course',
    },
  },
  {
    name: 'D. Machine Learning Fundamentals',
    params: {
      courseTitle: 'Machine Learning Fundamentals and Deep Learning',
      moduleTitle: 'Neural Networks, Backpropagation and Gradient Descent',
      subject: 'AI and Emerging Technologies',
      specificTopic: 'Machine Learning',
      academicLevel: 'Undergraduate',
    },
  },
  {
    name: 'E. Maharashtra SSC Science',
    params: {
      courseTitle: 'Maharashtra SSC Class 10 Science and Technology',
      moduleTitle: 'Gravitation and Periodic Classification of Elements',
      subject: 'Science',
      academicLevel: 'Class 10',
      examination: 'Maharashtra SSC',
      curriculum: 'Maharashtra State Board',
      country: 'India',
      preferredLanguage: 'Marathi',
    },
  },
];

async function testAll() {
  const yt = new YouTubeProvider();

  for (const tc of testCases) {
    console.log(`\n================================================================`);
    console.log(`  TEST CASE: ${tc.name}`);
    console.log(`================================================================`);
    const ctx = EducatorMatcher.deriveContext(tc.params as any);
    const matched = EducatorMatcher.matchEducators(ctx, { limit: 5 });

    console.log(`Top Matched Educators:`);
    matched.forEach((m, idx) => {
      console.log(`  [${idx + 1}] ${m.educator.Educator_ID}: ${m.educator.Educator_Name}`);
      console.log(`      Channel: "${m.educator.YouTube_Channel_Name}" | ID: ${m.educator.YouTube_Channel_ID || '(none)'}`);
      console.log(`      Score: ${m.score.totalScore} (Subj: ${m.score.subjectRelevance}, Spec: ${m.score.topicSpecialization}, Exam: ${m.score.examinationAlignment}, Curric: ${m.score.curriculumLevelMatch}, Lang: ${m.score.languageCompatibility})`);
      console.log(`      Specialization: ${m.educator.Teaching_Specialization}`);
    });

    // Test directory fallback / live retrieval
    const query = `${tc.params.moduleTitle || tc.params.courseTitle}`;
    console.log(`\nSearching resources for query: "${query}"...`);
    const results = await yt.search(query, {
      limit: 3,
      targetEducator: matched[0]?.educator,
      targetTypes: ['full_course', 'youtube_playlist', 'video_lecture'],
    });

    console.log(`Retrieved ${results.length} resources:`);
    results.forEach((r, idx) => {
      console.log(`  [${idx + 1}] ${r.title}`);
      console.log(`      Type: ${r.type} | Channel: ${r.authorOrChannel} (ID: ${r.channelId || 'none'})`);
      console.log(`      Source: ${r.discoverySource} | Educator: ${r.educatorId || 'none'} (${r.educatorName || 'none'})`);
      console.log(`      URL: ${r.canonicalUrl}`);
    });
  }
}

testAll().catch(console.error);
