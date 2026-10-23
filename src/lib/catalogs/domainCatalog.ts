/**
 * Universal Educational Domain Catalog
 * 
 * Hierarchical, extensible taxonomy for Pencill's Universal Learning Path Builder:
 * Educational Domain -> Discipline -> Subject -> Topic -> Subtopic
 * 
 * Provides search, cascading lookups, dynamic suggestions, and custom topic synthesis
 * with stable canonical identifiers.
 */

export interface SubtopicNode {
  id: string;
  name: string;
  keywords?: string[];
  suggestedLevel?: string;
}

export interface TopicNode {
  id: string;
  name: string;
  subtopics?: SubtopicNode[];
  keywords?: string[];
  difficultyTier?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SubjectNode {
  id: string;
  name: string;
  topics: TopicNode[];
  keywords?: string[];
}

export interface DisciplineNode {
  id: string;
  name: string;
  subjects: SubjectNode[];
  keywords?: string[];
}

export interface EducationalDomain {
  id: string;
  name: string;
  description: string;
  icon: string;
  disciplines: DisciplineNode[];
  popularTopics: string[];
}

export const EDUCATIONAL_DOMAINS: EducationalDomain[] = [
  {
    id: 'school-education',
    name: 'School Education',
    description: 'K-12 curricula, national & international boards, core foundational subjects.',
    icon: 'school',
    popularTopics: ['CBSE Class 12 Physics', 'ICSE Mathematics', 'Class 10 Biology', 'Class 11 Chemistry', 'CBSE Computer Science'],
    disciplines: [
      {
        id: 'curricula-boards',
        name: 'Boards & Curricula',
        subjects: [
          {
            id: 'cbse',
            name: 'CBSE (Central Board of Secondary Education)',
            topics: [
              { id: 'cbse-class-9', name: 'Class 9 All Subjects', subtopics: [{ id: 'c9-math', name: 'Mathematics' }, { id: 'c9-sci', name: 'Science' }] },
              { id: 'cbse-class-10', name: 'Class 10 Board Preparation', subtopics: [{ id: 'c10-math', name: 'Standard Mathematics' }, { id: 'c10-sci', name: 'Integrated Science' }, { id: 'c10-sst', name: 'Social Science' }] },
              { id: 'cbse-class-11', name: 'Class 11 Senior Secondary', subtopics: [{ id: 'c11-phy', name: 'Physics' }, { id: 'c11-chem', name: 'Chemistry' }, { id: 'c11-math', name: 'Mathematics' }, { id: 'c11-bio', name: 'Biology' }, { id: 'c11-cs', name: 'Computer Science' }] },
              { id: 'cbse-class-12', name: 'Class 12 Board Mastery', subtopics: [{ id: 'c12-phy', name: 'Physics' }, { id: 'c12-chem', name: 'Chemistry' }, { id: 'c12-math', name: 'Mathematics' }, { id: 'c12-bio', name: 'Biology' }, { id: 'c12-acc', name: 'Accountancy' }, { id: 'c12-eco', name: 'Economics' }] },
            ],
          },
          {
            id: 'icse-isc',
            name: 'ICSE & ISC (CISCE)',
            topics: [
              { id: 'icse-10', name: 'ICSE Class 10', subtopics: [{ id: 'icse-phy', name: 'Physics' }, { id: 'icse-chem', name: 'Chemistry' }, { id: 'icse-math', name: 'Mathematics' }] },
              { id: 'isc-12', name: 'ISC Class 12', subtopics: [{ id: 'isc-phy', name: 'Physics' }, { id: 'isc-chem', name: 'Chemistry' }, { id: 'isc-math', name: 'Mathematics' }] },
            ],
          },
          {
            id: 'state-boards',
            name: 'State Boards & NIOS',
            topics: [
              { id: 'mh-state-board', name: 'Maharashtra State Board (HSC/SSC)' },
              { id: 'nios', name: 'National Institute of Open Schooling (NIOS)' },
              { id: 'other-state-boards', name: 'Karnataka, Tamil Nadu, UP, WB & Andhra State Boards' },
            ],
          },
          {
            id: 'international-boards',
            name: 'International Curricula (IB & Cambridge)',
            topics: [
              { id: 'ib-myp', name: 'IB Middle Years Programme (MYP)' },
              { id: 'ib-dp', name: 'IB Diploma Programme (DP) HL/SL', subtopics: [{ id: 'ib-math-aa', name: 'Mathematics Analysis & Approaches' }, { id: 'ib-physics-hl', name: 'Physics Higher Level' }] },
              { id: 'cambridge-igcse', name: 'Cambridge IGCSE' },
              { id: 'cambridge-as-a', name: 'Cambridge International AS & A Level' },
            ],
          },
        ],
      },
      {
        id: 'school-subjects',
        name: 'Core School Subjects',
        subjects: [
          {
            id: 'school-math',
            name: 'Mathematics',
            topics: [
              { id: 'sm-algebra', name: 'Polynomials & Quadratic Equations' },
              { id: 'sm-trig', name: 'Trigonometry & Heights/Distances' },
              { id: 'sm-calculus', name: 'Differential & Integral Calculus' },
              { id: 'sm-coordinate', name: 'Coordinate Geometry & Conic Sections' },
              { id: 'sm-vectors', name: 'Vectors & 3D Geometry' },
            ],
          },
          {
            id: 'school-physics',
            name: 'Physics',
            topics: [
              { id: 'sp-mechanics', name: 'Laws of Motion & Rotational Dynamics' },
              { id: 'sp-thermo', name: 'Thermodynamics & Kinetic Theory' },
              { id: 'sp-electromagnetism', name: 'Electrostatics & Current Electricity' },
              { id: 'sp-optics', name: 'Ray & Wave Optics' },
              { id: 'sp-modern', name: 'Modern Physics & Dual Nature' },
            ],
          },
          {
            id: 'school-chemistry',
            name: 'Chemistry',
            topics: [
              { id: 'sc-physical', name: 'Solutions, Electrochemistry & Kinetics' },
              { id: 'sc-inorganic', name: 'Coordination Compounds & p-Block/d-Block' },
              { id: 'sc-organic', name: 'Haloalkanes, Haloarenes & Biomolecules' },
            ],
          },
          {
            id: 'school-biology',
            name: 'Biology',
            topics: [
              { id: 'sb-genetics', name: 'Genetics, Evolution & Molecular Basis' },
              { id: 'sb-human-phys', name: 'Human Physiology & Anatomy' },
              { id: 'sb-ecology', name: 'Ecology & Environment' },
            ],
          },
          {
            id: 'school-humanities',
            name: 'Social Sciences & Humanities',
            topics: [
              { id: 'sh-history', name: 'Modern Indian & World History' },
              { id: 'sh-geography', name: 'Physical & Human Geography' },
              { id: 'sh-polsci', name: 'Indian Constitution & Political Science' },
              { id: 'sh-economics', name: 'Microeconomics & Macroeconomics' },
            ],
          },
          {
            id: 'school-languages',
            name: 'Languages & Literature',
            topics: [
              { id: 'sl-english', name: 'English Literature & Reading Comprehension' },
              { id: 'sl-hindi', name: 'Hindi Core & Elective (Grammar & Sahitya)' },
              { id: 'sl-marathi', name: 'Marathi Language & Literature' },
              { id: 'sl-sanskrit', name: 'Sanskrit Grammar & Classical Texts' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'engineering-technology',
    name: 'Engineering & Technology',
    description: 'Computer Science, Artificial Intelligence, Robotics, Software & Core Engineering.',
    icon: 'terminal',
    popularTopics: ['Data Structures & Algorithms', 'Machine Learning Foundations', 'System Design', 'Cloud Architecture', 'Full-Stack Development'],
    disciplines: [
      {
        id: 'cs-ai',
        name: 'Computer Science & AI',
        subjects: [
          {
            id: 'ai-ml',
            name: 'Artificial Intelligence & Machine Learning',
            topics: [
              { id: 'ml-foundations', name: 'Machine Learning Foundations', subtopics: [{ id: 'sup-learn', name: 'Supervised Learning' }, { id: 'un-sup', name: 'Unsupervised Learning & Clustering' }] },
              { id: 'deep-learning', name: 'Deep Learning & Neural Networks', subtopics: [{ id: 'backprop', name: 'Backpropagation' }, { id: 'cnns', name: 'CNNs for Computer Vision' }, { id: 'rnns', name: 'RNNs & LSTMs' }] },
              { id: 'gen-ai-llms', name: 'Generative AI & Large Language Models', subtopics: [{ id: 'transformers', name: 'Transformer Architecture & Self-Attention' }, { id: 'peft-lora', name: 'PEFT, LoRA & QLoRA Fine-Tuning' }, { id: 'rag-systems', name: 'Retrieval-Augmented Generation (RAG)' }, { id: 'rlhf', name: 'RLHF & Alignment' }] },
              { id: 'nlp', name: 'Natural Language Processing', subtopics: [{ id: 'tokenization', name: 'Tokenization & Embeddings' }, { id: 'seq2seq', name: 'Seq2Seq Modeling' }] },
              { id: 'computer-vision', name: 'Computer Vision & Image Processing' },
            ],
          },
          {
            id: 'software-dev',
            name: 'Software Engineering & Development',
            topics: [
              { id: 'dsa', name: 'Algorithms and Data Structures', subtopics: [{ id: 'arrays-trees', name: 'Trees, Graphs & Heaps' }, { id: 'dynamic-prog', name: 'Dynamic Programming' }] },
              { id: 'system-design', name: 'System Design & High-Scalability Architecture', subtopics: [{ id: 'microservices', name: 'Microservices & Distributed Systems' }, { id: 'caching-queues', name: 'Caching, Message Queues & Load Balancing' }] },
              { id: 'web-dev', name: 'Web & Full-Stack Development', subtopics: [{ id: 'react-next', name: 'React & Next.js Full Stack' }, { id: 'node-backend', name: 'Node.js, Express & REST/GraphQL APIs' }] },
              { id: 'mobile-dev', name: 'Mobile App Development (Android / iOS / Flutter)' },
              { id: 'database-systems', name: 'Database Management Systems (PostgreSQL, NoSQL, Redis)' },
              { id: 'os-networking', name: 'Operating Systems & Computer Networking' },
            ],
          },
          {
            id: 'devops-cyber',
            name: 'Cloud, DevOps & Cybersecurity',
            topics: [
              { id: 'cloud-aws', name: 'Cloud Computing & AWS Architecture' },
              { id: 'devops-k8s', name: 'DevOps, Docker & Kubernetes Orchestration' },
              { id: 'cybersecurity', name: 'Cybersecurity, Cryptography & Ethical Hacking' },
            ],
          },
        ],
      },
      {
        id: 'core-engineering',
        name: 'Core Engineering Disciplines',
        subjects: [
          {
            id: 'ece-vlsi',
            name: 'Electronics & Communication',
            topics: [
              { id: 'vlsi-design', name: 'VLSI Design & Semiconductor Technology' },
              { id: 'embedded-iot', name: 'Embedded Systems & Internet of Things (IoT)' },
              { id: 'signals-systems', name: 'Signals and Systems & DSP' },
            ],
          },
          {
            id: 'mechanical-eng',
            name: 'Mechanical Engineering',
            topics: [
              { id: 'eng-mechanics', name: 'Engineering Mechanics & Strength of Materials' },
              { id: 'thermo-fluid', name: 'Thermodynamics & Fluid Mechanics' },
              { id: 'cad-manufacturing', name: 'Manufacturing Processes & CAD/CAM' },
              { id: 'robotics-mechatronics', name: 'Robotics & Mechatronics' },
            ],
          },
          {
            id: 'civil-chemical-eng',
            name: 'Civil, Chemical & Aerospace Engineering',
            topics: [
              { id: 'structural-analysis', name: 'Structural Analysis & Geotechnical Engineering' },
              { id: 'chemical-reaction', name: 'Chemical Reaction Engineering & Transport Phenomena' },
              { id: 'aerodynamics', name: 'Aerodynamics & Propulsion Systems' },
              { id: 'biotech-eng', name: 'Biotechnology Engineering & Bioprocess' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'medical-health',
    name: 'Medical & Health Sciences',
    description: 'Human Anatomy, Clinical Medicine, Pharmacology, Nursing & Healthcare.',
    icon: 'stethoscope',
    popularTopics: ['Human Anatomy', 'Pathology & Diagnostics', 'Clinical Pharmacology', 'Microbiology', 'Forensic Medicine'],
    disciplines: [
      {
        id: 'pre-clinical',
        name: 'Pre-Clinical & Para-Clinical Sciences',
        subjects: [
          {
            id: 'anatomy-physio',
            name: 'Anatomy, Physiology & Biochemistry',
            topics: [
              { id: 'gross-anatomy', name: 'Gross Anatomy, Neuroanatomy & Embryology' },
              { id: 'systemic-physio', name: 'Systemic Human Physiology (Cardio, Renal, Neuro)' },
              { id: 'med-biochem', name: 'Medical Biochemistry & Metabolic Pathways' },
            ],
          },
          {
            id: 'patho-pharm',
            name: 'Pathology, Pharmacology & Microbiology',
            topics: [
              { id: 'gen-pathology', name: 'General & Systemic Pathology' },
              { id: 'pharmacology', name: 'Clinical Pharmacology & Therapeutics' },
              { id: 'medical-microbio', name: 'Medical Microbiology & Immunology' },
              { id: 'forensic-med', name: 'Forensic Medicine & Toxicology' },
            ],
          },
        ],
      },
      {
        id: 'clinical-sciences',
        name: 'Clinical Medicine & Allied Health',
        subjects: [
          {
            id: 'general-med-surgery',
            name: 'Medicine & Surgery',
            topics: [
              { id: 'internal-med', name: 'Internal Medicine & Diagnostic Workups' },
              { id: 'general-surgery', name: 'General Surgery & Operative Techniques' },
              { id: 'pediatrics', name: 'Pediatrics & Neonatology' },
              { id: 'ob-gyn', name: 'Obstetrics & Gynecology' },
            ],
          },
          {
            id: 'allied-health-dental',
            name: 'Dentistry, Nursing & Allied Health',
            topics: [
              { id: 'dentistry', name: 'Dentistry & Oral Maxillofacial Surgery' },
              { id: 'nursing-care', name: 'Clinical Nursing & Critical Care' },
              { id: 'pharmacy', name: 'Pharmaceutics & Clinical Pharmacy' },
              { id: 'physiotherapy', name: 'Physiotherapy & Rehabilitation Sciences' },
              { id: 'radiology-mlt', name: 'Radiology, Medical Laboratory Technology & Diagnostics' },
              { id: 'public-health', name: 'Public Health, Epidemiology & Community Medicine' },
              { id: 'nutrition-dietetics', name: 'Clinical Nutrition & Dietetics' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'business-management',
    name: 'Business, Management & Commerce',
    description: 'Corporate Finance, Marketing, Economics, Entrepreneurship, Supply Chain & Strategy.',
    icon: 'monitoring',
    popularTopics: ['Financial Accounting & Modeling', 'Corporate Finance', 'Strategic Marketing', 'Product Management', 'Supply Chain Management'],
    disciplines: [
      {
        id: 'mgmt-strategy',
        name: 'Management & Strategy',
        subjects: [
          {
            id: 'business-admin',
            name: 'Business Administration & Leadership',
            topics: [
              { id: 'business-strategy', name: 'Business Strategy & Competitive Advantage' },
              { id: 'product-mgmt', name: 'Product Management & Lifecycle Design' },
              { id: 'project-mgmt', name: 'Project Management (PMP, Agile, Scrum)' },
              { id: 'operations-scm', name: 'Operations & Supply Chain Management' },
              { id: 'entrepreneurship', name: 'Entrepreneurship & Venture Creation' },
            ],
          },
          {
            id: 'marketing-sales',
            name: 'Marketing & Consumer Analytics',
            topics: [
              { id: 'digital-marketing', name: 'Digital Marketing & Growth Engineering' },
              { id: 'brand-strategy', name: 'Brand Strategy & Market Positioning' },
              { id: 'consumer-behavior', name: 'Consumer Behavior & Market Research' },
              { id: 'b2b-sales', name: 'Enterprise Sales & Revenue Operations' },
            ],
          },
        ],
      },
      {
        id: 'finance-commerce',
        name: 'Finance, Banking & Analytics',
        subjects: [
          {
            id: 'corporate-finance',
            name: 'Corporate Finance & Investment',
            topics: [
              { id: 'fin-modeling', name: 'Financial Modeling & Valuation (DCF, LBO)' },
              { id: 'investment-banking', name: 'Investment Banking & Capital Markets' },
              { id: 'banking-insurance', name: 'Commercial Banking & Risk Management' },
              { id: 'fin-accounting', name: 'Financial Accounting & Balance Sheet Analysis' },
            ],
          },
          {
            id: 'business-analytics',
            name: 'Analytics & Business Economics',
            topics: [
              { id: 'biz-analytics', name: 'Business Analytics & Predictive Modeling' },
              { id: 'managerial-econ', name: 'Managerial Economics & Pricing Strategies' },
              { id: 'hr-analytics', name: 'Human Resource Management & Organizational Behavior' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'science-mathematics',
    name: 'Science & Mathematics',
    description: 'Pure and Applied Mathematics, Quantum Physics, Chemistry, Astrophysics & Biology.',
    icon: 'biotech',
    popularTopics: ['Multivariable Calculus', 'Quantum Mechanics', 'Linear Algebra', 'Statistical Inference', 'Molecular Biology'],
    disciplines: [
      {
        id: 'mathematical-sciences',
        name: 'Pure & Applied Mathematics',
        subjects: [
          {
            id: 'pure-math',
            name: 'Pure Mathematics',
            topics: [
              { id: 'real-analysis', name: 'Real Analysis & Measure Theory' },
              { id: 'abstract-algebra', name: 'Abstract Algebra, Groups & Rings' },
              { id: 'complex-analysis', name: 'Complex Analysis & Contour Integration' },
              { id: 'topology', name: 'Topology & Differential Geometry' },
            ],
          },
          {
            id: 'applied-math',
            name: 'Applied Mathematics & Statistics',
            topics: [
              { id: 'linear-algebra-adv', name: 'Linear Algebra & Matrix Decompositions' },
              { id: 'diff-equations', name: 'Partial Differential Equations (PDEs)' },
              { id: 'probability-stats', name: 'Probability Theory & Mathematical Statistics' },
              { id: 'scientific-computing', name: 'Numerical Analysis & Scientific Computing' },
            ],
          },
        ],
      },
      {
        id: 'physical-biological-sciences',
        name: 'Physical & Natural Sciences',
        subjects: [
          {
            id: 'physics-astronomy',
            name: 'Physics & Astrophysics',
            topics: [
              { id: 'quantum-mechanics', name: 'Quantum Mechanics & Hilbert Spaces' },
              { id: 'classical-electrodynamics', name: 'Classical Electrodynamics & Maxwell Fields' },
              { id: 'stat-mechanics', name: 'Statistical Mechanics & Phase Transitions' },
              { id: 'astrophysics', name: 'Astronomy, Astrophysics & Cosmology' },
              { id: 'condensed-matter', name: 'Condensed Matter & Materials Science' },
            ],
          },
          {
            id: 'chemistry-earth',
            name: 'Chemistry, Earth & Environmental',
            topics: [
              { id: 'adv-organic-chem', name: 'Synthetic Organic Chemistry & Retrosynthesis' },
              { id: 'physical-chem', name: 'Quantum Chemistry & Spectroscopy' },
              { id: 'earth-geology', name: 'Geology, Geophysics & Earth Systems' },
              { id: 'environmental-sci', name: 'Environmental Science & Climate Dynamics' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'arts-humanities',
    name: 'Arts, Humanities & Social Sciences',
    description: 'History, Philosophy, Psychology, Political Science, Literature, Design & Music.',
    icon: 'palette',
    popularTopics: ['Modern World History', 'Cognitive Psychology', 'Political Philosophy', 'Linguistics', 'Architecture History'],
    disciplines: [
      {
        id: 'humanities-philosophy',
        name: 'Humanities & Philosophy',
        subjects: [
          {
            id: 'history-archeology',
            name: 'History & Archaeology',
            topics: [
              { id: 'ancient-history', name: 'Ancient & Medieval Civilizations' },
              { id: 'modern-history', name: 'Modern World History & Decolonization' },
              { id: 'indian-history', name: 'Ancient, Medieval & Modern Indian History' },
              { id: 'archaeology', name: 'Archaeological Methods & Material Culture' },
            ],
          },
          {
            id: 'philosophy-lit',
            name: 'Philosophy & Literature',
            topics: [
              { id: 'epistemology-ethics', name: 'Epistemology, Ethics & Moral Philosophy' },
              { id: 'political-philosophy', name: 'Political Philosophy & Social Theory' },
              { id: 'world-literature', name: 'World Literature & Literary Theory' },
              { id: 'linguistics', name: 'Linguistics, Syntax, Phonetics & Semantics' },
            ],
          },
        ],
      },
      {
        id: 'social-sciences-arts',
        name: 'Social Sciences & Creative Arts',
        subjects: [
          {
            id: 'psychology-sociology',
            name: 'Psychology, Sociology & Politics',
            topics: [
              { id: 'cognitive-psych', name: 'Cognitive & Behavioral Psychology' },
              { id: 'sociology-theory', name: 'Sociological Theory & Social Stratification' },
              { id: 'political-science', name: 'Comparative Politics & International Relations' },
              { id: 'anthropology', name: 'Cultural & Physical Anthropology' },
            ],
          },
          {
            id: 'creative-arts-design',
            name: 'Visual Arts, Design & Music',
            topics: [
              { id: 'fine-arts-history', name: 'Art History & Visual Culture' },
              { id: 'design-thinking', name: 'Industrial & Architectural Design' },
              { id: 'film-media', name: 'Film Studies, Cinematography & Mass Communication' },
              { id: 'music-theory', name: 'Music Theory, Composition & Ethnomusicology' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'law-government',
    name: 'Law & Government',
    description: 'Constitutional Law, Jurisprudence, Corporate Law, Public Policy & Governance.',
    icon: 'gavel',
    popularTopics: ['Constitutional Law of India', 'Criminal Law & IPC/BNS', 'Corporate & Securities Law', 'Intellectual Property Law', 'Public Administration'],
    disciplines: [
      {
        id: 'legal-studies',
        name: 'Legal Jurisprudence & Systems',
        subjects: [
          {
            id: 'constitutional-criminal',
            name: 'Public & Criminal Law',
            topics: [
              { id: 'constitutional-law', name: 'Constitutional Law & Judicial Review' },
              { id: 'criminal-law', name: 'Criminal Law, Procedure & Evidence' },
              { id: 'civil-procedure', name: 'Civil Procedure & Law of Torts' },
              { id: 'administrative-law', name: 'Administrative Law & Regulatory Governance' },
            ],
          },
          {
            id: 'commercial-intl-law',
            name: 'Commercial, IP & International Law',
            topics: [
              { id: 'corporate-law', name: 'Corporate Governance & Company Law' },
              { id: 'ip-law', name: 'Intellectual Property (Patents, Trademarks, Copyright)' },
              { id: 'international-law', name: 'Public & Private International Law' },
              { id: 'tax-law', name: 'Direct & Indirect Taxation Law (GST, Income Tax)' },
              { id: 'environmental-human-rights', name: 'Environmental Law & International Human Rights' },
              { id: 'legal-research', name: 'Legal Research & Case Brief Drafting' },
            ],
          },
        ],
      },
      {
        id: 'governance-policy',
        name: 'Public Policy & Administration',
        subjects: [
          {
            id: 'public-admin',
            name: 'Public Administration & Policy',
            topics: [
              { id: 'public-policy-analysis', name: 'Public Policy Formulation & Evaluation' },
              { id: 'governance-ethics', name: 'Ethics in Governance & Civil Service Leadership' },
              { id: 'development-admin', name: 'Development Administration & Welfare Schemes' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'finance-qualifications',
    name: 'Finance, Accounting & Professional Qualifications',
    description: 'Chartered Accountancy, CMA, CS, CFA, FRM, Auditing, Tax & Actuarial Science.',
    icon: 'receipt_long',
    popularTopics: ['CA Final Financial Reporting', 'CFA Level 1 Quantitative Methods', 'Direct & Indirect Taxation', 'Auditing & Assurance', 'Financial Modeling'],
    disciplines: [
      {
        id: 'chartered-accounting',
        name: 'Accounting Professional Bodies (CA / CMA / CS)',
        subjects: [
          {
            id: 'icai-ca',
            name: 'Chartered Accountancy (ICAI)',
            topics: [
              { id: 'ca-foundation', name: 'CA Foundation (Accounting, Law, Quant, Business)' },
              { id: 'ca-inter', name: 'CA Intermediate (Advanced Accounting, Tax, Costing, Audit)' },
              { id: 'ca-final', name: 'CA Final (Financial Reporting, Strategic Financial Mgmt, Audit)' },
            ],
          },
          {
            id: 'cma-cs',
            name: 'Cost Accountancy & Company Secretary',
            topics: [
              { id: 'cma-qual', name: 'CMA Foundation, Inter & Final (Cost & Management Accounting)' },
              { id: 'cs-qual', name: 'CS Executive & Professional (Company Law, Capital Markets)' },
            ],
          },
        ],
      },
      {
        id: 'global-finance',
        name: 'Global Finance & Actuarial',
        subjects: [
          {
            id: 'cfa-frm-acca',
            name: 'Global Professional Charters (CFA, FRM, ACCA, CPA)',
            topics: [
              { id: 'cfa-prep', name: 'CFA Level I, II & III Curriculum' },
              { id: 'frm-prep', name: 'Financial Risk Manager (FRM Part I & II)' },
              { id: 'acca-cpa', name: 'ACCA & US CPA Exam Preparation' },
              { id: 'actuarial-science', name: 'Actuarial Science & Life Contingencies' },
            ],
          },
          {
            id: 'applied-finance',
            name: 'Applied Financial Practices',
            topics: [
              { id: 'financial-accounting-standards', name: 'Ind AS, IFRS & US GAAP Standards' },
              { id: 'forensic-audit', name: 'Forensic Accounting & Fraud Auditing' },
              { id: 'risk-analytics', name: 'Market & Credit Risk Modeling' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'vocational-professional',
    name: 'Vocational & Applied Technical Skills',
    description: 'Industrial trades, UI/UX, Graphic Design, Electrical, Manufacturing, Hospitality.',
    icon: 'build',
    popularTopics: ['UI/UX Design Systems', 'Graphic Design & Branding', 'Video Editing & Motion Graphics', 'Electrical Installation', 'Automotive Diagnostics'],
    disciplines: [
      {
        id: 'design-media',
        name: 'Design, Media & Digital Arts',
        subjects: [
          {
            id: 'ui-ux-design',
            name: 'UI/UX & Product Design',
            topics: [
              { id: 'ui-design-figma', name: 'Figma Design Systems & Visual Hierarchy' },
              { id: 'ux-research', name: 'User Research, Wireframing & Usability Testing' },
              { id: 'interaction-design', name: 'Micro-interactions & Prototyping' },
            ],
          },
          {
            id: 'digital-media',
            name: 'Digital Media, Graphic Design & Video',
            topics: [
              { id: 'graphic-design', name: 'Brand Identity & Graphic Design' },
              { id: 'video-editing', name: 'Video Editing (Premiere, DaVinci Resolve)' },
              { id: 'motion-graphics', name: 'Motion Graphics & 2D/3D Animation' },
              { id: 'commercial-photo', name: 'Commercial Photography & Post-Processing' },
            ],
          },
        ],
      },
      {
        id: 'trades-industry',
        name: 'Technical Trades & Industry Skills',
        subjects: [
          {
            id: 'industrial-trades',
            name: 'Electrical, Mechanical & Construction',
            topics: [
              { id: 'electrician-training', name: 'Industrial & Domestic Electrician Certification' },
              { id: 'plumbing-hvac', name: 'Plumbing & HVAC Systems' },
              { id: 'automotive-tech', name: 'Automotive Mechanics & EV Powertrains' },
              { id: 'cnc-machining', name: 'CNC Machining, Lathe & Welding Technology' },
              { id: 'construction-supervision', name: 'Construction Technology & Site Management' },
            ],
          },
          {
            id: 'hospitality-business-skills',
            name: 'Hospitality & Practical Services',
            topics: [
              { id: 'culinary-arts', name: 'Culinary Arts & Food Safety (HACCP)' },
              { id: 'hospitality-mgmt', name: 'Hotel & Hospitality Operations' },
              { id: 'office-productivity', name: 'Advanced Office Productivity (Excel, Automation)' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'languages-communication',
    name: 'Languages & Communication',
    description: 'English, Indian Languages, World Languages, Phonetics, Grammar & Fluency.',
    icon: 'translate',
    popularTopics: ['Advanced English Fluency', 'Spoken Hindi & Grammar', 'Conversational Japanese', 'French for Beginners', 'Sanskrit Classical Grammar'],
    disciplines: [
      {
        id: 'indian-languages',
        name: 'Indian Languages',
        subjects: [
          {
            id: 'indic-languages',
            name: 'Classical & Regional Indian Languages',
            topics: [
              { id: 'hindi-mastery', name: 'Hindi (Grammar, Conversation, Literary Sahitya)' },
              { id: 'marathi-mastery', name: 'Marathi (Spoken, Grammar & Formal Writing)' },
              { id: 'sanskrit-classical', name: 'Sanskrit (Vyakaran, Paninian Sutras, Shlokas)' },
              { id: 'tamil-language', name: 'Tamil (Classical & Spoken Fluency)' },
              { id: 'bengali-language', name: 'Bengali (Grammar, Reading & Conversation)' },
              { id: 'telugu-language', name: 'Telugu (Grammar & Spoken Fluency)' },
            ],
          },
        ],
      },
      {
        id: 'global-languages',
        name: 'International World Languages',
        subjects: [
          {
            id: 'english-fluency',
            name: 'English Mastery & Communication',
            topics: [
              { id: 'english-grammar-vocab', name: 'English Grammar, Syntax & Lexicon Building' },
              { id: 'business-english', name: 'Professional & Business English Communication' },
              { id: 'academic-english', name: 'Academic English & Critical Reading' },
              { id: 'pronunciation-speaking', name: 'Pronunciation, Accent Training & Public Speaking' },
            ],
          },
          {
            id: 'foreign-languages',
            name: 'Major World Languages',
            topics: [
              { id: 'french-language', name: 'French (A1 to C2 Grammar, Vocab, DELF Prep)' },
              { id: 'german-language', name: 'German (A1 to C1 Goethe-Zertifikat Prep)' },
              { id: 'spanish-language', name: 'Spanish (DELE A1 to B2 Conversational Mastery)' },
              { id: 'japanese-language', name: 'Japanese (JLPT N5 to N1, Kanji, Kana)' },
              { id: 'korean-language', name: 'Korean (Hangul, TOPIK I & II, Conversational)' },
              { id: 'mandarin-language', name: 'Mandarin Chinese (HSK 1-6, Pinyin, Characters)' },
              { id: 'arabic-language', name: 'Modern Standard Arabic & Classical Grammar' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'research-academic',
    name: 'Research & Academic Development',
    description: 'Methodology, Academic Publishing, Thesis Formulation, Citation & Statistical Analysis.',
    icon: 'menu_book',
    popularTopics: ['Research Methodology & Experimental Design', 'Scientific Writing & LaTeX', 'Literature Review Synthesis', 'Statistical Data Analysis (R / Python)', 'Thesis & Dissertation Preparation'],
    disciplines: [
      {
        id: 'research-foundations',
        name: 'Methodology & Experimental Design',
        subjects: [
          {
            id: 'methodology-design',
            name: 'Research Design & Quantitative Analysis',
            topics: [
              { id: 'research-methods', name: 'Quantitative & Qualitative Research Methodologies' },
              { id: 'experimental-design', name: 'Experimental Design, Control Variables & Sampling' },
              { id: 'stats-in-research', name: 'Statistical Testing (ANOVA, Regression, Hypothesis Testing)' },
              { id: 'data-viz-research', name: 'Scientific Data Visualization & Charts' },
            ],
          },
          {
            id: 'academic-writing',
            name: 'Academic Writing & Publishing',
            topics: [
              { id: 'paper-writing', name: 'Writing High-Impact Peer-Reviewed Journal Papers' },
              { id: 'lit-review', name: 'Systematic Literature Review & Meta-Analysis' },
              { id: 'thesis-dissertation', name: 'Thesis & Dissertation Structuring and Defense' },
              { id: 'citation-mgmt', name: 'Citation Standards (APA, IEEE, Chicago) & Zotero/Mendeley' },
              { id: 'latex-academic', name: 'LaTeX for Scholarly Manuscripts & Mathematical Layouts' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'personal-practical',
    name: 'Personal & Practical Learning',
    description: 'Critical Thinking, Productivity, Personal Finance, Communication & Leadership.',
    icon: 'psychology',
    popularTopics: ['Critical Thinking & Problem Solving', 'Personal Finance & Investing Basics', 'Public Speaking & Presentation', 'Productivity & Time Architecture', 'Creative Writing'],
    disciplines: [
      {
        id: 'cognitive-skills',
        name: 'Cognitive & Thinking Frameworks',
        subjects: [
          {
            id: 'thinking-mastery',
            name: 'Logic, Reasoning & Decision Making',
            topics: [
              { id: 'critical-thinking', name: 'Critical Thinking & Mental Models' },
              { id: 'formal-logic', name: 'Formal Logic, Cognitive Biases & Fallacies' },
              { id: 'memory-techniques', name: 'Memory Palaces, Spaced Repetition & Mnemonic Mastery' },
              { id: 'problem-solving', name: 'First Principles & Structured Problem Solving' },
            ],
          },
          {
            id: 'personal-effectiveness',
            name: 'Productivity & Life Architecture',
            topics: [
              { id: 'personal-finance', name: 'Personal Finance, Budgeting & Index Investing' },
              { id: 'public-speaking', name: 'Public Speaking, Oratory & Persuasion' },
              { id: 'creative-writing', name: 'Creative Writing, Storytelling & Essay Craft' },
              { id: 'leadership-comm', name: 'Interpersonal Communication & Empathetic Leadership' },
              { id: 'digital-literacy', name: 'Digital Literacy, Privacy & AI Tool Mastery' },
            ],
          },
        ],
      },
    ],
  },
];

export interface SearchDomainResult {
  domainId: string;
  domainName: string;
  disciplineId?: string;
  disciplineName?: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  subtopicId?: string;
  subtopicName?: string;
  displayName: string;
  type: 'domain' | 'subject' | 'topic' | 'subtopic';
  score: number;
}

/**
 * Searches across all hierarchical nodes in the domain catalog.
 * Supports fuzzy matching, synonym keywords, and cascading selections.
 */
export function searchEducationalDomain(query: string, maxResults = 10): SearchDomainResult[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const results: SearchDomainResult[] = [];
  const queryTokens = clean.split(/\s+/).filter(Boolean);

  for (const domain of EDUCATIONAL_DOMAINS) {
    const domainMatch = domain.name.toLowerCase().includes(clean);
    if (domainMatch) {
      results.push({
        domainId: domain.id,
        domainName: domain.name,
        displayName: domain.name,
        type: 'domain',
        score: clean === domain.name.toLowerCase() ? 100 : 70,
      });
    }

    for (const discipline of domain.disciplines) {
      for (const subject of discipline.subjects) {
        const subName = subject.name.toLowerCase();
        let subScore = 0;
        if (subName === clean) subScore = 95;
        else if (subName.includes(clean)) subScore = 80;
        else if (queryTokens.every(t => subName.includes(t))) subScore = 75;

        if (subScore > 0) {
          results.push({
            domainId: domain.id,
            domainName: domain.name,
            disciplineId: discipline.id,
            disciplineName: discipline.name,
            subjectId: subject.id,
            subjectName: subject.name,
            displayName: `${subject.name} (${domain.name})`,
            type: 'subject',
            score: subScore,
          });
        }

        for (const topic of subject.topics) {
          const topName = topic.name.toLowerCase();
          let topScore = 0;
          if (topName === clean) topScore = 90;
          else if (topName.includes(clean)) topScore = 78;
          else if (queryTokens.every(t => topName.includes(t))) topScore = 72;

          if (topScore > 0) {
            results.push({
              domainId: domain.id,
              domainName: domain.name,
              disciplineId: discipline.id,
              disciplineName: discipline.name,
              subjectId: subject.id,
              subjectName: subject.name,
              topicId: topic.id,
              topicName: topic.name,
              displayName: `${topic.name} · ${subject.name}`,
              type: 'topic',
              score: topScore,
            });
          }

          if (topic.subtopics) {
            for (const sub of topic.subtopics) {
              const sName = sub.name.toLowerCase();
              let sScore = 0;
              if (sName === clean) sScore = 85;
              else if (sName.includes(clean)) sScore = 74;
              else if (queryTokens.every(t => sName.includes(t))) sScore = 68;

              if (sScore > 0) {
                results.push({
                  domainId: domain.id,
                  domainName: domain.name,
                  disciplineId: discipline.id,
                  disciplineName: discipline.name,
                  subjectId: subject.id,
                  subjectName: subject.name,
                  topicId: topic.id,
                  topicName: topic.name,
                  subtopicId: sub.id,
                  subtopicName: sub.name,
                  displayName: `${sub.name} (${topic.name})`,
                  type: 'subtopic',
                  score: sScore,
                });
              }
            }
          }
        }
      }
    }
  }

  // Sort by score descending and deduplicate display names
  results.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const uniqueResults: SearchDomainResult[] = [];
  for (const r of results) {
    if (!seen.has(r.displayName)) {
      seen.add(r.displayName);
      uniqueResults.push(r);
      if (uniqueResults.length >= maxResults) break;
    }
  }

  return uniqueResults;
}

/**
 * Returns dynamic suggestions based on domain ID or current input.
 */
export function getDomainTopicSuggestions(domainId?: string): string[] {
  if (!domainId) {
    return [
      'JEE Advanced Physics: Rotational Dynamics',
      'Python Programming: Concurrency & Asyncio',
      'Class 12 Organic Chemistry: Haloalkanes',
      'Data Structures & Algorithms in C++',
      'UPSC Indian Polity & Constitution',
      'Machine Learning: Transformer Models',
      'Corporate Financial Modeling & Valuation',
      'MBBS Clinical Pharmacology',
    ];
  }

  const domain = EDUCATIONAL_DOMAINS.find(d => d.id === domainId);
  return domain?.popularTopics || [];
}

/**
 * Finds a domain by ID or generates a consistent fallback.
 */
export function getDomainById(domainId: string): EducationalDomain | undefined {
  return EDUCATIONAL_DOMAINS.find(d => d.id === domainId);
}
