import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTitle, bumpFor, nextVersion } from '../scripts/release-version.js';

test('accepts Conventional Commit titles', () => {
  for (const title of ['feat: add a thing', 'fix(card): wrong colour', 'feat!: drop the old option', 'chore: update']) {
    assert.doesNotThrow(() => checkTitle(title), title);
  }
});

test('rejects other titles', () => {
  for (const title of ['Add a thing', 'feat:missing space', 'feature: add', 'fix: ', '']) {
    assert.throws(() => checkTitle(title), /must look like/, title);
  }
});

test('feat gives a minor version, fix and others a patch version', () => {
  assert.equal(bumpFor(['fix: a', 'docs: b']), 'patch');
  assert.equal(bumpFor(['fix: a', 'feat: b']), 'minor');
});

test('! or BREAKING CHANGE gives a major version', () => {
  assert.equal(bumpFor(['feat!: a']), 'major');
  assert.equal(bumpFor(['fix(card)!: a']), 'major');
  assert.equal(bumpFor(['feat: a\n\nBREAKING CHANGE: the option is gone']), 'major');
});

test('computes the next version', () => {
  assert.equal(nextVersion('v1.0.1', 'patch'), '1.0.2');
  assert.equal(nextVersion('v1.0.1', 'minor'), '1.1.0');
  assert.equal(nextVersion('v1.0.1', 'major'), '2.0.0');
  assert.equal(nextVersion(null, 'minor'), '0.1.0');
});
