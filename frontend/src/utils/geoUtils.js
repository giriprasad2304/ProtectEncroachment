/**
 * Geo calculation utilities (Turf.js compatible)
 * Provides Bounding Box, Centroid, and Spherical Area calculations for GIS boundaries.
 */

// Spherical polygon area calculation in m²
export function calculateAreaSqM(coordinates) {
  if (!coordinates || coordinates.length < 3) return 0;
  const R = 6378137; // Earth radius in meters
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const p1 = coordinates[i]; // [lon, lat]
    const p2 = coordinates[(i + 1) % coordinates.length];
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(Math.round((area * R * R) / 2));
}

// Compute standard bounding box [minLon, minLat, maxLon, maxLat]
export function calculateBbox(coordinates) {
  if (!coordinates || coordinates.length === 0) return [77.5896, 12.9666, 77.5996, 12.9766];
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  coordinates.forEach(([lon, lat]) => {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

  return [minLon, minLat, maxLon, maxLat];
}

// Compute bounding box with percentage buffer margin (default: 10%)
export function calculateBboxWithBuffer(coordinates, bufferPercent = 0.1) {
  const [minLon, minLat, maxLon, maxLat] = calculateBbox(coordinates);
  const lonSpan = Math.max(maxLon - minLon, 0.002);
  const latSpan = Math.max(maxLat - minLat, 0.002);

  const lonMargin = lonSpan * bufferPercent;
  const latMargin = latSpan * bufferPercent;

  return [
    Number((minLon - lonMargin).toFixed(6)),
    Number((minLat - latMargin).toFixed(6)),
    Number((maxLon + lonMargin).toFixed(6)),
    Number((maxLat + latMargin).toFixed(6)),
  ];
}

// Compute polygon centroid [lat, lon]
export function calculateCentroid(coordinates) {
  if (!coordinates || coordinates.length === 0) return [12.9716, 77.5946];
  let totalLon = 0;
  let totalLat = 0;
  const n = coordinates.length;

  coordinates.forEach(([lon, lat]) => {
    totalLon += lon;
    totalLat += lat;
  });

  return [Number((totalLat / n).toFixed(6)), Number((totalLon / n).toFixed(6))];
}

// Construct GeoJSON object from coordinates list
export function createPolygonGeoJson(id, name, coordinates, properties = {}) {
  // Ensure closed loop
  const ring = [...coordinates];
  if (
    ring.length > 0 &&
    (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])
  ) {
    ring.push([ring[0][0], ring[0][1]]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          parcel_id: id,
          name,
          ...properties,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
      },
    ],
  };
}
