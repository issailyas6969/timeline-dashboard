// photoStore.js
// Photos are stored on disk under uploads/photos/<sanitized place key>/<file>,
// one folder per place. No separate metadata file needed — the folder listing
// is the source of truth, and multer gives each upload a unique filename.

import { readdir, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_ROOT = path.join(__dirname, "uploads");
export const PHOTOS_ROOT = path.join(UPLOADS_ROOT, "photos");

// Place keys look like "12.9716,77.5946" — safe for a folder name once the
// comma is swapped out, but we sanitize defensively against anything odd.
export function sanitizeKey(key) {
  return String(key).replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function placeDir(placeKey) {
  return path.join(PHOTOS_ROOT, sanitizeKey(placeKey));
}

export async function ensurePlaceDir(placeKey) {
  const dir = placeDir(placeKey);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  return dir;
}

export async function listPhotos(placeKey) {
  const dir = placeDir(placeKey);
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files
    .filter((f) => !f.startsWith("."))
    .sort()
    .reverse() // newest first (filenames are timestamp-prefixed)
    .map((filename) => ({
      filename,
      url: `/uploads/photos/${sanitizeKey(placeKey)}/${filename}`,
    }));
}

export async function deletePhoto(placeKey, filename) {
  // Guard against path traversal via a crafted filename
  const safeName = path.basename(filename);
  const filePath = path.join(placeDir(placeKey), safeName);
  if (!existsSync(filePath)) throw new Error("Photo not found");
  await unlink(filePath);
}
