import { SKILL_CATEGORIES, SKILLS_1_TO_25 } from "./skills-definitions-p1.ts";
import type { SkillDefinition } from "./skills-definitions-p1.ts";
import { SKILLS_26_TO_50 } from "./skills-definitions-p2.ts";
import { SKILLS_51_TO_75 } from "./skills-definitions-p3.ts";
import { SKILLS_76_TO_101 } from "./skills-definitions-p4.ts";

export { SKILL_CATEGORIES };
export type { SkillDefinition };

export const ALL_101_SKILLS: SkillDefinition[] = [
  ...SKILLS_1_TO_25,
  ...SKILLS_26_TO_50,
  ...SKILLS_51_TO_75,
  ...SKILLS_76_TO_101
];
