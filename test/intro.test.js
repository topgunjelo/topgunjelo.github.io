import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldPlayIntro } from '../src/lib/intro.ts';

const visit = overrides => shouldPlayIntro({ seen: false, hash: '', navigationType: 'navigate', ...overrides });

test('a first, plain arrival plays the intro', () => {
  assert.equal(visit(), true);
  assert.equal(visit({ hash: '#home' }), true);
  assert.equal(visit({ navigationType: 'reload' }), true);
});

test('it plays once per session', () => {
  assert.equal(visit({ seen: true }), false);
});

test('deep links go straight to their section or project', () => {
  assert.equal(visit({ hash: '#work' }), false);
  assert.equal(visit({ hash: '#project-noctime' }), false);
});

test('Back/Forward restores the page instead of replaying', () => {
  assert.equal(visit({ navigationType: 'back_forward' }), false);
});
