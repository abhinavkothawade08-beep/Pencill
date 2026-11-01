import { z } from 'zod';

export const TutorRequestSchema = z.object({
  courseTitle: z.string().min(1),
  moduleTitle: z.string().min(1),
  lessonTitle: z.string().min(1),
  lessonType: z.string().optional().default('concept'),
  studyNotes: z.any().optional(),
  personality: z.enum([
    'simple_teacher',
    'socratic_tutor',
    'exam_prep',
    'practical_instructor',
    'programming_mentor',
    'research_assistant',
  ]).default('simple_teacher'),
  message: z.string().min(1, 'Message cannot be empty'),
  conversationHistory: z.array(
    z.object({
      sender: z.enum(['user', 'tutor']),
      text: z.string(),
    })
  ).optional().default([]),
});

export type TutorRequest = z.infer<typeof TutorRequestSchema>;

export const PERSONALITY_SYSTEM_PROMPTS: Record<string, string> = {
  simple_teacher: `You are the "Simple Teacher" personality in Pencill's Personal AI University.
Your goal is to explain complex concepts using vivid real-world analogies, intuitive metaphors, and clear plain English.
Never use dense academic jargon without immediately demystifying it. Keep answers direct, friendly, and memorable.`,

  socratic_tutor: `You are the "Socratic Tutor" personality in Pencill's Personal AI University.
Your goal is to guide the student to discover insights themselves.
Do NOT simply give the final answer right away. Ask 1-2 sharp, probing questions or provide an insightful hint that leads the student to the realization. Break complex problems into smaller intuitive steps.`,

  exam_prep: `You are the "Exam Preparation Mentor" personality in Pencill's Personal AI University.
Your goal is high-yield performance in competitive and board examinations (e.g. JEE, NEET, GATE, AP, University Finals).
Point out common traps, formula shortcuts, time management strategies, and standard question variations. Emphasize what examiners look for and why mistakes happen.`,

  practical_instructor: `You are the "Practical Instructor" personality in Pencill's Personal AI University.
Your goal is hands-on mastery. Focus on how this concept is applied in real-world systems, industry workflows, and actual problem solving. Provide concrete examples and actionable implementation steps.`,

  programming_mentor: `You are the "Programming Mentor" personality in Pencill's Personal AI University.
Your goal is engineering excellence. Focus on clean code, idiomatic architecture, algorithmic efficiency (Big-O time and space), edge cases, and debugging mental models. When presenting code, make it production-grade and well-commented.`,

  research_assistant: `You are the "Research Assistant" personality in Pencill's Personal AI University.
Your goal is academic rigor. Provide formal definitions, theoretical foundations, mathematical derivations where appropriate, and cite foundational concepts. Address theoretical nuances and formal prerequisites.`,
};

export function generateFallbackResponse(
  personality: string,
  lessonTitle: string,
  userMessage: string
): string {
  const cleanMsg = userMessage.toLowerCase();

  if (cleanMsg.includes('analogy') || personality === 'simple_teacher') {
    return `Think of **${lessonTitle}** like a specialized postal distribution network: before any letter moves, it is routed based on destination codes (vector coordinates). The system doesn't examine every house sequentially; instead, it partitions regions into discrete clusters so you find the target with maximum speed. How does this compare with the specific scenario you're working through?`;
  }

  if (personality === 'socratic_tutor') {
    return `To understand **${lessonTitle}**, let's examine the underlying principle first. If you alter the initial boundary condition or input state, what do you predict will happen to the output trajectory? What fundamental law or rule constrains it?`;
  }

  if (personality === 'exam_prep') {
    return `**Exam Focus for ${lessonTitle}:**
1. **High-Yield Anchor:** Pay special attention to the signs and dimension consistency in standard problems.
2. **Common Trap:** Overlooking boundary cases where the denominator approaches zero or conditions violate initial assumptions.
3. **Speed Tip:** Memorize the direct ratio rather than re-deriving the entire equation from scratch during the exam.`;
  }

  if (personality === 'programming_mentor') {
    return `In **${lessonTitle}**, always analyze the time and space complexity:
- **Time Complexity:** Aim for O(1) or O(log N) lookups where possible.
- **Defensive Guard:** Always check for null or out-of-bounds bounds before accessing nested structures.
- **Trace Tip:** Log the state immediately before and after the critical transformation to isolate unexpected mutations.`;
  }

  return `Regarding **${lessonTitle}**:
At its core, this topic addresses how we structure and verify state transformations under well-defined constraints. 

Key takeaway: ensure your baseline assumptions match the domain requirements before applying advanced techniques. What particular aspect or equation would you like to drill into next?`;
}
