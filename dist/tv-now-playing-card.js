// tv-now-playing-card: what the living room TV is playing, from var.living_room_tv.
// Cover as the card background, text and progress on top.
// Config: { type: custom:tv-now-playing-card, entity: var.living_room_tv, height: 140 }
const VERSION = '0.0.0-dev'; // The release workflow stamps the real version.

const ICONS = {
  Plex: 'mdi:plex',
  YouTube: 'mdi:youtube',
  Netflix: 'mdi:netflix',
  Spotify: 'mdi:spotify',
  'PlayStation 5': 'mdi:sony-playstation',
  'Nintendo Switch': 'mdi:nintendo-switch',
  'Apple TV': 'mdi:apple',
  'Disney+': 'mdi:movie-open-star',
  'Prime Video': 'mdi:filmstrip-box',
  'HDMI 3': 'mdi:video-input-hdmi',
};

// Background colour per app, used when there is no cover.
const BRANDS = {
  Plex: '#e5a00d',
  YouTube: '#ff0033',
  Netflix: '#e50914',
  Spotify: '#1db954',
  'PlayStation 5': '#0070d1',
  'Nintendo Switch': '#e60012',
  'Apple TV': '#555555',
  'Disney+': '#113ccf',
  'Prime Video': '#00a8e1',
};

const hms = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return `${h ? h + ':' + String(m).padStart(2, '0') : m}:${String(sec).padStart(2, '0')}`;
};

const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

class TvNowPlayingCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) throw new Error('Set entity, e.g. var.living_room_tv');
    this._config = { height: 140, ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
    const st = hass.states[this._config.entity];
    const key = st ? st.last_updated : 'none';
    if (key !== this._key) {
      this._key = key;
      this._render(st);
    }
  }

  connectedCallback() {
    this._timer = setInterval(() => this._tick(), 1000);
  }
  disconnectedCallback() {
    clearInterval(this._timer);
  }

  _position(a, state) {
    const dur = Number(a.media_duration) || 0;
    let pos = Number(a.media_position) || 0;
    if (state === 'playing' && a.media_position_updated_at) {
      pos += (Date.now() - new Date(a.media_position_updated_at).getTime()) / 1000;
    }
    return { dur, pos: dur ? Math.min(pos, dur) : pos };
  }

  _tick() {
    const st = this._hass?.states[this._config.entity];
    if (!st || !this.shadowRoot) return;
    const { dur, pos } = this._position(st.attributes, st.state);
    const fill = this.shadowRoot.querySelector('.fill');
    const time = this.shadowRoot.querySelector('.time');
    if (fill && dur) fill.style.width = `${(pos / dur) * 100}%`;
    if (time && dur) time.textContent = `${hms(pos)} / ${hms(dur)}`;
  }

  _render(st) {
    if (!st) {
      this.shadowRoot.innerHTML = `<ha-card><div style="padding:16px">Entity not found</div></ha-card>`;
      return;
    }
    // `app` (var/template entities) or `app_name` (media_player entities), else the entity name.
    const a = { ...st.attributes, app: st.attributes.app || st.attributes.app_name || st.attributes.friendly_name };
    const sub = [
      a.media_series_title,
      a.media_season && a.media_episode ? `S${a.media_season}E${a.media_episode}` : '',
      a.media_artist,
      a.media_album_name,
    ]
      .filter(Boolean)
      .join(' · ');
    const { dur, pos } = this._position(a, st.state);
    const pct = dur ? (pos / dur) * 100 : 0;
    const state = st.state.charAt(0).toUpperCase() + st.state.slice(1);
    // With a cover: cover behind a dark shade, full height. Without: the app's colour, compact.
    const cover = !!a.entity_picture;
    const brand = BRANDS[a.app] ?? 'var(--primary-color)';
    const bg = cover
      ? `background-image:url('${esc(a.entity_picture)}')`
      : `background:linear-gradient(120deg, ${brand} 0%, color-mix(in srgb, ${brand} 35%, #000) 100%)`;
    const minHeight = cover ? Number(this._config.height) : 0;
    // Without a media title the app name is the title, so it is not shown twice.
    const title = a.media_title || a.app;
    const appLabel = a.media_title ? a.app : '';

    this.shadowRoot.innerHTML = `
      <style>
        ha-card { position: relative; overflow: hidden; min-height: ${minHeight}px; color: #fff; }
        .bg { position: absolute; inset: 0; background: center 25% / cover no-repeat; transform: scale(1.05); }
        .shade { position: absolute; inset: 0; display: ${cover ? 'block' : 'none'};
                 background: linear-gradient(90deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.6) 55%, rgba(0,0,0,.25) 100%); }
        .info { position: relative; padding: 14px 16px; min-height: ${minHeight}px; box-sizing: border-box;
                display: flex; flex-direction: column; justify-content: flex-end; gap: 4px; }
        .app { display: flex; align-items: center; gap: 6px; font-size: .9em; opacity: .9; }
        .app ha-icon { --mdc-icon-size: 18px; }
        .badge { margin-left: auto; padding: 2px 8px; border-radius: 10px; font-size: .8em; background: rgba(255,255,255,.22); }
        .title { font-size: 1.35em; font-weight: 600; line-height: 1.2; text-shadow: 0 1px 4px rgba(0,0,0,.6);
                 display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .sub { opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .row { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
        .bar { flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,.25); overflow: hidden; }
        .fill { height: 100%; background: #fff; transition: width 1s linear; }
        .time { font-size: .8em; opacity: .9; font-variant-numeric: tabular-nums; white-space: nowrap; }
      </style>
      <ha-card>
        <div class="bg" style="${bg}"></div>
        <div class="shade"></div>
        <div class="info">
          <div class="app">
            <ha-icon icon="${esc(ICONS[a.app] ?? 'mdi:television-play')}"></ha-icon>
            <span>${esc(appLabel)}</span>
            <span class="badge">${esc(state)}</span>
          </div>
          <div class="title">${esc(title)}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
          ${
            dur
              ? `<div class="row"><div class="bar"><div class="fill" style="width:${pct}%"></div></div>
                   <div class="time">${hms(pos)} / ${hms(dur)}</div></div>`
              : ''
          }
        </div>
      </ha-card>`;
  }

  getCardSize() {
    return 3;
  }
  getGridOptions() {
    return { columns: 'full', rows: 'auto' };
  }
}

if (!customElements.get('tv-now-playing-card')) {
  customElements.define('tv-now-playing-card', TvNowPlayingCard);
  console.info(
    `%c TV-NOW-PLAYING-CARD %c ${VERSION} `,
    'color:#fff;background:#c2410c;font-weight:600',
    'color:#c2410c',
  );
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'tv-now-playing-card',
  name: 'TV now playing',
  description: 'Cover as background, title, app and progress from var.living_room_tv',
});
