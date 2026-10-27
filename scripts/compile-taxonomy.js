/**
 * Scripts to compile src/data/taxonomy.json from domainCatalog.ts and master directory data.
 * Covers all 12 educational domains with hierarchical categories, subjects, and topics.
 * Each topic has id, label, synonyms, complexity (1-5), prereqs, and popular flag.
 */

const fs = require('fs');
const path = require('path');

// Read domainCatalog source
const domainCatalogPath = path.join(__dirname, '../src/lib/catalogs/domainCatalog.ts');
const domainCatalogContent = fs.readFileSync(domainCatalogPath, 'utf8');

// We can extract EDUCATIONAL_DOMAINS using node require or tsx
const { EDUCATIONAL_DOMAINS } = require('../src/lib/catalogs/domainCatalog.ts');
let masterData = {};
try {
  masterData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/master-youtube-educator-directory.json'), 'utf8'));
} catch (e) {
  console.warn('Could not read master-youtube-educator-directory.json:', e.message);
}

// Generate topic synonyms based on topic label, domain, and subject
function generateSynonyms(label, domainName, subjectName) {
  const syns = new Set();
  const lower = label.toLowerCase();
  
  if (lower.includes('mechanics')) {
    syns.add('Newtonian Mechanics');
    syns.add('Kinematics & Dynamics');
    syns.add('Classical Mechanics');
  }
  if (lower.includes('physics')) {
    syns.add('Physical Science');
  }
  if (lower.includes('calculus')) {
    syns.add('Differential & Integral');
    syns.add('Analysis');
  }
  if (lower.includes('algebra')) {
    syns.add('Linear Algebra');
    syns.add('Matrices');
  }
  if (lower.includes('organic chemistry')) {
    syns.add('Carbon Chemistry');
    syns.add('Reaction Mechanisms');
  }
  if (lower.includes('machine learning')) {
    syns.add('ML');
    syns.add('Deep Learning');
    syns.add('Statistical Learning');
  }
  if (lower.includes('python')) {
    syns.add('Python3');
    syns.add('Python Programming');
  }
  if (lower.includes('algorithm')) {
    syns.add('DSA');
    syns.add('Data Structures & Algorithms');
  }

  // Common abbreviations and keywords
  const parts = label.split(/[:·&,-]/).map(p => p.trim()).filter(Boolean);
  for (const p of parts) {
    if (p.length > 2 && p.toLowerCase() !== label.toLowerCase()) {
      syns.add(p);
    }
  }

  return Array.from(syns).slice(0, 5);
}

// Complexity heuristic 1-5
function computeComplexity(topicName, domainId, difficultyTier) {
  if (difficultyTier === 'advanced') return 5;
  if (difficultyTier === 'intermediate') return 3;
  if (difficultyTier === 'beginner') return 2;

  const t = topicName.toLowerCase();
  if (t.includes('quantum') || t.includes('relativity') || t.includes('real analysis') || t.includes('transformer') || t.includes('doctoral')) return 5;
  if (t.includes('jee adv') || t.includes('advanced') || t.includes('calculus') || t.includes('electrodynamics') || t.includes('organic')) return 4;
  if (t.includes('class 11') || t.includes('class 12') || t.includes('mechanics') || t.includes('intermediate') || t.includes('algorithms')) return 3;
  if (t.includes('intro') || t.includes('basics') || t.includes('class 9') || t.includes('class 10') || t.includes('fundamentals')) return 2;
  return 3;
}

// Derive prerequisites from subject/domain and topic hierarchy
function derivePrereqs(topicName, domainId, subjectName) {
  const prereqs = [];
  const t = topicName.toLowerCase();
  
  if (t.includes('rotational') || t.includes('friction') || t.includes('work') || t.includes('momentum')) {
    prereqs.push('Vectors & Kinematics', 'Newton\'s Laws of Motion');
  } else if (t.includes('mechanics')) {
    prereqs.push('Basic Trigonometry & Vectors', 'Differentiation & Integration Fundamentals');
  } else if (t.includes('electromagnetism') || t.includes('optics')) {
    prereqs.push('Coulomb\'s Law Basics', 'Vector Calculus Intuition');
  } else if (t.includes('calculus')) {
    prereqs.push('Coordinate Geometry', 'Functions & Limits');
  } else if (t.includes('machine learning') || t.includes('deep learning')) {
    prereqs.push('Python Syntax', 'Linear Algebra & Matrices', 'Calculus Basics');
  } else if (t.includes('organic')) {
    prereqs.push('Chemical Bonding & Molecular Structure', 'Periodic Table Trends');
  } else if (domainId === 'school-education') {
    prereqs.push('Class 10 Foundational Science & Mathematics');
  } else if (domainId === 'engineering-technology') {
    prereqs.push('High School Algebra & Computational Thinking');
  } else {
    prereqs.push('Foundational Subject Concepts');
  }
  
  return Array.from(new Set(prereqs)).slice(0, 3);
}

const compiledDomains = EDUCATIONAL_DOMAINS.map((domain) => {
  const popularSet = new Set((domain.popularTopics || []).map(p => p.toLowerCase()));
  
  const categories = domain.disciplines.map((discipline) => {
    const subjects = discipline.subjects.map((subject) => {
      const topics = subject.topics.map((topic) => {
        const isPopular = popularSet.has(topic.name.toLowerCase()) || 
                          topic.name.toLowerCase().includes('class 11 mechanics') ||
                          topic.name.toLowerCase().includes('laws of motion') ||
                          topic.name.toLowerCase().includes('calculus') ||
                          topic.name.toLowerCase().includes('python') ||
                          topic.name.toLowerCase().includes('organic');

        const synonyms = generateSynonyms(topic.name, domain.name, subject.name);
        const complexity = computeComplexity(topic.name, domain.id, topic.difficultyTier);
        const prereqs = derivePrereqs(topic.name, domain.id, subject.name);

        return {
          id: topic.id,
          label: topic.name,
          synonyms,
          complexity,
          prereqs,
          popular: isPopular,
          subtopics: (topic.subtopics || []).map(st => ({
            id: st.id,
            label: st.name
          }))
        };
      });

      return {
        id: subject.id,
        label: subject.name,
        topics
      };
    });

    return {
      id: discipline.id,
      label: discipline.name,
      subjects
    };
  });

  return {
    id: domain.id,
    label: domain.name,
    description: domain.description,
    icon: domain.icon,
    popularTopics: domain.popularTopics || [],
    categories
  };
});

const taxonomyPayload = {
  version: '2.0.0',
  updatedAt: new Date().toISOString(),
  domainsCount: compiledDomains.length,
  totalTopicsCount: compiledDomains.reduce((acc, d) => 
    acc + d.categories.reduce((cAcc, c) => 
      cAcc + c.subjects.reduce((sAcc, s) => sAcc + s.topics.length, 0), 0), 0),
  domains: compiledDomains
};

const outputDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, 'taxonomy.json'),
  JSON.stringify(taxonomyPayload, null, 2),
  'utf8'
);

console.log(`Successfully generated src/data/taxonomy.json: ${taxonomyPayload.domainsCount} domains, ${taxonomyPayload.totalTopicsCount} topics.`);
