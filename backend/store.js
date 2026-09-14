// store.js
// Deliberately simple: writes the parsed dataset to a JSON file on disk.
// Good enough for a single-user dashboard project. If you want multi-user
// support later, swap this for a real database (Postgres/SQLite) — the
// rest of the app only talks to this module's three functions.

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "dataset.json");

export async function saveDataset(dataset) {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(dataset, null, 2), "utf-8");
}

export async function loadDataset() {
  if (!existsSync(DATA_FILE)) return null;
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

export async function hasDataset() {
  return existsSync(DATA_FILE);
}
