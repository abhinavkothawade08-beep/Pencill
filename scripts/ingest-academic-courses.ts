import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { academicIngestionPipeline } from "../src/lib/ingestion/academic-ingestion-pipeline";

async function main() {
  console.log("=".repeat(70));
  console.log("PENCILL REAL ACADEMIC CONTENT INGESTION PIPELINE");
  console.log("Provider: MIT OpenCourseWare (Official MIT Learn API)");
  console.log("=".repeat(70));

  const departmentsToIngest = [
    { code: "8", name: "Physics", limit: 4 },
    { code: "18", name: "Mathematics", limit: 4 },
    { code: "6", name: "Computer Science", limit: 4 },
  ];

  let totalImported = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  for (const dept of departmentsToIngest) {
    console.log(`\n>>> Ingesting Department ${dept.code} (${dept.name})...`);
    const res = await academicIngestionPipeline.ingestFromProvider("mit-ocw", {
      department: dept.code,
      limit: dept.limit,
    });

    totalImported += res.imported;
    totalUpdated += res.updated;
    totalFailed += res.failed;

    console.log(`Summary for ${dept.name}:`);
    console.log(`  Imported: ${res.imported}, Updated: ${res.updated}, Failed: ${res.failed}`);
    res.courses.forEach((c) => console.log(`  + [${c.id}] ${c.title} (${c.canonicalUrl})`));

    if (res.errors.length > 0) {
      console.warn("  Errors encountered:", res.errors);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`INGESTION RUN FINISHED.`);
  console.log(`Total Imported: ${totalImported}`);
  console.log(`Total Updated:  ${totalUpdated}`);
  console.log(`Total Failed:   ${totalFailed}`);
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("Fatal error during academic ingestion:", err);
  process.exit(1);
});
