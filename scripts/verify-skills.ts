import fs from "fs";
import path from "path";
import { ALL_101_SKILLS } from "./skills-definitions.ts";

const PROJECT_ROOT = process.cwd();
const AGENTS_DIR = path.join(PROJECT_ROOT, ".agents");
const SKILLS_DIR = path.join(AGENTS_DIR, "skills");
const RULES_DIR = path.join(AGENTS_DIR, "rules");

function verifySkills() {
  console.log("=== Autonomous Engineering Verification Gate: 101 Skills ===");
  let errors: string[] = [];

  // 1. Verify skills.json
  const manifestPath = path.join(AGENTS_DIR, "skills.json");
  if (!fs.existsSync(manifestPath)) {
    errors.push("Missing .agents/skills.json manifest.");
  } else {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      if (manifest.total_skills !== 101) {
        errors.push(`skills.json total_skills is ${manifest.total_skills}, expected 101.`);
      }
      if (!Array.isArray(manifest.skills) || manifest.skills.length !== 101) {
        errors.push(`skills.json skills array length is ${manifest.skills?.length}, expected 101.`);
      }
    } catch (e: any) {
      errors.push(`Failed to parse skills.json: ${e.message}`);
    }
  }

  // 2. Verify all 101 skills
  const seenNames = new Set<string>();
  const seenIds = new Set<number>();

  ALL_101_SKILLS.forEach((skill) => {
    if (seenNames.has(skill.name)) {
      errors.push(`Duplicate skill name detected: ${skill.name}`);
    }
    seenNames.add(skill.name);

    if (seenIds.has(skill.id)) {
      errors.push(`Duplicate skill ID detected: ${skill.id}`);
    }
    seenIds.add(skill.id);

    const skillPath = path.join(SKILLS_DIR, skill.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      errors.push(`Missing SKILL.md for skill: ${skill.name}`);
      return;
    }

    const content = fs.readFileSync(skillPath, "utf-8");

    // Frontmatter validation
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    if (!match) {
      errors.push(`Missing frontmatter in ${skill.name}/SKILL.md`);
      return;
    }

    const frontmatter = match[1];
    if (!frontmatter.includes(`name: ${skill.name}`)) {
      errors.push(`Incorrect or missing name field in ${skill.name}/SKILL.md frontmatter`);
    }
    if (!frontmatter.includes("description:")) {
      errors.push(`Missing description in ${skill.name}/SKILL.md frontmatter`);
    }

    // Required sections
    const requiredSections = [
      "## 1. Scope & Core Objectives",
      "## 2. Standard Operating Procedures (SOP)",
      "## 3. Toolchain & Execution Commands",
      "## 4. Defensive Rules & Anti-Patterns",
      "## 5. Hermetic Verification Gates",
      "## 6. Subagent Coordination Matrix"
    ];

    requiredSections.forEach((sec) => {
      if (!content.includes(sec)) {
        errors.push(`Missing section '${sec}' in ${skill.name}/SKILL.md`);
      }
    });
  });

  // 3. Verify Rules
  const expectedRules = [
    "code-quality.md",
    "security-data-protection.md",
    "testing-verification.md",
    "regression-prevention.md"
  ];

  expectedRules.forEach((ruleFile) => {
    const rulePath = path.join(RULES_DIR, ruleFile);
    if (!fs.existsSync(rulePath)) {
      errors.push(`Missing rule file: ${ruleFile}`);
    } else {
      const stats = fs.statSync(rulePath);
      if (stats.size > 24000) {
        errors.push(`Rule file ${ruleFile} exceeds 24KB limit (${stats.size} bytes).`);
      }
    }
  });

  // 4. Verify master README.md
  const readmePath = path.join(AGENTS_DIR, "README.md");
  if (!fs.existsSync(readmePath)) {
    errors.push("Missing .agents/README.md catalog.");
  }

  // Summary
  console.log(`Verified ${ALL_101_SKILLS.length} skills across ${seenNames.size} unique skill directories.`);
  console.log(`Verified ${expectedRules.length} rule files in .agents/rules/.`);

  if (errors.length > 0) {
    console.error(`\nFAILED: Found ${errors.length} verification errors:`);
    errors.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  } else {
    console.log("\nALL 101 SKILLS AND RULES SUCCESSFULLY VERIFIED! PASS RATE: 100%");
    process.exit(0);
  }
}

verifySkills();
