import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCoords, formatCoords } from './coords.js';

test('parseCoords', () => {
  assert.deepEqual(parseCoords('14.5547, 121.0244'), { lat: 14.5547, lng: 121.0244 });
  assert.deepEqual(parseCoords(' -33.8568 151.2153 '), { lat: -33.8568, lng: 151.2153 });
  assert.deepEqual(parseCoords('40.7128° N, 74.0060° W'), { lat: 40.7128, lng: -74.006 });
  assert.deepEqual(parseCoords('33.9S,18.4e'), { lat: -33.9, lng: 18.4 });
  assert.equal(parseCoords('91, 0'), null);
  assert.equal(parseCoords('0, 181'), null);
  assert.equal(parseCoords('Paris'), null);
  assert.equal(parseCoords('74 W, 40 N'), null); // longitude first is ambiguous, rejected
  assert.equal(formatCoords({ lat: 14.5547, lng: -0.1 }), '14.55470, -0.10000');
});
