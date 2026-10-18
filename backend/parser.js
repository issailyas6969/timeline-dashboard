// parser.js
// Normalizes Google Maps Timeline exports into a flat list of "visits".
//
// Google currently ships TWO different shapes of Timeline.json depending on
// how/when the data was exported:
//
// 1. NEW on-device export (phone Settings -> Location -> Timeline -> Export),
//    the only option since Google moved Timeline storage off its servers:
//      { "semanticSegments": [ { visit: {...} } | { activity: {...} }, ... ] }
//
// 2. OLD Google Takeout "Semantic Location History" export (still floating
//    around in people's old backups):
//      { "timelineObjects": [ { placeVisit: {...} } | { activitySegment: {...} }, ... ] }
//
// This module detects which shape it received and normalizes both into:
//   { visits: [{ name, lat, lng, placeId, startTime, endTime, durationMinutes }],
//     segments: [{ startLat, startLng, endLat, endLng, distanceMeters, activityType }] }

function parseLatLng(str) {
  // "12.9716123, 77.5946123" -> { lat, lng }
  // Also accepts "12.97°, 77.59°" (Android) and "geo:12.97,77.59" (iOS).
  if (!str || typeof str !== "string") return null;
  const cleaned = str.replace(/^\s*geo:/i, "").replace(/°/g, "");
  const [lat, lng] = cleaned.split(",").map((s) => parseFloat(s.trim()));
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

// A location can be a plain string ("geo:..") or an object { latLng: ".." }.
function latLngOf(loc) {
  if (!loc) return null;
  return parseLatLng(typeof loc === "string" ? loc : loc.latLng);
}

function e7ToDecimal(value) {
  // Old Takeout format stores lat/lng as integers scaled by 1e7
  return typeof value === "number" ? value / 1e7 : null;
}

function minutesBetween(startIso, endIso) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 60000));
}

function parseNewFormat(data) {
  const visits = [];
  const segments = [];

  for (const seg of data.semanticSegments || []) {
    if (seg.visit) {
      const v = seg.visit;
      const top = v.topCandidate || {};
      const coords = latLngOf(top.placeLocation);
      if (!coords) continue;
      visits.push({
        name: top.placeName || top.semanticType || "Unnamed place",
        lat: coords.lat,
        lng: coords.lng,
        placeId: top.placeId || top.placeID || null,
        semanticType: top.semanticType || null,
        startTime: seg.startTime,
        endTime: seg.endTime,
        durationMinutes: minutesBetween(seg.startTime, seg.endTime),
      });
    } else if (seg.activity) {
      const a = seg.activity;
      const start = latLngOf(a.start);
      const end = latLngOf(a.end);
      segments.push({
        startLat: start?.lat ?? null,
        startLng: start?.lng ?? null,
        endLat: end?.lat ?? null,
        endLng: end?.lng ?? null,
        distanceMeters: a.distanceMeters ? Number(a.distanceMeters) : 0,
        activityType: a.topCandidate?.type || "unknown",
        startTime: seg.startTime,
        endTime: seg.endTime,
      });
    }
  }

  return { visits, segments };
}

function parseOldFormat(data) {
  const visits = [];
  const segments = [];

  for (const obj of data.timelineObjects || []) {
    if (obj.placeVisit) {
      const pv = obj.placeVisit;
      const loc = pv.location || {};
      const lat = e7ToDecimal(loc.latitudeE7);
      const lng = e7ToDecimal(loc.longitudeE7);
      if (lat === null || lng === null) continue;
      visits.push({
        name: loc.name || loc.address || "Unnamed place",
        lat,
        lng,
        placeId: loc.placeId || null,
        semanticType: null,
        startTime: pv.duration?.startTimestamp,
        endTime: pv.duration?.endTimestamp,
        durationMinutes: minutesBetween(
          pv.duration?.startTimestamp,
          pv.duration?.endTimestamp
        ),
      });
    } else if (obj.activitySegment) {
      const as = obj.activitySegment;
      const startLat = e7ToDecimal(as.startLocation?.latitudeE7);
      const startLng = e7ToDecimal(as.startLocation?.longitudeE7);
      const endLat = e7ToDecimal(as.endLocation?.latitudeE7);
      const endLng = e7ToDecimal(as.endLocation?.longitudeE7);
      segments.push({
        startLat,
        startLng,
        endLat,
        endLng,
        distanceMeters: as.distance ? Number(as.distance) : 0,
        activityType: (as.activityType || "unknown").toLowerCase(),
        startTime: as.duration?.startTimestamp,
        endTime: as.duration?.endTimestamp,
      });
    }
  }

  return { visits, segments };
}

export function parseTimeline(rawJson) {
  // Strip a UTF-8 BOM if the export has one (JSON.parse chokes on it).
  let data =
    typeof rawJson === "string"
      ? JSON.parse(rawJson.replace(/^﻿/, ""))
      : rawJson;

  // iOS on-device export: a bare top-level array of segments
  // [ { startTime, endTime, visit|activity|timelinePath }, ... ]
  if (Array.isArray(data)) {
    data = { semanticSegments: data };
  }

  if (Array.isArray(data?.semanticSegments)) {
    return { format: "on-device", ...parseNewFormat(data) };
  }
  if (Array.isArray(data?.timelineObjects)) {
    return { format: "takeout", ...parseOldFormat(data) };
  }

  const found =
    data && typeof data === "object"
      ? Object.keys(data).slice(0, 10).join(", ") || "(empty object)"
      : typeof data;

  throw new Error(
    `Unrecognized Timeline.json format. Expected a top-level 'semanticSegments' or 'timelineObjects' list (or a bare list of segments), but found: ${found}.`
  );
}
