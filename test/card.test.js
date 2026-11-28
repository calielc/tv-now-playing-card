import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';

const source = await readFile(new URL('../dist/tv-now-playing-card.js', import.meta.url), 'utf8');
const window = new Window();

before(() => {
  window.console.info = () => {};
  window.eval(source);
});

after(() => window.happyDOM.close());

const render = (state, attributes) => {
  const card = window.document.createElement('tv-now-playing-card');
  card.setConfig({ entity: 'var.tv' });
  window.document.body.appendChild(card);
  card.hass = { states: { 'var.tv': { state, attributes, last_updated: String(Math.random()) } } };
  return card.shadowRoot;
};

const text = (root, selector) => root.querySelector(selector)?.textContent.trim();

test('needs an entity', () => {
  const card = window.document.createElement('tv-now-playing-card');
  assert.throws(() => card.setConfig({}), /Set entity/);
});

test('shows app, title, series and episode for Plex', () => {
  const root = render('playing', {
    app: 'Plex',
    media_title: 'Malware',
    media_series_title: 'VisionQuest',
    media_season: 1,
    media_episode: 4,
    media_duration: 2889,
    media_position: 2727,
    media_position_updated_at: new Date().toISOString(),
    entity_picture: '/api/media_player_proxy/x',
  });
  assert.equal(text(root, '.app span'), 'Plex');
  assert.equal(text(root, '.badge'), 'Playing');
  assert.equal(text(root, '.title'), 'Malware');
  assert.equal(text(root, '.sub'), 'VisionQuest · S1E4');
  assert.match(text(root, '.time'), /^45:2\d \/ 48:09$/);
  assert.match(root.querySelector('.bg').getAttribute('style'), /media_player_proxy/);
});

test('shows the app name once when there is no title', () => {
  const root = render('playing', { app: 'Netflix' });
  assert.equal(text(root, '.title'), 'Netflix');
  assert.equal(text(root, '.app span'), '');
  assert.equal(root.querySelector('.bar'), null);
  assert.match(root.querySelector('.bg').getAttribute('style'), /#e50914/);
});

test('does not move the progress while paused', () => {
  const root = render('paused', {
    app: 'YouTube',
    media_title: 'Video',
    media_duration: 600,
    media_position: 120,
    media_position_updated_at: new Date(Date.now() - 60_000).toISOString(),
  });
  assert.equal(text(root, '.badge'), 'Paused');
  assert.equal(text(root, '.time'), '2:00 / 10:00');
});

test('works with a media_player entity (app_name instead of app)', () => {
  const root = render('playing', {
    app_name: 'Spotify',
    media_title: 'Toxicity',
    media_artist: 'System Of A Down',
    friendly_name: 'TV (Cast)',
  });
  assert.equal(text(root, '.app span'), 'Spotify');
  assert.equal(text(root, '.sub'), 'System Of A Down');
});

test('falls back to the entity name when there is no app', () => {
  const root = render('playing', { friendly_name: 'Living room TV' });
  assert.equal(text(root, '.title'), 'Living room TV');
});

test('escapes text from the entity', () => {
  const root = render('playing', { app: 'Plex', media_title: '<img src=x onerror=alert(1)>' });
  assert.equal(root.querySelector('.title img'), null);
  assert.equal(text(root, '.title'), '<img src=x onerror=alert(1)>');
});
