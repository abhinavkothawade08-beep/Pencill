/**
 * Universal Examination & Certification Catalog
 * 
 * Comprehensive, searchable catalog covering Indian & International school boards,
 * entrance exams, civil services, professional charters, and IT certifications.
 * Includes acronym index, regional metadata, official references, and verified syllabus scope.
 */

export interface ExamDefinition {
  id: string;
  name: string;
  acronym: string;
  category:
    | 'school_boards'
    | 'engineering_medical_entrance'
    | 'university_higher_ed'
    | 'government_civil_services'
    | 'law_entrance'
    | 'accounting_finance_professional'
    | 'international_school'
    | 'international_university_language'
    | 'medical_licensing'
    | 'it_industry_certifications'
    | 'olympiads_competitions'
    | 'custom';
  categoryLabel: string;
  countryOrRegion: string;
  level: string;
  officialSite?: string;
  typicalSubjects: string[];
  description: string;
  syllabusScopeNote?: string;
}

export const EXAM_CATALOG: ExamDefinition[] = [
  // A. Indian School Examinations
  {
    id: 'cbse-12',
    name: 'CBSE Class 12 Senior Secondary Board Examination',
    acronym: 'CBSE 12',
    category: 'school_boards',
    categoryLabel: 'Indian School Boards',
    countryOrRegion: 'India',
    level: 'Senior Secondary (Class 12)',
    officialSite: 'https://cbse.gov.in',
    typicalSubjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Economics', 'Accountancy'],
    description: 'National board examination for Class 12 secondary certification across India.',
    syllabusScopeNote: 'Strictly aligned to NCERT revised rationalized curriculum.',
  },
  {
    id: 'cbse-10',
    name: 'CBSE Class 10 Secondary School Examination',
    acronym: 'CBSE 10',
    category: 'school_boards',
    categoryLabel: 'Indian School Boards',
    countryOrRegion: 'India',
    level: 'Secondary (Class 10)',
    officialSite: 'https://cbse.gov.in',
    typicalSubjects: ['Mathematics', 'Science', 'Social Science', 'English Language & Literature'],
    description: 'National Class 10 secondary school examination across India.',
  },
  {
    id: 'icse-10',
    name: 'ICSE Class 10 (CISCE)',
    acronym: 'ICSE',
    category: 'school_boards',
    categoryLabel: 'Indian School Boards',
    countryOrRegion: 'India',
    level: 'Secondary (Class 10)',
    officialSite: 'https://cisce.org',
    typicalSubjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English Literature', 'History & Civics'],
    description: 'Council for the Indian School Certificate Examinations Class 10.',
  },
  {
    id: 'isc-12',
    name: 'ISC Class 12 (CISCE)',
    acronym: 'ISC',
    category: 'school_boards',
    categoryLabel: 'Indian School Boards',
    countryOrRegion: 'India',
    level: 'Senior Secondary (Class 12)',
    officialSite: 'https://cisce.org',
    typicalSubjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Commerce', 'Accounts'],
    description: 'Council for the Indian School Certificate Examinations Class 12.',
  },
  {
    id: 'mh-hsc',
    name: 'Maharashtra State Board HSC (Class 12)',
    acronym: 'MH-HSC',
    category: 'school_boards',
    categoryLabel: 'Indian School Boards',
    countryOrRegion: 'India / Maharashtra',
    level: 'Class 12',
    typicalSubjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Marathi'],
    description: 'Maharashtra State Board of Secondary and Higher Secondary Education Class 12.',
  },

  // B. Engineering and Medical Entrance
  {
    id: 'jee-main',
    name: 'JEE Main (Joint Entrance Examination)',
    acronym: 'JEE Main',
    category: 'engineering_medical_entrance',
    categoryLabel: 'Engineering & Medical Entrance',
    countryOrRegion: 'India',
    level: 'National Undergraduate Entrance',
    officialSite: 'https://jeemain.nta.nic.in',
    typicalSubjects: ['Physics', 'Chemistry', 'Mathematics'],
    description: 'National entrance examination for admission into NITs, IIITs, CFTIs, and qualifying gateway for JEE Advanced.',
    syllabusScopeNote: 'Standardized NTA syllabus focusing on conceptual speed and numerical accuracy.',
  },
  {
    id: 'jee-advanced',
    name: 'JEE Advanced (IIT Entrance Examination)',
    acronym: 'JEE Adv',
    category: 'engineering_medical_entrance',
    categoryLabel: 'Engineering & Medical Entrance',
    countryOrRegion: 'India',
    level: 'Premier Engineering Entrance',
    officialSite: 'https://jeeadv.ac.in',
    typicalSubjects: ['Physics', 'Chemistry', 'Mathematics'],
    description: 'Premier competitive entrance exam for undergraduate admissions to the Indian Institutes of Technology (IITs).',
    syllabusScopeNote: 'Deep theoretical, multi-concept problems with negative marking and comprehensive proofs.',
  },
  {
    id: 'neet-ug',
    name: 'NEET UG (National Eligibility cum Entrance Test)',
    acronym: 'NEET UG',
    category: 'engineering_medical_entrance',
    categoryLabel: 'Engineering & Medical Entrance',
    countryOrRegion: 'India',
    level: 'National Medical Entrance',
    officialSite: 'https://neet.nta.nic.in',
    typicalSubjects: ['Physics', 'Chemistry', 'Biology (Botany & Zoology)'],
    description: 'Single national entrance examination for admissions into MBBS, BDS, and allied healthcare programs across India.',
    syllabusScopeNote: '100% line-by-line adherence to NCERT textbooks for Biology and Chemistry, quantitative problem-solving for Physics.',
  },
  {
    id: 'bitsat',
    name: 'BITSAT (BITS Pilani Admission Test)',
    acronym: 'BITSAT',
    category: 'engineering_medical_entrance',
    categoryLabel: 'Engineering & Medical Entrance',
    countryOrRegion: 'India',
    level: 'Undergraduate Entrance',
    officialSite: 'https://www.bitsadmission.com',
    typicalSubjects: ['Physics', 'Chemistry', 'Mathematics', 'English Proficiency', 'Logical Reasoning'],
    description: 'Computer-based entrance test for admission to BITS Pilani campuses.',
  },
  {
    id: 'mht-cet',
    name: 'MHT CET (Maharashtra Common Entrance Test)',
    acronym: 'MHT CET',
    category: 'engineering_medical_entrance',
    categoryLabel: 'Engineering & Medical Entrance',
    countryOrRegion: 'India / Maharashtra',
    level: 'State Engineering & Pharmacy Entrance',
    typicalSubjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
    description: 'State entrance test for engineering and pharmacy colleges in Maharashtra.',
  },
  {
    id: 'cuet-ug',
    name: 'CUET UG (Common University Entrance Test)',
    acronym: 'CUET UG',
    category: 'engineering_medical_entrance',
    categoryLabel: 'Engineering & Medical Entrance',
    countryOrRegion: 'India',
    level: 'Central Universities Entrance',
    officialSite: 'https://cuetug.nta.nic.in',
    typicalSubjects: ['Domain Subjects (Maths, Physics, Chem, Bio, Eco, History)', 'General Test', 'Language'],
    description: 'Centralized admission test for central and participating universities in India.',
  },

  // C. University and Higher Education
  {
    id: 'gate',
    name: 'GATE (Graduate Aptitude Test in Engineering)',
    acronym: 'GATE',
    category: 'university_higher_ed',
    categoryLabel: 'University & Higher Education',
    countryOrRegion: 'India',
    level: 'Postgraduate / PSU Recruitment',
    officialSite: 'https://gate2025.iitr.ac.in',
    typicalSubjects: ['Computer Science (CS/IT)', 'Electronics (EC)', 'Mechanical (ME)', 'Electrical (EE)', 'Data Science & AI (DA)', 'Civil (CE)'],
    description: 'National examination testing comprehensive understanding of undergraduate engineering and science subjects.',
  },
  {
    id: 'cat',
    name: 'CAT (Common Admission Test for IIMs)',
    acronym: 'CAT',
    category: 'university_higher_ed',
    categoryLabel: 'University & Higher Education',
    countryOrRegion: 'India',
    level: 'Postgraduate MBA Entrance',
    officialSite: 'https://iimcat.ac.in',
    typicalSubjects: ['Verbal Ability & Reading Comprehension (VARC)', 'Data Interpretation & Logical Reasoning (DILR)', 'Quantitative Aptitude (QA)'],
    description: 'Premier national computer-based test for admission to Indian Institutes of Management (IIMs) and top business schools.',
  },
  {
    id: 'iit-jam',
    name: 'IIT JAM (Joint Admission Test for Masters)',
    acronym: 'IIT JAM',
    category: 'university_higher_ed',
    categoryLabel: 'University & Higher Education',
    countryOrRegion: 'India',
    level: 'Postgraduate M.Sc Entrance',
    typicalSubjects: ['Physics', 'Chemistry', 'Mathematics', 'Mathematical Statistics', 'Biotechnology', 'Geology'],
    description: 'National test for admission to M.Sc., Joint M.Sc.-Ph.D. programs at IITs and IISc.',
  },
  {
    id: 'ugc-net',
    name: 'UGC NET (National Eligibility Test for Assistant Professor / JRF)',
    acronym: 'UGC NET',
    category: 'university_higher_ed',
    categoryLabel: 'University & Higher Education',
    countryOrRegion: 'India',
    level: 'Lectureship & Research Fellowship',
    typicalSubjects: ['Paper 1 (Teaching & Research Aptitude)', 'Subject Specific Paper (Economics, CS, History, etc.)'],
    description: 'National examination determining eligibility for Assistant Professorship and Junior Research Fellowship.',
  },

  // D. Government and Civil Services
  {
    id: 'upsc-cse',
    name: 'UPSC Civil Services Examination (IAS / IPS / IFS)',
    acronym: 'UPSC CSE',
    category: 'government_civil_services',
    categoryLabel: 'Government & Civil Services',
    countryOrRegion: 'India',
    level: 'All India Services',
    officialSite: 'https://upsc.gov.in',
    typicalSubjects: ['General Studies (Polity, History, Geo, Economy, Science)', 'CSAT Aptitude', 'Optional Subject', 'Essay'],
    description: 'Premier nationwide competitive examination conducted by the Union Public Service Commission for civil services.',
    syllabusScopeNote: 'Expansive interdisciplinary syllabus spanning Indian heritage, governance, ethics, economy, and global relations.',
  },
  {
    id: 'ssc-cgl',
    name: 'SSC CGL (Staff Selection Commission Combined Graduate Level)',
    acronym: 'SSC CGL',
    category: 'government_civil_services',
    categoryLabel: 'Government & Civil Services',
    countryOrRegion: 'India',
    level: 'Central Government Recruitment',
    typicalSubjects: ['Quantitative Aptitude', 'General Intelligence & Reasoning', 'English Comprehension', 'General Awareness'],
    description: 'National exam for recruitment to Group B and C posts in ministries and departments of the Government of India.',
  },
  {
    id: 'ibps-po',
    name: 'IBPS & SBI PO (Probationary Officer Banking Examinations)',
    acronym: 'IBPS / SBI PO',
    category: 'government_civil_services',
    categoryLabel: 'Government & Civil Services',
    countryOrRegion: 'India',
    level: 'Public Sector Banking',
    typicalSubjects: ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'General & Banking Awareness'],
    description: 'Competitive examination for recruitment of Probationary Officers in nationalized banks and State Bank of India.',
  },
  {
    id: 'rbi-grade-b',
    name: 'RBI Grade B Officer Examination',
    acronym: 'RBI Grade B',
    category: 'government_civil_services',
    categoryLabel: 'Government & Civil Services',
    countryOrRegion: 'India',
    level: 'Central Banking Apex',
    typicalSubjects: ['Economic & Social Issues (ESI)', 'Finance & Management (FM)', 'General English', 'Phase 1 Aptitude'],
    description: 'Prestigious direct recruitment examination for Grade B officers in the Reserve Bank of India.',
  },

  // E. Law Entrance
  {
    id: 'clat',
    name: 'CLAT (Common Law Admission Test for NLUs)',
    acronym: 'CLAT',
    category: 'law_entrance',
    categoryLabel: 'Law Entrance',
    countryOrRegion: 'India',
    level: 'National Law Universities',
    officialSite: 'https://consortiumofnlus.ac.in',
    typicalSubjects: ['Legal Reasoning', 'Logical Reasoning', 'Reading Comprehension', 'Current Affairs & GK', 'Quantitative Techniques'],
    description: 'Centralized national entrance test for 24 National Law Universities in India.',
  },

  // F. Accounting & Professional Qualifications
  {
    id: 'ca-exam',
    name: 'ICAI Chartered Accountancy (Foundation, Inter, Final)',
    acronym: 'CA Exam',
    category: 'accounting_finance_professional',
    categoryLabel: 'Accounting & Professional',
    countryOrRegion: 'India',
    level: 'Chartered Professional',
    officialSite: 'https://icai.org',
    typicalSubjects: ['Financial Reporting', 'Advanced Auditing', 'Direct & Indirect Tax Laws', 'Strategic Financial Management'],
    description: 'Statutory qualification governed by the Institute of Chartered Accountants of India.',
  },
  {
    id: 'cfa-exam',
    name: 'CFA (Chartered Financial Analyst Institute)',
    acronym: 'CFA',
    category: 'accounting_finance_professional',
    categoryLabel: 'Accounting & Professional',
    countryOrRegion: 'Global',
    level: 'Global Investment Charter',
    officialSite: 'https://cfainstitute.org',
    typicalSubjects: ['Ethical & Professional Standards', 'Quantitative Methods', 'Economics', 'Financial Statement Analysis', 'Corporate Issuers', 'Equity & Fixed Income'],
    description: 'Gold standard global investment management and financial analyst charter.',
  },

  // G. International School Examinations
  {
    id: 'sat',
    name: 'Digital SAT (College Board)',
    acronym: 'SAT',
    category: 'international_school',
    categoryLabel: 'International School',
    countryOrRegion: 'Global / USA',
    level: 'Undergraduate College Admission',
    officialSite: 'https://satsuite.collegeboard.org',
    typicalSubjects: ['Reading and Writing', 'Math (Algebra, Advanced Math, Problem Solving, Geometry)'],
    description: 'Standardized adaptive test widely used for college admissions in the United States and globally.',
  },
  {
    id: 'ap-exams',
    name: 'Advanced Placement (AP Examinations)',
    acronym: 'AP Exams',
    category: 'international_school',
    categoryLabel: 'International School',
    countryOrRegion: 'Global / USA',
    level: 'College-Level High School',
    typicalSubjects: ['AP Calculus BC', 'AP Physics C Mechanics', 'AP Computer Science A', 'AP Chemistry', 'AP Biology', 'AP Micro/Macroeconomics'],
    description: 'College-level curricula and examinations offered by the College Board to high school students.',
  },
  {
    id: 'ib-dp-exam',
    name: 'International Baccalaureate Diploma Programme (IB DP)',
    acronym: 'IB DP',
    category: 'international_school',
    categoryLabel: 'International School',
    countryOrRegion: 'Global',
    level: 'Pre-University',
    officialSite: 'https://ibo.org',
    typicalSubjects: ['Math AA HL/SL', 'Physics HL', 'Chemistry HL', 'Economics HL', 'Computer Science HL', 'Theory of Knowledge (TOK)'],
    description: 'Rigorous two-year pre-university curriculum recognized by top universities worldwide.',
  },

  // H. International University and Language Tests
  {
    id: 'gre',
    name: 'GRE (Graduate Record Examinations)',
    acronym: 'GRE',
    category: 'international_university_language',
    categoryLabel: 'International University & Language',
    countryOrRegion: 'Global',
    level: 'Graduate School Admission',
    officialSite: 'https://ets.org/gre',
    typicalSubjects: ['Verbal Reasoning', 'Quantitative Reasoning', 'Analytical Writing'],
    description: 'Standardized test required for admission to master’s and doctoral programs worldwide.',
  },
  {
    id: 'gmat',
    name: 'GMAT Focus Edition (Graduate Management Admission Test)',
    acronym: 'GMAT',
    category: 'international_university_language',
    categoryLabel: 'International University & Language',
    countryOrRegion: 'Global',
    level: 'Business School Admission',
    officialSite: 'https://mba.com',
    typicalSubjects: ['Quantitative Reasoning', 'Verbal Reasoning', 'Data Insights'],
    description: 'Computer adaptive test assessing qualifications for graduate business and management programs globally.',
  },
  {
    id: 'ielts-toefl',
    name: 'IELTS / TOEFL English Proficiency Test',
    acronym: 'IELTS / TOEFL',
    category: 'international_university_language',
    categoryLabel: 'International University & Language',
    countryOrRegion: 'Global',
    level: 'Language Proficiency',
    typicalSubjects: ['Listening', 'Reading', 'Writing', 'Speaking'],
    description: 'Standardized tests of English language proficiency for non-native speakers pursuing study or migration.',
  },
  {
    id: 'jlpt',
    name: 'JLPT (Japanese Language Proficiency Test N5–N1)',
    acronym: 'JLPT',
    category: 'international_university_language',
    categoryLabel: 'International University & Language',
    countryOrRegion: 'Global / Japan',
    level: 'Language Proficiency',
    typicalSubjects: ['Language Knowledge (Vocabulary/Kanji)', 'Grammar & Reading', 'Listening'],
    description: 'Official standardized criterion-referenced test to evaluate and certify Japanese language proficiency.',
  },

  // I. Medical & Healthcare Licensing
  {
    id: 'usmle',
    name: 'USMLE (United States Medical Licensing Examination Step 1, 2 CK, 3)',
    acronym: 'USMLE',
    category: 'medical_licensing',
    categoryLabel: 'Medical Licensing',
    countryOrRegion: 'USA / International',
    level: 'Physician Licensure',
    officialSite: 'https://usmle.org',
    typicalSubjects: ['Step 1 Foundational Sciences', 'Step 2 Clinical Knowledge', 'Step 3 Patient Care & Management'],
    description: 'Three-step examination for medical licensure in the United States.',
  },
  {
    id: 'nclex-rn',
    name: 'NCLEX-RN (National Council Licensure Examination for Registered Nurses)',
    acronym: 'NCLEX-RN',
    category: 'medical_licensing',
    categoryLabel: 'Medical Licensing',
    countryOrRegion: 'USA / Canada / Global',
    level: 'Nursing Licensure',
    typicalSubjects: ['Safe & Effective Care', 'Health Promotion', 'Physiological Integrity', 'Clinical Judgment'],
    description: 'Nationwide examination for the licensing of nurses in the United States and Canada.',
  },

  // J. IT & Industry Certifications
  {
    id: 'aws-cert',
    name: 'AWS Certified Solutions Architect (Associate & Professional)',
    acronym: 'AWS SAA/SAP',
    category: 'it_industry_certifications',
    categoryLabel: 'IT & Industry Certifications',
    countryOrRegion: 'Global',
    level: 'Professional Cloud Certification',
    officialSite: 'https://aws.amazon.com/certification/',
    typicalSubjects: ['Resilient Architectures', 'High-Performing Architectures', 'Secure Applications & Architectures', 'Cost-Optimized Architectures'],
    description: 'Industry-recognized credential validating expertise in designing distributed applications and systems on AWS.',
  },
  {
    id: 'azure-cert',
    name: 'Microsoft Certified: Azure Solutions Architect Expert (AZ-104 / AZ-305)',
    acronym: 'Azure AZ-104',
    category: 'it_industry_certifications',
    categoryLabel: 'IT & Industry Certifications',
    countryOrRegion: 'Global',
    level: 'Professional Cloud Certification',
    typicalSubjects: ['Azure Identities & Governance', 'Virtual Networking', 'Storage', 'Compute & App Services'],
    description: 'Microsoft industry credential validating skills in implementing, monitoring, and maintaining Azure infrastructure.',
  },
  {
    id: 'gcp-pca',
    name: 'Google Cloud Certified Professional Cloud Architect',
    acronym: 'GCP PCA',
    category: 'it_industry_certifications',
    categoryLabel: 'IT & Industry Certifications',
    countryOrRegion: 'Global',
    level: 'Professional Cloud Certification',
    officialSite: 'https://cloud.google.com/certification',
    typicalSubjects: ['Cloud Solution Architecture Design', 'Security & Compliance', 'Scaling & Reliability', 'Migration Strategies'],
    description: 'Google Cloud credential validating ability to leverage Google Cloud technologies to address enterprise requirements.',
  },
  {
    id: 'cisco-ccna',
    name: 'Cisco Certified Network Associate (CCNA 200-301)',
    acronym: 'CCNA',
    category: 'it_industry_certifications',
    categoryLabel: 'IT & Industry Certifications',
    countryOrRegion: 'Global',
    level: 'Networking Professional',
    typicalSubjects: ['Network Fundamentals', 'Network Access', 'IP Connectivity', 'IP Services', 'Security Fundamentals', 'Automation & Programmability'],
    description: 'Premier foundational networking credential covering switching, routing, wireless access, and network security.',
  },
  {
    id: 'comptia-sec-plus',
    name: 'CompTIA Security+ (SY0-701)',
    acronym: 'Security+',
    category: 'it_industry_certifications',
    categoryLabel: 'IT & Industry Certifications',
    countryOrRegion: 'Global',
    level: 'Cybersecurity Foundational',
    typicalSubjects: ['General Security Concepts', 'Threats, Vulnerabilities & Mitigations', 'Security Architecture', 'Security Operations'],
    description: 'Global benchmark for validating baseline cybersecurity skills and operational security practices.',
  },
  {
    id: 'cka-kubernetes',
    name: 'Certified Kubernetes Administrator (CKA - CNCF / Linux Foundation)',
    acronym: 'CKA',
    category: 'it_industry_certifications',
    categoryLabel: 'IT & Industry Certifications',
    countryOrRegion: 'Global',
    level: 'DevOps & Container Orchestration',
    officialSite: 'https://www.cncf.io/certification/cka/',
    typicalSubjects: ['Cluster Architecture & Installation', 'Workloads & Scheduling', 'Services & Networking', 'Storage', 'Troubleshooting'],
    description: 'Performance-based exam certifying competency in architecting and managing production Kubernetes clusters.',
  },
  {
    id: 'pmp-cert',
    name: 'Project Management Professional (PMP - PMI)',
    acronym: 'PMP',
    category: 'it_industry_certifications',
    categoryLabel: 'IT & Industry Certifications',
    countryOrRegion: 'Global',
    level: 'Management Charter',
    officialSite: 'https://pmi.org/certifications/project-management-pmp',
    typicalSubjects: ['People (Conflict, Leadership, Team Building)', 'Process (Agile, Waterfall, Governance)', 'Business Environment'],
    description: 'World’s leading project management certification demonstrating expertise in predictive, agile, and hybrid approaches.',
  },

  // L. Olympiads & Competitions
  {
    id: 'inpho-incho',
    name: 'Indian National Olympiads (INPhO, INChO, INMO, INBO)',
    acronym: 'National Olympiads',
    category: 'olympiads_competitions',
    categoryLabel: 'Olympiads & Competitions',
    countryOrRegion: 'India / International',
    level: 'Elite Scholastic Competition',
    typicalSubjects: ['Theoretical Physics', 'Challenging Organic/Inorganic Chemistry', 'Combinatorics, Number Theory & Geometry'],
    description: 'Premier national competitive Olympiads organized by HBCSE leading to the International Olympiads.',
  },
  {
    id: 'tech-interview',
    name: 'FAANG / Tier-1 Software Engineering Coding & System Design Interview',
    acronym: 'Coding Interviews',
    category: 'olympiads_competitions',
    categoryLabel: 'Interviews & Assessments',
    countryOrRegion: 'Global',
    level: 'Professional Placement',
    typicalSubjects: ['Data Structures & Algorithms', 'System Design (HLD & LLD)', 'Behavioral / Leadership Principles', 'Concurrency & OS'],
    description: 'Intensive interview preparation track for technical software engineering roles at leading technology enterprises.',
  },
];

