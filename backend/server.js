import path from "path";
import express from "express";
import cors from "cors";
import multer from "multer";
import { parseTimeline } from "./parser.js";
import { categorize } from "./categorize.js";
import { buildDashboardData } from "./stats.js";
import { saveDataset, loadDataset, hasDataset } from "./store.js";
import { UPLOADS_ROOT, ensurePlaceDir, listPhotos, deletePhoto, sanitizeKey } from "./photoStore.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

const photoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const dir = await ensurePlaceDir(req.params.placeKey);
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per photo
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image files are allowed"));
    cb(null, true);
  },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_ROOT));

// ---------------------------------------------------------------------------
// Cover photos
//
// stats.js stays untouched (it's synchronous and has no filesystem access —
// good separation of concerns). Instead we attach a `coverPhoto` field to
// every place right here, right before responding, using the existing
// listPhotos() helper. This runs on both routes that return dashboard data
// (upload + fetch), so the map/gallery always has an up-to-date cover photo
// without needing a schema change in the stored dataset.
//
// Assumes listPhotos(placeKey) resolves to an array of photo records shaped
// like { filename, url, uploadedAt? } (matching the shape used in the
// /api/places/:placeKey/photos upload response). If your listPhotos returns
// plain filename strings instead, tweak `photoUrl` below accordingly.
// ---------------------------------------------------------------------------

function photoUrl(placeKey, photo) {
  if (typeof photo === "string") {
    // photo is just a filename
    return `/uploads/photos/${sanitizeKey(placeKey)}/${photo}`;
  }
  // photo is an object — prefer an existing url field if present
  return photo.url || `/uploads/photos/${sanitizeKey(placeKey)}/${photo.filename}`;
}

async function attachCoverPhotos(dashboard) {
  const places = await Promise.all(
    dashboard.places.map(async (place) => {
      let photos = [];
      try {
        photos = await listPhotos(place.key);
      } catch (err) {
        // Missing photo dir for a place is expected (no photos uploaded yet) —
        // don't let it fail the whole dashboard response.
        photos = [];
      }
      return {
        ...place,
        coverPhoto: photos.length > 0 ? photoUrl(place.key, photos[0]) : null,
      };
    })
  );
  return { ...dashboard, places };
}

// Upload + parse a Timeline.json export
app.post("/api/upload", upload.single("timeline"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded. Field name must be 'timeline'." });

    const raw = req.file.buffer.toString("utf-8");
    const { visits, segments, format } = parseTimeline(raw);

    const categorizedVisits = visits.map((v) => ({ ...v, category: categorize(v) }));
    const dashboard = buildDashboardData(categorizedVisits, segments);

    await saveDataset({ format, dashboard, uploadedAt: new Date().toISOString() });

    const dashboardWithPhotos = await attachCoverPhotos(dashboard);
    res.json({ ok: true, format, ...dashboardWithPhotos });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Fetch the most recently uploaded dataset
app.get("/api/dashboard", async (req, res) => {
  const dataset = await loadDataset();
  if (!dataset) return res.status(404).json({ error: "No dataset uploaded yet." });
  const dashboardWithPhotos = await attachCoverPhotos(dataset.dashboard);
  res.json(dashboardWithPhotos);
});

app.get("/api/status", async (req, res) => {
  res.json({ hasData: await hasDataset() });
});

// Upload one or more photos for a specific place (identified by its key, e.g. "12.9716,77.5946")
app.post("/api/places/:placeKey/photos", photoUpload.array("photos", 10), async (req, res) => {
  try {
    const files = (req.files || []).map((f) => ({
      filename: f.filename,
      url: `/uploads/photos/${sanitizeKey(req.params.placeKey)}/${f.filename}`,
    }));
    res.json({ ok: true, files });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List photos for a place
app.get("/api/places/:placeKey/photos", async (req, res) => {
  const photos = await listPhotos(req.params.placeKey);
  res.json({ photos });
});

// Delete a single photo
app.delete("/api/places/:placeKey/photos/:filename", async (req, res) => {
  try {
    await deletePhoto(req.params.placeKey, req.params.filename);
    res.json({ ok: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Catches multer errors (bad file type, size limit, etc.) thrown before a route handler runs
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Timeline dashboard API running on http://localhost:${PORT}`));