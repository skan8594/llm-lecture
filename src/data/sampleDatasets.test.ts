import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getInitialDatasets, upgradeShippedManufacturingDataset } from './sampleDatasets';

const manufacturing = getInitialDatasets().filter(item => item.id.startsWith('dataset-manufacturing-'));

function recordsFor(id: string) {
  const dataset = manufacturing.find(item => item.id === id);
  assert.ok(dataset, `${id} is available to students`);
  const [header, ...lines] = dataset.csvContent.split('\n');
  const columns = header.split(',');
  const records = lines.map(line => {
    const values = line.split(',');
    assert.equal(values.length, columns.length, `${id} keeps CSV columns aligned`);
    return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  });
  assert.equal(dataset.rowCount, records.length);
  return { dataset, columns, records };
}

test('manufacturing CSVs are deterministic and use MES, AMHS and equipment fields', () => {
  assert.equal(manufacturing.length, 3);
  const secondCopy = getInitialDatasets();
  for (const dataset of manufacturing) {
    assert.equal(dataset.csvContent, secondCopy.find(item => item.id === dataset.id)?.csvContent);
    assert.ok(!dataset.csvContent.split('\n')[0].includes('scrap_qty'));
    assert.ok(!dataset.csvContent.split('\n')[0].includes('good_qty'));
  }

  const progress = recordsFor('dataset-manufacturing-process-progress');
  assert.equal(progress.records.length, 72);
  assert.deepEqual(progress.columns, [
    'lot_id', 'route_id', 'operation_seq', 'operation_code', 'equipment_id', 'wafer_count',
    'planned_track_in_at', 'track_in_at', 'planned_track_out_at', 'track_out_at', 'wip_status', 'hold_reason',
  ]);
  assert.equal(new Set(progress.records.map(row => row.lot_id)).size, 18);
  for (const lot of new Set(progress.records.map(row => row.lot_id))) {
    assert.deepEqual(progress.records.filter(row => row.lot_id === lot).map(row => row.operation_seq), ['10', '20', '30', '40']);
  }
  assert.equal(progress.records.filter(row => row.wip_status === 'IN_PROCESS' && !row.track_out_at).length, 2);
  assert.equal(progress.records.filter(row => row.wip_status === 'ON_HOLD' && !row.track_out_at && row.hold_reason === 'SPC_REVIEW').length, 2);
  assert.ok(progress.records.some(row => row.wip_status === 'TRACKED_OUT' && !row.track_in_at));
  assert.ok(progress.records.some(row => row.wip_status === 'TRACKED_OUT' && !row.track_out_at));
  assert.ok(progress.records.some(row => row.track_in_at.includes('XX')));
  assert.ok(progress.records.some(row => row.track_in_at && row.track_out_at && row.track_out_at < row.track_in_at));
  assert.ok(progress.records.some(row => !row.equipment_id || row.wafer_count === '0' || row.wip_status === 'DONE?'));

  const movement = recordsFor('dataset-manufacturing-logistics-movement');
  assert.equal(movement.records.length, 64);
  assert.deepEqual(movement.columns, [
    'transport_job_id', 'lot_id', 'foup_id', 'source_location', 'destination_location', 'oht_id',
    'request_at', 'target_delivery_at', 'pickup_at', 'delivery_at', 'job_status',
  ]);
  assert.equal(new Set(movement.records.map(row => row.lot_id)).size, 16);
  assert.equal(movement.records.filter(row => row.job_status === 'QUEUED' && !row.pickup_at && !row.delivery_at).length, 1);
  assert.equal(movement.records.filter(row => row.job_status === 'IN_TRANSIT' && row.pickup_at && !row.delivery_at).length, 2);
  assert.ok(movement.records.some(row => row.job_status === 'DELIVERED' && (!row.foup_id || !row.oht_id || !row.pickup_at || !row.delivery_at)));
  assert.ok(movement.records.some(row => row.pickup_at && row.delivery_at && row.delivery_at < row.pickup_at));
  assert.ok(new Set(movement.records.map(row => row.transport_job_id)).size < movement.records.length);
  assert.ok(movement.records.some(row => row.destination_location === 'UNKNOWN_LOC'));

  const production = recordsFor('dataset-manufacturing-production-trend');
  assert.equal(production.records.length, 72);
  assert.deepEqual(production.columns, [
    'work_date', 'shift', 'equipment_id', 'operation_code', 'scheduled_minutes', 'productive_minutes',
    'standby_minutes', 'down_minutes', 'plan_track_out_lots', 'track_out_lots', 'track_out_wafers', 'wip_end_lots',
  ]);
  assert.ok(production.records.every(row => row.scheduled_minutes === '480'));
  assert.ok(production.records.some(row => !row.track_out_lots || !row.down_minutes));
  assert.ok(production.records.some(row => Number(row.down_minutes) < 0 || Number(row.wip_end_lots) < 0));
  assert.ok(production.records.some(row => row.shift === 'NITE'));
  assert.ok(production.records.some(row => row.down_minutes && Number(row.productive_minutes) + Number(row.standby_minutes) + Number(row.down_minutes) !== 480));
  assert.ok(production.records.some(row => row.track_out_lots && Number(row.track_out_wafers) !== Number(row.track_out_lots) * 25));
  const etchMean = (date: string, field: 'track_out_lots' | 'down_minutes') => {
    const values = production.records.filter(row => row.work_date === date && row.equipment_id === 'ETCH-01' && row[field]).map(row => Number(row[field]));
    return values.reduce((total, value) => total + value, 0) / values.length;
  };
  assert.ok(etchMean('2026-09-14', 'track_out_lots') - etchMean('2026-09-21', 'track_out_lots') >= 1);
  assert.ok(etchMean('2026-09-21', 'down_minutes') > etchMean('2026-09-14', 'down_minutes'));
});

test('customized or already-current manufacturing datasets are left unchanged', () => {
  const current = manufacturing[0];
  assert.equal(upgradeShippedManufacturingDataset(current, manufacturing), current);
  const customized = { ...current, csvContent: `${current.csvContent}\nCUSTOM,ROW` };
  assert.equal(upgradeShippedManufacturingDataset(customized, manufacturing), customized);
});