export interface SearchExamResult {
  exam: ExamDefinition;
  matchScore: number;
}

/**
 * Searches the examination catalog by name, acronym, category, country, or subject.
 */
export function searchExaminations(query: string, categoryFilter?: string, maxResults = 10): ExamDefinition[] {
  const clean = query.trim().toLowerCase();

  return EXAM_CATALOG.filter((exam) => {
    if (categoryFilter && categoryFilter !== 'all' && exam.category !== categoryFilter) {
      return false;
    }
    if (!clean) return true;

    const matchesAcronym = exam.acronym.toLowerCase().includes(clean) || clean.includes(exam.acronym.toLowerCase());
    const matchesName = exam.name.toLowerCase().includes(clean);
    const matchesCategory = exam.categoryLabel.toLowerCase().includes(clean);
    const matchesRegion = exam.countryOrRegion.toLowerCase().includes(clean);
    const matchesSubject = exam.typicalSubjects.some(s => s.toLowerCase().includes(clean));

    return matchesAcronym || matchesName || matchesCategory || matchesRegion || matchesSubject;
  }).slice(0, maxResults);
}

/**
 * Retrieves an exam by ID.
 */
export function getExamById(id: string): ExamDefinition | undefined {
  return EXAM_CATALOG.find(e => e.id === id);
}
