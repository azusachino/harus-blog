export interface GeoPoint {
  x: number;
  y: number;
  lon: number;
  lat: number;
}

export interface ProjectedStop extends GeoPoint {
  id: string;
  label: string;
  arrive: string;
  depart: string;
}

export interface ProjectedMemento extends GeoPoint {
  id: string;
  stopKey: string;
  seq: number;
  kind: string;
  occurredAt: string;
  title: string;
  essay: string;
  media: Array<{
    immich_asset_id: string;
    caption: string;
    seq: number;
  }>;
}

export interface ProjectedMap {
  width: number;
  height: number;
  viewBox: string;
  routePath: string;
  stops: ProjectedStop[];
  mementos: ProjectedMemento[];
}

export function projectJourney(
  features: Array<any>,
  width = 800,
  height = 500,
  padding = 40
): ProjectedMap {
  // Collect all [lon, lat] points to determine bounding box
  const allCoords: [number, number][] = [];

  const routeFeature = features.find((f) => f.properties?.role === 'route');
  if (routeFeature && routeFeature.geometry?.coordinates) {
    for (const pt of routeFeature.geometry.coordinates) {
      allCoords.push([pt[0], pt[1]]);
    }
  }

  const stopFeatures = features.filter((f) => f.properties?.role === 'stop');
  for (const s of stopFeatures) {
    if (s.geometry?.coordinates) {
      allCoords.push([s.geometry.coordinates[0], s.geometry.coordinates[1]]);
    }
  }

  const mementoFeatures = features.filter((f) => f.properties?.role === 'memento');
  for (const m of mementoFeatures) {
    if (m.geometry?.coordinates) {
      allCoords.push([m.geometry.coordinates[0], m.geometry.coordinates[1]]);
    }
  }

  if (allCoords.length === 0) {
    return {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      routePath: '',
      stops: [],
      mementos: [],
    };
  }

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of allCoords) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const midLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const cosMidLat = Math.cos(midLatRad);

  const rawWidth = Math.max((maxLon - minLon) * cosMidLat, 0.0001);
  const rawHeight = Math.max(maxLat - minLat, 0.0001);

  const availWidth = width - padding * 2;
  const availHeight = height - padding * 2;

  const scale = Math.min(availWidth / rawWidth, availHeight / rawHeight);

  const drawnWidth = rawWidth * scale;
  const drawnHeight = rawHeight * scale;

  const offsetX = padding + (availWidth - drawnWidth) / 2;
  const offsetY = padding + (availHeight - drawnHeight) / 2;

  const project = (lon: number, lat: number): { x: number; y: number } => {
    const normX = (lon - minLon) * cosMidLat;
    const normY = maxLat - lat; // SVG y points down
    return {
      x: Math.round((offsetX + normX * scale) * 10) / 10,
      y: Math.round((offsetY + normY * scale) * 10) / 10,
    };
  };

  // Build route SVG path
  let routePath = '';
  if (routeFeature && routeFeature.geometry?.coordinates) {
    const pts = routeFeature.geometry.coordinates.map((c: [number, number]) => project(c[0], c[1]));
    if (pts.length > 0) {
      routePath = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p: any) => `L ${p.x} ${p.y}`).join(' ');
    }
  }

  // Project stops
  const stops: ProjectedStop[] = stopFeatures.map((s) => {
    const coords = s.geometry.coordinates;
    const p = project(coords[0], coords[1]);
    return {
      id: s.id || '',
      label: s.properties.label || '',
      arrive: s.properties.arrive || '',
      depart: s.properties.depart || '',
      lon: coords[0],
      lat: coords[1],
      x: p.x,
      y: p.y,
    };
  });

  // Project mementos
  const mementos: ProjectedMemento[] = mementoFeatures.map((m) => {
    const coords = m.geometry.coordinates;
    const p = project(coords[0], coords[1]);
    return {
      id: m.id || '',
      stopKey: m.properties.stop_key || '',
      seq: m.properties.seq || 0,
      kind: m.properties.kind || '',
      occurredAt: m.properties.occurred_at || '',
      title: m.properties.title || '',
      essay: m.properties.essay || '',
      media: m.properties.media || [],
      lon: coords[0],
      lat: coords[1],
      x: p.x,
      y: p.y,
    };
  });

  return {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    routePath,
    stops,
    mementos,
  };
}
