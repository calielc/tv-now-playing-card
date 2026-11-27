# TV now playing card

A Lovelace card for Home Assistant that shows what a TV is playing. The cover is the card background. The app, title, series or artist, and a progress bar go on top.

The card reads one entity. Its state is `playing`, `paused`, `idle` or `off`. Its attributes hold the media data.

## Entity

The card expects an entity with these attributes. A [Variable](https://github.com/snarky-snark/home-assistant-variables) entity (`var.*`) filled by Node-RED works. Any entity with the same attributes also works.

| Attribute | Example |
|---|---|
| `app` | `Plex` |
| `media_title` | `Malware` |
| `media_series_title` | `VisionQuest` |
| `media_season`, `media_episode` | `1`, `4` |
| `media_artist`, `media_album_name` | `System Of A Down`, `Toxicity` |
| `media_duration` | `2889` (seconds) |
| `media_position` | `2727` (seconds) |
| `media_position_updated_at` | ISO date and time |
| `entity_picture` | URL of the cover |

Empty attributes are not shown. If there is no cover, the card is compact and its background is the app's brand colour (the theme accent colour for an unknown app). If there is no title, the app name is the title.

## Install

1. Copy `dist/tv-now-playing-card.js` to `/config/www/`.
2. Add it as a dashboard resource: **Settings** > **Dashboards** > **Resources** > `/local/tv-now-playing-card.js`, type **JavaScript module**.
3. Do a hard refresh of the browser.

## Configuration

```yaml
type: custom:tv-now-playing-card
entity: var.living_room_tv
height: 140
visibility:
  - condition: state
    entity: var.living_room_tv
    state: [playing, paused]
```

| Option | Required | Default | Description |
|---|---|---|---|
| `entity` | yes | | The entity to show. |
| `height` | no | `140` | Minimum card height in pixels. |

The progress bar moves every second while the state is `playing`. It uses `media_position` plus the time since `media_position_updated_at`.
