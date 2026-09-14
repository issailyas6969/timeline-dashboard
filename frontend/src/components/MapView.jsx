import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const CATEGORY_COLORS = {
  Home: "#c98fd9",
  Work: "#7c9fd9",
  "Food & Drink": "#d9a441",
  Fitness: "#8fd9a8",
  Shopping: "#c98fd9",
  Health: "#8fd9a8",
  Travel: "#d9c541",
  "Nature & Outdoors": "#6fbf73",
  Education: "#a1a8c9",
  Entertainment: "#d97757",
  Other: "#8b8f9c",
};

// Builds a pointy teardrop pin, sized by visit count, colored by category.
// className: "" is required so Leaflet doesn't wrap the SVG in a white square.
function createPinIcon(category, visitCount = 1) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  const width = Math.min(22 + visitCount * 1.4, 46);
  const height = width * 1.35;

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
        fill="${color}"
        stroke="#1a1a1a"
        stroke-width="1"
      />
      <circle cx="12" cy="12" r="5" fill="#1a1a1a" fill-opacity="0.35"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [width, height],
    iconAnchor: [width / 2, height], // anchor at the pin's tip, not its center
    popupAnchor: [0, -height],
  });
}

// Builds a circular thumbnail pin (cover photo) with a small pointer tail in
// the category color, so it reads the same way the teardrop pins do — bigger
// circle = more visits, color = category, tip = actual map location.
function createPhotoPinIcon(category, visitCount = 1, photoUrl) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  const size = Math.min(34 + visitCount * 1.2, 58);
  const tail = size * 0.32;
  const totalHeight = size + tail;

  const html = `
    <div style="position:relative; width:${size}px; height:${totalHeight}px;">
      <div style="
        position:absolute; top:0; left:0;
        width:${size}px; height:${size}px; border-radius:50%;
        border:3px solid ${color};
        overflow:hidden;
        background:#1a1a1a;
        box-shadow:0 1px 5px rgba(0,0,0,0.45);
      ">
        <img
          src="${photoUrl}"
          style="width:100%;height:100%;object-fit:cover;display:block;"
          onerror="this.style.display='none'"
        />
      </div>
      <div style="
        position:absolute; left:50%; bottom:0; transform:translateX(-50%);
        width:0; height:0;
        border-left:${tail / 2}px solid transparent;
        border-right:${tail / 2}px solid transparent;
        border-top:${tail}px solid ${color};
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, totalHeight],
    iconAnchor: [size / 2, totalHeight], // anchor at the tail's tip, matching the teardrop pin
    popupAnchor: [0, -totalHeight],
  });
}

function iconFor(place) {
  return place.coverPhoto
    ? createPhotoPinIcon(place.category, place.visitCount, place.coverPhoto)
    : createPinIcon(place.category, place.visitCount);
}

export default function MapView({ places, onSelectPlace }) {
  const center = places.length
    ? [places[0].lat, places[0].lng]
    : [12.9716, 77.5946]; // fallback: Bengaluru

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
      <MapContainer center={center} zoom={11} style={{ height: 420, width: "100%", background: "var(--surface)" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.map((p, i) => (
          <Marker
            key={i}
            position={[p.lat, p.lng]}
            icon={iconFor(p)}
            eventHandlers={{ click: () => onSelectPlace?.(p) }}
          >
            <Popup>
              {p.coverPhoto && (
                <img
                  src={p.coverPhoto}
                  alt={p.name}
                  style={{ width: "100%", maxHeight: 100, objectFit: "cover", borderRadius: 4, marginBottom: 6 }}
                />
              )}
              <strong>{p.name}</strong>
              <br />
              {p.category} · {p.visitCount} visit{p.visitCount === 1 ? "" : "s"}
              <br />
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectPlace?.(p, { scrollToGallery: true });
                }}
              >
                Add photos
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}