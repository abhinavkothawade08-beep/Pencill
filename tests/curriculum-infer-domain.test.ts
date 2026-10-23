import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { inferDomain } from '@/services/ai/curriculum-adaptive-engine';

describe('Consolidated Academic Domain Inference System', () => {
  const testCases: Array<{ topic: string; expectedDomain: string }> = [
    // Computer Science & AI
    { topic: 'Python Programming Essentials', expectedDomain: 'Computer Science' },
    { topic: 'Introduction to Machine Learning', expectedDomain: 'Computer Science' },
    { topic: 'Fine-Tuning Large Language Models', expectedDomain: 'Computer Science' },
    { topic: 'Data Structures and Algorithms', expectedDomain: 'Computer Science' },
    { topic: 'Transformer Attention Mechanisms', expectedDomain: 'Computer Science' },
    { topic: 'PostgreSQL Database Indexing', expectedDomain: 'Computer Science' },
    { topic: 'Modern Frontend Architecture with React', expectedDomain: 'Computer Science' },

    // Chemistry
    { topic: 'Organic Chemistry: Haloalkanes and Haloarenes', expectedDomain: 'Chemistry' },
    { topic: 'Chemical Equilibrium and Le Chatelier Principle', expectedDomain: 'Chemistry' },
    { topic: 'Coordination Compounds and Inorganic Reactions', expectedDomain: 'Chemistry' },
    { topic: 'Alkyl Halides Reaction Mechanisms', expectedDomain: 'Chemistry' },
    { topic: 'Molecular Orbital Theory', expectedDomain: 'Chemistry' },

    // Mathematics
    { topic: 'Multivariable Calculus and Vector Fields', expectedDomain: 'Mathematics' },
    { topic: 'Linear Algebra and Eigenvalues', expectedDomain: 'Mathematics' },
    { topic: 'Probability Distributions and Random Variables', expectedDomain: 'Mathematics' },
    { topic: 'Differential Equations and Boundary Problems', expectedDomain: 'Mathematics' },
    { topic: 'Analytic Geometry and Conic Sections', expectedDomain: 'Mathematics' },

    // Physics
    { topic: 'Quantum Mechanics and Wave-Particle Duality', expectedDomain: 'Physics' },
    { topic: 'Thermodynamics and Statistical Mechanics', expectedDomain: 'Physics' },
    { topic: 'Kinematics and Rigid Body Dynamics', expectedDomain: 'Physics' },
    { topic: 'Electromagnetism and Maxwell Equations', expectedDomain: 'Physics' },
    { topic: 'Wave Optics and Interference', expectedDomain: 'Physics' },

    // Biology
    { topic: 'Mendelian Genetics and Inheritance', expectedDomain: 'Biology' },
    { topic: 'Cell Biology and Organelles', expectedDomain: 'Biology' },
    { topic: 'Human Anatomy and Cardiovascular System', expectedDomain: 'Biology' },
    { topic: 'Plant Physiology and Photosynthesis', expectedDomain: 'Biology' },

    // Economics & Finance
    { topic: 'Macroeconomics and Monetary Policy', expectedDomain: 'Economics & Finance' },
    { topic: 'Financial Markets and Capital Asset Pricing', expectedDomain: 'Economics & Finance' },
    { topic: 'Managerial Accounting and Balance Sheets', expectedDomain: 'Economics & Finance' },

    // Interdisciplinary / General
    { topic: 'Renaissance Philosophy and Aesthetics', expectedDomain: 'Interdisciplinary Studies' },
    { topic: 'Global Environmental Policy', expectedDomain: 'Interdisciplinary Studies' },
  ];

  for (const { topic, expectedDomain } of testCases) {
    test(`correctly infers domain "${expectedDomain}" for topic: "${topic}"`, () => {
      const detected = inferDomain(topic);
      assert.strictEqual(
        detected,
        expectedDomain,
        `Topic "${topic}" should resolve to "${expectedDomain}", but resolved to "${detected}"`
      );
    });
  }
});
