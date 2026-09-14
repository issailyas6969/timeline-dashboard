// stats.js
// Turns the flat visits/segments lists into dashboard-ready aggregates:
// places grouped + deduped, category counts for the bar chart, and a few
// "original" derived stats (novelty score, distance traveled, top routine).

function distanceKm(a, b) {
  // Haversine formula
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function buildDashboardData(visits, segments) {
  // 1. Dedupe places by rounded coordinates (roughly ~11m precision) so the
  //    same cafe visited 30 times becomes one pin with a visit count.
  const placeMap = new Map();
  for (const v of visits) {
    const key = `${v.lat.toFixed(4)},${v.lng.toFixed(4)}`;
    if (!placeMap.has(key)) {
      placeMap.set(key, {
        key,
        name: v.name,
        lat: v.lat,
        lng: v.lng,
        category: v.category,
        visitCount: 0,
        totalMinutes: 0,
        firstVisited: v.startTime,
        lastVisited: v.startTime,
      });
    }
    const place = placeMap.get(key);
    place.visitCount += 1;
    place.totalMinutes += v.durationMinutes || 0;
    if (new Date(v.startTime) < new Date(place.firstVisited)) place.firstVisited = v.startTime;
    if (new Date(v.startTime) > new Date(place.lastVisited)) place.lastVisited = v.startTime;
  }
  const places = [...placeMap.values()];

  // 2. Category bar chart data
  const categoryCounts = {};
  for (const p of places) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + p.visitCount;
  }
  const categoryChart = Object.entries(categoryCounts)
    .map(([category, visits]) => ({ category, visits }))
    .sort((a, b) => b.visits - a.visits);

  // 3. Distance traveled (sum of activity segment distances)
  const totalDistanceKm =
    segments.reduce((sum, s) => sum + (s.distanceMeters || 0), 0) / 1000;

  // 4. Novelty score: % of visits that were to a place visited only once
  //    ("new" places) vs. repeat places, across the whole dataset.
  const singleVisitPlaces = places.filter((p) => p.visitCount === 1).length;
  const noveltyScore = places.length
    ? Math.round((singleVisitPlaces / places.length) * 100)
    : 0;

  // 5. Radius of life: max distance from the most-visited place (proxy for "home")
  const home = [...places].sort((a, b) => b.visitCount - a.visitCount)[0];
  let radiusKm = 0;
  if (home) {
    for (const p of places) {
      const d = distanceKm(home, p);
      if (d > radiusKm) radiusKm = d;
    }
  }

  // 6. Top 5 most-visited places (routine detector, simple version)
  const routines = [...places]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 5)
    .map((p) => ({ name: p.name, visitCount: p.visitCount, category: p.category }));

  return {
    places,
    categoryChart,
    stats: {
      totalPlaces: places.length,
      totalVisits: visits.length,
      totalDistanceKm: Math.round(totalDistanceKm),
      noveltyScore,
      radiusKm: Math.round(radiusKm),
    },
    routines,
  };
}
