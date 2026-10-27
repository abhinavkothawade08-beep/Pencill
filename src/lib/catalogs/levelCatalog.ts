/**
 * 12-Tier Academic Level Ladder
 * 
 * Standardized hierarchical level system across all 12 domains:
 * 1. Foundation
 * 2. School Level
 * 3. Class 6-8
 * 4. Class 9-10
 * 5. Class 11
 * 6. Class 12
 * 7. Competitive Prep
 * 8. Undergraduate Intro
 * 9. Undergraduate Core
 * 10. Postgraduate
 * 11. Research/Doctoral
 * 12. Professional/Industry
 * 
 * Includes domain-aware filtering and descriptive subtitles.
 */

export interface LevelDefinition {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  order: number;
  applicableDomains: string[]; // domain IDs where this level is relevant
  isCoreHighSchool?: boolean;
}

export const LEVEL_LADDER_12: LevelDefinition[] = [
  {
    id: 'foundation',
    title: 'Foundation',
    shortLabel: 'Foundation',
    description: 'Fundamental concepts, primers & prerequisite building blocks',
    order: 1,
    applicableDomains: [
      'school-education',
      'engineering-technology',
      'science-mathematics',
      'languages-communication',
      'personal-practical',
      'business-management',
    ],
  },
  {
    id: 'school',
    title: 'School Level',
    shortLabel: 'School Level',
    description: 'Comprehensive secondary school curriculum standard',
    order: 2,
    applicableDomains: [
      'school-education',
      'languages-communication',
      'science-mathematics',
      'arts-humanities',
      'personal-practical',
    ],
  },
  {
    id: 'class-6-8',
    title: 'Class 6–8',
    shortLabel: 'Middle School',
    description: 'Middle school curriculum & introductory STEM concepts',
    order: 3,
    applicableDomains: ['school-education', 'science-mathematics', 'languages-communication'],
  },
  {
    id: 'class-9-10',
    title: 'Class 9–10',
    shortLabel: 'Secondary Board',
    description: 'Secondary board standards, foundational algebra & science',
    order: 4,
    applicableDomains: ['school-education', 'science-mathematics', 'languages-communication', 'arts-humanities'],
  },
  {
    id: 'class-11',
    title: 'Class 11',
    shortLabel: 'High School Standard',
    description: 'Senior secondary core curriculum & foundational rigorous theory',
    order: 5,
    applicableDomains: ['school-education', 'science-mathematics', 'business-management'],
    isCoreHighSchool: true,
  },
  {
    id: 'class-12',
    title: 'Class 12',
    shortLabel: 'Senior Board Scope',
    description: 'Senior board syllabus scope & pre-university exit standard',
    order: 6,
    applicableDomains: ['school-education', 'science-mathematics', 'business-management', 'arts-humanities'],
    isCoreHighSchool: true,
  },
  {
    id: 'competitive',
    title: 'Competitive Prep',
    shortLabel: 'Entrance Exams',
    description: 'High-speed problem solving & exam syllabus (JEE / NEET / GATE / UPSC)',
    order: 7,
    applicableDomains: [
      'school-education',
      'engineering-technology',
      'medical-health',
      'business-management',
      'law-government',
      'finance-qualifications',
      'science-mathematics',
    ],
  },
  {
    id: 'undergraduate-intro',
    title: 'Undergraduate Intro',
    shortLabel: '1st-Year College',
    description: 'First-year university engineering, science & humanities syllabus',
    order: 8,
    applicableDomains: [
      'school-education',
      'engineering-technology',
      'medical-health',
      'business-management',
      'science-mathematics',
      'arts-humanities',
      'law-government',
      'finance-qualifications',
      'research-academic',
    ],
  },
  {
    id: 'undergraduate-core',
    title: 'Undergraduate Core',
    shortLabel: 'University Standard',
    description: 'Mid-to-upper division collegiate theory, laboratory & projects',
    order: 9,
    applicableDomains: [
      'engineering-technology',
      'medical-health',
      'business-management',
      'science-mathematics',
      'arts-humanities',
      'law-government',
      'finance-qualifications',
      'vocational-professional',
      'research-academic',
    ],
  },
  {
    id: 'postgraduate',
    title: 'Postgraduate',
    shortLabel: "Master's Level",
    description: "Master's level theoretical depth, seminars & specialized topics",
    order: 10,
    applicableDomains: [
      'engineering-technology',
      'medical-health',
      'business-management',
      'science-mathematics',
      'arts-humanities',
      'law-government',
      'finance-qualifications',
      'research-academic',
    ],
  },
  {
    id: 'research',
    title: 'Research / Doctoral',
    shortLabel: 'Doctoral & Frontier',
    description: 'Peer-reviewed literature, formal proofs, doctoral research & edge cases',
    order: 11,
    applicableDomains: [
      'engineering-technology',
      'science-mathematics',
      'medical-health',
      'research-academic',
      'arts-humanities',
      'business-management',
    ],
  },
  {
    id: 'professional',
    title: 'Professional / Industry',
    shortLabel: 'Industry Standard',
    description: 'Production-ready engineering, corporate workflows & industry licensure',
    order: 12,
    applicableDomains: [
      'engineering-technology',
      'business-management',
      'finance-qualifications',
      'law-government',
      'vocational-professional',
      'medical-health',
      'personal-practical',
    ],
  },
];

/**
 * Filter levels based on the active domain.
 * If domain has no specific constraints, returns all 12.
 */
export function getLevelsForDomain(domainId: string): LevelDefinition[] {
  if (!domainId) return LEVEL_LADDER_12;
  const filtered = LEVEL_LADDER_12.filter((lvl) => lvl.applicableDomains.includes(domainId));
  return filtered.length > 0 ? filtered : LEVEL_LADDER_12;
}
