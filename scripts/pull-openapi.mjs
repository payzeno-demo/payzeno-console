#!/usr/bin/env node
/**
 * Refresh the checked-in copy of payzeno-api's OpenAPI document.
 *
 * src/api/contract/routes.contract.test.ts reads the checked-in file, not the network, so
 * the contract test stays deterministic offline. This script is the only thing that writes
 * it, and CI runs it on every PR so a route rename shows up as a diff.
 *
 *   pnpm openapi:pull
 *   PAYZENO_API_OPENAPI_URL=http://localhost:8080/openapi.json pnpm openapi:pull
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const URL_ = process.env.PAYZENO_API_OPENAPI_URL ?? 'http://localhost:8080/openapi.json';
const OUT = resolve(process.cwd(), 'src/api/openapi/payzeno-api.openapi.json');

const res = await fetch(URL_, { headers: { accept: 'application/json' } });
if (!res.ok) {
  console.error(`payzeno-api openapi fetch failed: ${res.status} ${res.statusText} (${URL_})`);
  process.exit(1);
}

const doc = await res.json();
// Stable key order — otherwise every refresh is a 4,000-line diff and nobody reads it.
await writeFile(OUT, `${JSON.stringify(doc, Object.keys(doc).sort(), 2)}\n`, 'utf8');
console.log(`wrote ${OUT} (${Object.keys(doc.paths ?? {}).length} paths)`);
