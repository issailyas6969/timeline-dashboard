// categorize.js
// Buckets a visit into a human-friendly category. Google's own semanticType
// field (HOME / WORK / etc.) is used first when present. Otherwise we fall
// back to keyword-matching the place name/address.
//
// For much better accuracy, plug in the Google Places API here: look up the
// place by `placeId` (Place Details request, "types" field) and map Google's
// place types (e.g. "restaurant", "gym", "grocery_store") onto the categories
// below. That requires an API key, so it's left as an extension point rather
// than wired in by default — see fetchCategoryFromPlacesAPI() at the bottom.

const KEYWORD_RULES = [
  { category: "Food & Drink", keywords: ["restaurant", "cafe", "coffee", "bakery", "bar", "pub", "eatery", "kitchen", "diner", "brewery"] },
  { category: "Fitness", keywords: ["gym", "fitness", "yoga", "sports", "stadium", "swimming", "crossfit"] },
  { category: "Shopping", keywords: ["mall", "store", "market", "shop", "supermarket", "grocery", "bazaar"] },
  { category: "Work", keywords: ["office", "coworking", "corp", "tower", "workplace"] },
  { category: "Health", keywords: ["hospital", "clinic", "pharmacy", "dental", "doctor", "medical"] },
  { category: "Travel", keywords: ["airport", "station", "terminal", "hotel", "hostel", "resort"] },
  { category: "Nature & Outdoors", keywords: ["park", "garden", "lake", "beach", "trail", "forest", "viewpoint"] },
  { category: "Education", keywords: ["school", "college", "university", "library", "campus"] },
  { category: "Entertainment", keywords: ["cinema", "theatre", "theater", "museum", "gallery", "club"] },
];

const SEMANTIC_TYPE_MAP = {
  HOME: "Home",
  INFERRED_HOME: "Home",
  WORK: "Work",
  INFERRED_WORK: "Work",
};

export function categorize(visit) {
  if (visit.semanticType && SEMANTIC_TYPE_MAP[visit.semanticType]) {
    return SEMANTIC_TYPE_MAP[visit.semanticType];
  }

  const haystack = (visit.name || "").toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return rule.category;
    }
  }

  return "Other";
}

// Extension point: call this instead of categorize() if you've wired up a
// Google Places API key in the backend .env as GOOGLE_PLACES_API_KEY.
export async function fetchCategoryFromPlacesAPI(placeId, apiKey) {
  if (!placeId || !apiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=type&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const types = data.result?.types || [];
  // Map a handful of common Google place types onto our categories.
  const GOOGLE_TYPE_MAP = {
    restaurant: "Food & Drink",
    cafe: "Food & Drink",
    bar: "Food & Drink",
    gym: "Fitness",
    shopping_mall: "Shopping",
    grocery_or_supermarket: "Shopping",
    hospital: "Health",
    pharmacy: "Health",
    airport: "Travel",
    lodging: "Travel",
    park: "Nature & Outdoors",
    school: "Education",
    university: "Education",
    movie_theater: "Entertainment",
    museum: "Entertainment",
  };
  for (const t of types) {
    if (GOOGLE_TYPE_MAP[t]) return GOOGLE_TYPE_MAP[t];
  }
  return null;
}
