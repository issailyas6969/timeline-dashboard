// store.js — Postgres-backed dataset storage.
//
// This is a drop-in replacement for the old flat-file version: it exports
// the exact same three functions (saveDataset, loadDataset, hasDataset)
// with the exact same call signatures, so server.js doesn't need to change
// at all.
//
// The whole dashboard object (places, stats, categoryChart, routines — as
// built by stats.js) is stored as a single JSONB blob per row, rather than
// broken out into separate relational tables. That matches how the app
// actually used the flat-file store (one dataset at a time, single user),
// so there's no need to design a full schema for something this app
// doesn't require yet. If multi-user support gets added later, this is the
// file that would need to grow into real tables.

import pool from "./db.js";

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS datasets (
      id SERIAL PRIMARY KEY,
      format TEXT,
      dashboard JSONB NOT NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// Kicked off once at import time so the table is guaranteed to exist
// before any of the functions below run their first query.
const schemaReady = ensureSchema();

export async function saveDataset({ format, dashboard, uploadedAt }) {
  await schemaReady;
  // Single-user app: only the most recent upload matters, so replace
  // rather than accumulate an ever-growing history of datasets.
  await pool.query("DELETE FROM datasets");
  await pool.query(
    "INSERT INTO datasets (format, dashboard, uploaded_at) VALUES ($1, $2, $3)",
    [format, dashboard, uploadedAt]
  );
}

export async function loadDataset() {
  await schemaReady;
  const { rows } = await pool.query(
    "SELECT format, dashboard, uploaded_at FROM datasets ORDER BY uploaded_at DESC LIMIT 1"
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    format: row.format,
    dashboard: row.dashboard,
    uploadedAt: row.uploaded_at,
  };
}

export async function hasDataset() {
  await schemaReady;
  const { rows } = await pool.query("SELECT 1 FROM datasets LIMIT 1");
  return rows.length > 0;
}
