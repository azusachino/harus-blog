import fs from 'node:fs';
import path from 'node:path';

const TRAVEL_DIR = path.resolve('docs/travel');

interface ValidationResult {
  file: string;
  errors: string[];
}

function countDecimals(n: number): number {
  const str = n.toString();
  const dot = str.indexOf('.');
  return dot >= 0 ? str.length - dot - 1 : 0;
}

function checkCoordinates(coords: any, pathContext: string, errors: string[]) {
  if (typeof coords === 'number') {
    if (countDecimals(coords) > 4) {
      errors.push(`${pathContext}: coordinate ${coords} has more than 4 decimal places (D15 rule)`);
    }
  } else if (Array.isArray(coords)) {
    coords.forEach((item, idx) => checkCoordinates(item, `${pathContext}[${idx}]`, errors));
  }
}

export function validateTravelGeoJSON(filePath: string): string[] {
  const errors: string[] = [];
  const raw = fs.readFileSync(filePath, 'utf-8');

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return [`Invalid JSON: ${(err as Error).message}`];
  }

  // 1. Top-level schema check
  if (data.type !== 'FeatureCollection') {
    errors.push(`Expected type === "FeatureCollection", got "${data.type}"`);
  }
  if (data.schema !== 'felicia.journey.geojson.v1') {
    errors.push(`Invalid schema: expected "felicia.journey.geojson.v1", got "${data.schema}"`);
  }

  // Properties check
  const props = data.properties || {};
  if (!props.slug || typeof props.slug !== 'string') {
    errors.push('Missing properties.slug');
  }
  if (!props.title || typeof props.title !== 'string') {
    errors.push('Missing properties.title');
  }
  if (!props.date_start || !props.date_end) {
    errors.push('Missing properties.date_start or properties.date_end');
  }

  const features = Array.isArray(data.features) ? data.features : [];
  if (features.length === 0) {
    errors.push('FeatureCollection has no features');
  }

  // Check stops and collect stop IDs
  const stopIds = new Set<string>();
  const seqSet = new Set<number>();

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const role = f.properties?.role;
    const prefix = `features[${i}] (role: ${role})`;

    // Check geometry coordinates precision
    if (f.geometry?.coordinates) {
      checkCoordinates(f.geometry.coordinates, `${prefix}.geometry.coordinates`, errors);
    }

    if (role === 'stop') {
      if (!f.id) {
        errors.push(`${prefix}: stop feature is missing an id`);
      } else {
        stopIds.add(f.id);
      }
      if (!f.properties?.label) {
        errors.push(`${prefix}: stop feature is missing properties.label`);
      }
    } else if (role === 'memento') {
      const stopKey = f.properties?.stop_key;
      const seq = f.properties?.seq;
      const media = f.properties?.media;

      if (!stopKey) {
        errors.push(`${prefix}: memento is missing stop_key`);
      }

      if (typeof seq !== 'number') {
        errors.push(`${prefix}: memento seq must be a number`);
      } else {
        if (seqSet.has(seq)) {
          errors.push(`${prefix}: duplicate memento seq "${seq}"`);
        }
        seqSet.add(seq);
      }

      if (!Array.isArray(media) || media.length === 0) {
        errors.push(`${prefix}: memento must have at least one media entry`);
      } else {
        media.forEach((item: any, mIdx: number) => {
          if (!item.immich_asset_id || typeof item.immich_asset_id !== 'string') {
            errors.push(`${prefix}.media[${mIdx}]: missing immich_asset_id (D12/D15 rule)`);
          }
          if (!item.caption || typeof item.caption !== 'string') {
            errors.push(`${prefix}.media[${mIdx}]: missing caption`);
          }
        });
      }
    } else if (role === 'route') {
      if (f.geometry?.type !== 'LineString' && f.geometry?.type !== 'MultiLineString') {
        errors.push(`${prefix}: route geometry must be LineString or MultiLineString`);
      }
    }
  }

  // 2. Referential integrity: check mementos point to valid stopIds
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    if (f.properties?.role === 'memento') {
      const stopKey = f.properties?.stop_key;
      if (stopKey && !stopIds.has(stopKey)) {
        errors.push(`features[${i}]: memento stop_key "${stopKey}" does not match any stop id`);
      }
    }
  }

  return errors;
}

// Main CLI runner
if (import.meta.main) {
  if (!fs.existsSync(TRAVEL_DIR)) {
    console.log('No travel directory found. Skipping travel check.');
    process.exit(0);
  }

  const files = fs.readdirSync(TRAVEL_DIR).filter((f) => f.endsWith('.geojson'));
  if (files.length === 0) {
    console.log('No travel GeoJSON files found. Skipping.');
    process.exit(0);
  }

  let totalErrors = 0;
  for (const file of files) {
    const fullPath = path.join(TRAVEL_DIR, file);
    const errors = validateTravelGeoJSON(fullPath);
    if (errors.length > 0) {
      console.error(`\n❌ Travel validation failed for ${file}:`);
      for (const err of errors) {
        console.error(`  - ${err}`);
      }
      totalErrors += errors.length;
    }
  }

  if (totalErrors > 0) {
    console.error(`\nTotal travel errors: ${totalErrors}`);
    process.exit(1);
  }

  console.log(`✓ Travel contract holds across ${files.length} travel file(s)`);
}
