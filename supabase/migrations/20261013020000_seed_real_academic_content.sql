-- =============================================================================
-- Migration: 20261013020000_seed_real_academic_content.sql
-- Description: Unpublishes legacy mock courses and seeds real, verifiable
--              academic courses from MIT OpenCourseWare (MIT Learn API).
-- =============================================================================

-- 1. DEACTIVATE / UNPUBLISH LEGACY MOCK & SYNTHESIZED COURSES
UPDATE public.learning_paths
SET is_published = FALSE,
    updated_at = NOW()
WHERE id IN (
  'jee-physics',
  'python-foundations',
  'calculus-3',
  'modern-ai',
  'organic-chemistry',
  'a-to-z-comprehensive-mastery-pat-mutqv4nb',
  'advanced-ai-engineering-from-tra-mutq7hab',
  'python-foundations-computational-mv6cro8p',
  'foundations-of-attention-mechani-mutpu81c',
  'advanced-rotational-dynamics-fro-mutq0uz5',
  'jee-maths-mastering-differential-muqmzehb'
);

-- 2. INSERT REAL MIT OPENCOURSEWARE ACADEMIC PATHS
INSERT INTO public.learning_paths (
  id, title, description, domain, level, duration_hours, module_count, verified,
  enrolled_count, average_completion, syllabus_note, tags, weekly_checkpoint, is_published
) VALUES
(
  'mit-8-012-physics-i-classical-mechanics',
  'MIT 8.012: Physics I - Classical Mechanics',
  'An advanced, calculus-based formulation of classical mechanics covering kinematics, Newton''s laws with variable mass systems, momentum, work-energy theorems, angular momentum, central force motion, and special relativity.',
  'Physics',
  'Undergraduate',
  45,
  4,
  TRUE,
  0,
  NULL,
  'Official curriculum from Massachusetts Institute of Technology, Department of Physics (MIT OCW). Verified under Creative Commons BY-NC-SA 4.0.',
  ARRAY['Classical Mechanics', 'Newtonian Mechanics', 'Vectors & Kinematics', 'MIT OCW', 'Physics Dept 8'],
  '{"title": "Module 1 Checkpoint: Kinematics & Momentum", "description": "Verify analytical vector decomposition and conservation equations.", "progressPercent": 0}'::jsonb,
  TRUE
),
(
  'mit-18-02-multivariable-calculus',
  'MIT 18.02: Multivariable Calculus',
  'Vector algebra, dot and cross products, partial derivatives, gradient vectors, Lagrange multipliers, double and triple integrals in Cartesian, cylindrical and spherical coordinates, line and surface integrals, Green''s Theorem, Divergence Theorem, and Stokes'' Theorem.',
  'Mathematics',
  'Undergraduate',
  40,
  4,
  TRUE,
  0,
  NULL,
  'Official curriculum from Massachusetts Institute of Technology, Department of Mathematics (MIT OCW). Verified under Creative Commons BY-NC-SA 4.0.',
  ARRAY['Multivariable Calculus', 'Vector Fields', 'Stokes Theorem', 'Green Theorem', 'MIT OCW', 'Math Dept 18'],
  '{"title": "Module 1 Checkpoint: Vectors & Matrices", "description": "Verify matrix determinants, dot/cross products, and space curves.", "progressPercent": 0}'::jsonb,
  TRUE
),
(
  'mit-6-0001-introduction-to-computer-science-and-programming-in-python',
  'MIT 6.0001: Introduction to Computer Science & Python',
  'Introduction to computational thinking, problem solving, Python programming fundamentals, algorithm design, control flow, functions, recursion, data structures, object-oriented design, and asymptotic computational complexity.',
  'Computer Science',
  'Beginner',
  35,
  4,
  TRUE,
  0,
  NULL,
  'Official curriculum from Massachusetts Institute of Technology, Department of Electrical Engineering & Computer Science (MIT OCW). Verified under Creative Commons BY-NC-SA 4.0.',
  ARRAY['Computer Science', 'Python', 'Algorithms', 'Recursion', 'MIT OCW', 'EECS Dept 6'],
  '{"title": "Module 1 Checkpoint: Primitives & Control Flow", "description": "Verify algorithmic branching, loops, and functional decomposition.", "progressPercent": 0}'::jsonb,
  TRUE
),
(
  'mit-5-111-principles-of-chemical-science',
  'MIT 5.111: Principles of Chemical Science',
  'Electronic structure of atoms and molecules, wave-particle duality, atomic orbitals, periodic properties, chemical bonding, Lewis structures, molecular geometry, chemical thermodynamics, equilibrium, and reaction kinetics.',
  'Chemistry',
  'Undergraduate',
  38,
  3,
  TRUE,
  0,
  NULL,
  'Official curriculum from Massachusetts Institute of Technology, Department of Chemistry (MIT OCW). Verified under Creative Commons BY-NC-SA 4.0.',
  ARRAY['Physical Chemistry', 'Thermodynamics', 'Atomic Orbitals', 'MIT OCW', 'Chemistry Dept 5'],
  '{"title": "Module 1 Checkpoint: Atomic Orbitals", "description": "Verify quantum numbers, electron configurations, and periodic trends.", "progressPercent": 0}'::jsonb,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  domain = EXCLUDED.domain,
  level = EXCLUDED.level,
  duration_hours = EXCLUDED.duration_hours,
  module_count = EXCLUDED.module_count,
  verified = EXCLUDED.verified,
  syllabus_note = EXCLUDED.syllabus_note,
  tags = EXCLUDED.tags,
  weekly_checkpoint = EXCLUDED.weekly_checkpoint,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- 3. INSERT REAL COURSE SOURCES
INSERT INTO public.course_sources (
  course_id, source_title, source_url, publisher, source_type, license, verification_status, last_verified_at
) VALUES
(
  'mit-8-012-physics-i-classical-mechanics',
  'MIT 8.012 Physics I: Classical Mechanics (Fall 2008)',
  'https://ocw.mit.edu/courses/8-012-physics-i-classical-mechanics-fall-2008/',
  'Massachusetts Institute of Technology',
  'academic_curriculum',
  'Creative Commons BY-NC-SA 4.0',
  'verified',
  NOW()
),
(
  'mit-18-02-multivariable-calculus',
  'MIT 18.02 Multivariable Calculus (Fall 2010)',
  'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/',
  'Massachusetts Institute of Technology',
  'academic_curriculum',
  'Creative Commons BY-NC-SA 4.0',
  'verified',
  NOW()
),
(
  'mit-6-0001-introduction-to-computer-science-and-programming-in-python',
  'MIT 6.0001 Introduction to Computer Science and Programming in Python (Fall 2016)',
  'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
  'Massachusetts Institute of Technology',
  'academic_curriculum',
  'Creative Commons BY-NC-SA 4.0',
  'verified',
  NOW()
),
(
  'mit-5-111-principles-of-chemical-science',
  'MIT 5.111 Principles of Chemical Science (Fall 2014)',
  'https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/',
  'Massachusetts Institute of Technology',
  'academic_curriculum',
  'Creative Commons BY-NC-SA 4.0',
  'verified',
  NOW()
)
ON CONFLICT (course_id, source_url) DO UPDATE SET
  verification_status = 'verified',
  last_verified_at = NOW();

-- 4. INSERT REAL MODULES FOR MIT COURSES
INSERT INTO public.modules (id, path_id, title, module_number, order_index, status, total_resources)
VALUES
-- MIT 8.012 Modules
('mod-mit-8-012-1', 'mit-8-012-physics-i-classical-mechanics', 'Vectors, Kinematics & Coordinate Transformations', 1, 1, 'in_progress', 3),
('mod-mit-8-012-2', 'mit-8-012-physics-i-classical-mechanics', 'Newton''s Laws, Momentum & Variable Mass', 2, 2, 'locked', 3),
('mod-mit-8-012-3', 'mit-8-012-physics-i-classical-mechanics', 'Work, Energy, Conservative Forces & Potential', 3, 3, 'locked', 2),
('mod-mit-8-012-4', 'mit-8-012-physics-i-classical-mechanics', 'Angular Momentum & Central Force Motion', 4, 4, 'locked', 2),

-- MIT 18.02 Modules
('mod-mit-18-02-1', 'mit-18-02-multivariable-calculus', 'Vectors, Matrices & 3D Analytical Geometry', 1, 1, 'in_progress', 3),
('mod-mit-18-02-2', 'mit-18-02-multivariable-calculus', 'Partial Derivatives & Multivariable Optimization', 2, 2, 'locked', 3),
('mod-mit-18-02-3', 'mit-18-02-multivariable-calculus', 'Multiple Integrals & Vector Fields in the Plane', 3, 3, 'locked', 3),
('mod-mit-18-02-4', 'mit-18-02-multivariable-calculus', 'Triple Integrals, Divergence & Stokes'' Theorems', 4, 4, 'locked', 2),

-- MIT 6.0001 Modules
('mod-mit-6-0001-1', 'mit-6-0001-introduction-to-computer-science-and-programming-in-python', 'Computation, Scalar Objects, Branching & Iteration', 1, 1, 'in_progress', 3),
('mod-mit-6-0001-2', 'mit-6-0001-introduction-to-computer-science-and-programming-in-python', 'Functions, Scoping, Decomposition & Abstraction', 2, 2, 'locked', 3),
('mod-mit-6-0001-3', 'mit-6-0001-introduction-to-computer-science-and-programming-in-python', 'Tuples, Lists, Mutation & Dictionaries', 3, 3, 'locked', 2),
('mod-mit-6-0001-4', 'mit-6-0001-introduction-to-computer-science-and-programming-in-python', 'Object Oriented Programming & Algorithmic Complexity', 4, 4, 'locked', 2),

-- MIT 5.111 Modules
('mod-mit-5-111-1', 'mit-5-111-principles-of-chemical-science', 'Quantum Theory of the Atom & Periodic Trends', 1, 1, 'in_progress', 3),
('mod-mit-5-111-2', 'mit-5-111-principles-of-chemical-science', 'Chemical Bonding, Molecular Structure & Orbitals', 2, 2, 'locked', 3),
('mod-mit-5-111-3', 'mit-5-111-principles-of-chemical-science', 'Thermodynamics, Equilibrium & Reaction Kinetics', 3, 3, 'locked', 2)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  module_number = EXCLUDED.module_number,
  order_index = EXCLUDED.order_index,
  total_resources = EXCLUDED.total_resources;

-- 5. INSERT REAL LESSONS FOR MIT COURSES
INSERT INTO public.lessons (
  id, module_id, title, type, duration_minutes, source_name, source_url, order_index, summary_points
) VALUES
-- MIT 8.012 Lessons
(
  'les-mit-8-012-1-1',
  'mod-mit-8-012-1',
  'Space, Time & Vectors: Kinematics in Plane Polar Coordinates',
  'monograph',
  40,
  'MIT OpenCourseWare (MIT 8.012)',
  'https://ocw.mit.edu/courses/8-012-physics-i-classical-mechanics-fall-2008/',
  1,
  ARRAY['Vector algebra in non-Cartesian coordinate bases', 'Radial and transverse velocity and acceleration components']
),
(
  'les-mit-8-012-1-2',
  'mod-mit-8-012-1',
  'Lecture Notes: Differential Kinematics & Reference Frames',
  'monograph',
  45,
  'MIT OpenCourseWare (MIT 8.012)',
  'https://ocw.mit.edu/courses/8-012-physics-i-classical-mechanics-fall-2008/',
  2,
  ARRAY['Inertial vs non-inertial reference systems', 'Time differentiation of unit vectors']
),
(
  'les-mit-8-012-1-3',
  'mod-mit-8-012-1',
  'Problem Set 1: Kinematics & Trajectory Derivations',
  'practice',
  60,
  'MIT OpenCourseWare Problem Sets',
  'https://ocw.mit.edu/courses/8-012-physics-i-classical-mechanics-fall-2008/',
  3,
  ARRAY['Analytical mechanics problem solving from official MIT term curriculum']
),

-- MIT 18.02 Lessons
(
  'les-mit-18-02-1-1',
  'mod-mit-18-02-1',
  'Dot Products, Cross Products & Determinants in 3-Space',
  'monograph',
  45,
  'MIT OpenCourseWare (MIT 18.02)',
  'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/',
  1,
  ARRAY['Dot product for projections and orthogonality', 'Cross product for area, torque, and surface normals']
),
(
  'les-mit-18-02-1-2',
  'mod-mit-18-02-1',
  'Equations of Lines and Planes in 3-Dimensional Space',
  'monograph',
  40,
  'MIT OpenCourseWare (MIT 18.02)',
  'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/',
  2,
  ARRAY['Parametric line representation', 'Normal vector plane equations: n · (r - r_0) = 0']
),
(
  'les-mit-18-02-1-3',
  'mod-mit-18-02-1',
  'Problem Set 1: Vectors and Space Curves Practice',
  'practice',
  50,
  'MIT OpenCourseWare Problem Sets',
  'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/',
  3,
  ARRAY['Analytical exercises in 3D geometry and matrix solutions']
),

-- MIT 6.0001 Lessons
(
  'les-mit-6-0001-1-1',
  'mod-mit-6-0001-1',
  'Lecture 1: What is Computation, Scalar Types & Assignment',
  'monograph',
  35,
  'MIT OpenCourseWare (MIT 6.0001)',
  'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
  1,
  ARRAY['Declarative vs imperative knowledge', 'Primitives, expressions, syntax, and static semantics']
),
(
  'les-mit-6-0001-1-2',
  'mod-mit-6-0001-1',
  'Lecture 2: Branching Programs, Conditionals & While Loops',
  'monograph',
  40,
  'MIT OpenCourseWare (MIT 6.0001)',
  'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
  2,
  ARRAY['Boolean logic and nested branching', 'While and for iteration over ranges']
),
(
  'les-mit-6-0001-1-3',
  'mod-mit-6-0001-1',
  'Problem Set 1: Paying Off Debt & Bisection Search',
  'practice',
  55,
  'MIT OpenCourseWare Problem Sets',
  'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
  3,
  ARRAY['Implement bisection search algorithm to calculate optimal monthly payments']
),

-- MIT 5.111 Lessons
(
  'les-mit-5-111-1-1',
  'mod-mit-5-111-1',
  'Wave-Particle Duality of Light & Matter, Photoelectric Effect',
  'monograph',
  45,
  'MIT OpenCourseWare (MIT 5.111)',
  'https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/',
  1,
  ARRAY['Einstein photoelectric equation', 'de Broglie wavelength: lambda = h / p']
),
(
  'les-mit-5-111-1-2',
  'mod-mit-5-111-1',
  'Hydrogen Atom Energy Levels & Electronic Transitions',
  'monograph',
  40,
  'MIT OpenCourseWare (MIT 5.111)',
  'https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/',
  2,
  ARRAY['Bohr model and Rydberg formula', 'Schrödinger wave equation fundamentals']
),
(
  'les-mit-5-111-1-3',
  'mod-mit-5-111-1',
  'Problem Set 1: Atomic Structure & Quantum Mechanics',
  'practice',
  50,
  'MIT OpenCourseWare Problem Sets',
  'https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/',
  3,
  ARRAY['Analytical calculations of orbital transitions and wave functions']
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  duration_minutes = EXCLUDED.duration_minutes,
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  summary_points = EXCLUDED.summary_points;
