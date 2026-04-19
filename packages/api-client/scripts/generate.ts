import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import openapiTS from "openapi-typescript";
import { astToString } from "openapi-typescript";

const docsUrl = process.env.API_DOCS_URL ?? "http://localhost:3000/api/docs-json";
const outputPath = resolve("src/generated/schema.d.ts");

async function run() {
  const response = await fetch(docsUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch OpenAPI schema from ${docsUrl} (${response.status})`);
  }

  const schema = await response.json();
  const ast = await openapiTS(schema);
  const output = astToString(ast);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");

  console.log(`Generated ${outputPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
