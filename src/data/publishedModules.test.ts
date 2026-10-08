import assert from 'node:assert/strict';
import { test } from 'node:test';
import { courseModules, publicationState, visibleModules } from './publishedModules';

test('publication stores flags only; student text always comes from bundled course data', () => {
  const source = [courseModules[1], { ...courseModules[0], isCompleted: true }];
  const flags = publicationState(source);
  assert.deepEqual(flags, [
    { id: source[0].id, isCompleted: false },
    { id: source[1].id, isCompleted: true },
  ]);
  assert.ok(!JSON.stringify(flags).includes('recommendedPrompts'));
  const resolved = visibleModules([{ ...flags[0], recommendedPrompts: ['injected'] }, flags[1], flags[0], { id: 'unknown' }]);
  assert.deepEqual(resolved.map(module => module.id), source.map(module => module.id));
  assert.deepEqual(resolved[0].recommendedPrompts, source[0].recommendedPrompts);
  assert.equal(resolved[1].isCompleted, true);
  assert.deepEqual(visibleModules(undefined), []);
  assert.deepEqual(visibleModules([]), []);
  assert.throws(() => publicationState([{ ...source[0], id: 'unknown' }]));
});
