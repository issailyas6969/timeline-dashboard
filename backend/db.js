import pg from "pg";

const { Pool } = pg;

// The `pg` library automatically picks up PGHOST, PGPORT, PGUSER,
// PGPASSWORD, and PGDATABASE from the environment if present — no config
// object needed here. Those get set on the Deployment via the
// footprint-postgres-credentials Secret (see openshift/backend.yaml).
const pool = new Pool();

export default pool;
