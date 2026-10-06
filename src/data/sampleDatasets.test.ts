import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getInitialDatasets } from './sampleDatasets';

const manufacturing = getInitialDatasets().filter(item => item.id.startsWith('dataset-manufacturing-'));
const rowsFor = (id: string) => {
  const dataset = manufacturing.find(item => item.id === id);
  assert.ok(dataset, `${id} is available to students`);
  const [header, ...lines] = dataset.csvContent.split('\n');
  const rows = lines.map(line => line.split(','));
  assert.equal(dataset.rowCount, rows.length);
  assert.ok(rows.every(row => row.length === header.split(',').length), `${id} keeps CSV columns aligned`);
  return rows;
};

test('manufacturing datasets are stable, complete CSVs with inspection cases', () => {
  assert.equal(manufacturing.length, 3);
  const secondCopy = getInitialDatasets();
  for (const dataset of manufacturing) {
    assert.equal(dataset.csvContent, secondCopy.find(item => item.id === dataset.id)?.csvContent);
  }

  const progress = rowsFor('dataset-manufacturing-process-progress');
  assert.equal(progress.length, 72);
  assert.equal(progress.filter(row => row[9] === 'IN_PROGRESS' && !row[6]).length, 3);
  assert.ok(progress.some(row => row[9] === 'COMPLETED' && !row[5]));
  assert.ok(progress.some(row => row[9] === 'COMPLETED' && !row[6]));
  assert.ok(progress.some(row => row[6] && row[5] && row[6] < row[5]));
  assert.ok(progress.some(row => Number(row[8]) > Number(row[7])));

  const movement = rowsFor('dataset-manufacturing-logistics-movement');
  assert.equal(movement.length, 64);
  assert.ok(new Set(movement.map(row => row[0])).size < movement.length);
  assert.ok(movement.some(row => !row[2] || !row[5] || !row[9]));
  assert.ok(movement.some(row => row[9] && row[9] < row[7]));
  assert.ok(movement.some(row => row[4] === 'UNKNOWN_AREA'));

  const production = rowsFor('dataset-manufacturing-production-trend');
  assert.equal(production.length, 72);
  assert.ok(production.some(row => !row[6] || !row[10]));
  assert.ok(production.some(row => Number(row[8]) < 0));
  assert.ok(production.some(row => row[6] && Number(row[7]) + Number(row[8]) !== Number(row[6])));
  const etchMean = (date: string) => {
    const values = production.filter(row => row[0] === date && row[2] === 'ETCH-01' && row[6]).map(row => Number(row[6]));
    return values.reduce((total, value) => total + value, 0) / values.length;
  };
  assert.ok(etchMean('2026-09-14') - etchMean('2026-09-21') > 15);
});
