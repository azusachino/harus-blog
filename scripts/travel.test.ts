import { test, expect } from 'bun:test';
import { validateTravelGeoJSON } from './travel';
import fs from 'node:fs';
import path from 'node:path';

test('travel validation catches negative cases', () => {
  const tmpFile = path.resolve('.tmp_test_travel.geojson');
  const base = {
    type: 'FeatureCollection',
    schema: 'felicia.journey.geojson.v1',
    generator: 'test',
    properties: {
      slug: 'test-trip',
      title: 'Test Trip',
      date_start: '2026-08-01',
      date_end: '2026-08-02',
    },
    features: [
      {
        type: 'Feature',
        id: 'stop-1',
        properties: { role: 'stop', label: 'Stop 1' },
        geometry: { type: 'Point', coordinates: [139.1234, 35.1234] },
      },
      {
        type: 'Feature',
        id: 'memento-1',
        properties: {
          role: 'memento',
          stop_key: 'stop-1',
          seq: 1,
          media: [{ immich_asset_id: '00000000-0000-0000-0000-000000000001', caption: 'Test' }],
        },
        geometry: { type: 'Point', coordinates: [139.1234, 35.1234] },
      },
    ],
  };

  try {
    // 1. Valid case
    fs.writeFileSync(tmpFile, JSON.stringify(base));
    expect(validateTravelGeoJSON(tmpFile)).toEqual([]);

    // 2. Too many decimal places (>4)
    const invalidCoords = JSON.parse(JSON.stringify(base));
    invalidCoords.features[0].geometry.coordinates = [139.123456, 35.1234];
    fs.writeFileSync(tmpFile, JSON.stringify(invalidCoords));
    expect(validateTravelGeoJSON(tmpFile).some((e) => e.includes('more than 4 decimal places'))).toBe(true);

    // 3. Dangling stop_key
    const danglingStopKey = JSON.parse(JSON.stringify(base));
    danglingStopKey.features[1].properties.stop_key = 'non-existent-stop';
    fs.writeFileSync(tmpFile, JSON.stringify(danglingStopKey));
    expect(validateTravelGeoJSON(tmpFile).some((e) => e.includes('does not match any stop id'))).toBe(true);

    // 4. Duplicate seq
    const duplicateSeq = JSON.parse(JSON.stringify(base));
    duplicateSeq.features.push({
      type: 'Feature',
      id: 'memento-2',
      properties: {
        role: 'memento',
        stop_key: 'stop-1',
        seq: 1, // Duplicate
        media: [{ immich_asset_id: '00000000-0000-0000-0000-000000000002', caption: 'Test 2' }],
      },
      geometry: { type: 'Point', coordinates: [139.1234, 35.1234] },
    });
    fs.writeFileSync(tmpFile, JSON.stringify(duplicateSeq));
    expect(validateTravelGeoJSON(tmpFile).some((e) => e.includes('duplicate memento seq'))).toBe(true);

    // 5. Missing immich_asset_id
    const missingAsset = JSON.parse(JSON.stringify(base));
    delete missingAsset.features[1].properties.media[0].immich_asset_id;
    fs.writeFileSync(tmpFile, JSON.stringify(missingAsset));
    expect(validateTravelGeoJSON(tmpFile).some((e) => e.includes('missing immich_asset_id'))).toBe(true);
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});
