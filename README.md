<p align="center"><img src="assets/icon.svg" width="96" alt="TV now playing card icon"></p>

# TV now playing card

[![Lint and test](https://github.com/calielc/tv-now-playing-card/actions/workflows/ci.yml/badge.svg)](https://github.com/calielc/tv-now-playing-card/actions/workflows/ci.yml)
[![Validate](https://github.com/calielc/tv-now-playing-card/actions/workflows/validate.yml/badge.svg)](https://github.com/calielc/tv-now-playing-card/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/calielc/tv-now-playing-card)](https://github.com/calielc/tv-now-playing-card/releases)
[![HACS: custom](https://img.shields.io/badge/HACS-custom-orange.svg)](https://hacs.xyz/docs/faq/custom_repositories/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Lovelace card for Home Assistant that shows what a TV is playing. The cover is the card background. The app, title, series or artist, and a progress bar go on top.

The card reads one entity. Its state is `playing`, `paused`, `idle` or `off`. Its attributes hold the media data.

## Entity

Any entity with a state and media attributes works:

- A **media player** (`media_player.*`), for example a Plex, Cast or Spotify player. The app name comes from `app_name`.
- A **[Variable](https://github.com/snarky-snark/home-assistant-variables)** (`var.*`) or a template entity that combines several sources. The app name comes from `app`.

| Attribute                          | Example                        |
| ---------------------------------- | ------------------------------ |
| `app` or `app_name`                | `Plex`                         |
| `media_title`                      | `Malware`                      |
| `media_series_title`               | `VisionQuest`                  |
| `media_season`, `media_episode`    | `1`, `4`                       |
| `media_artist`, `media_album_name` | `System Of A Down`, `Toxicity` |
| `media_duration`                   | `2889` (seconds)               |
| `media_position`                   | `2727` (seconds)               |
| `media_position_updated_at`        | ISO date and time              |
| `entity_picture`                   | URL of the cover               |

Empty attributes are not shown. If there is no app, the entity name is used. If there is no cover, the card is compact and its background is the app's brand colour (the theme accent colour for an unknown app). If there is no title, the app name is the title.

## Install

### HACS or the Marketplace

1. Add `https://github.com/calielc/tv-now-playing-card` as a custom repository, category **Dashboard**.
2. Install **TV now playing card**.
3. Do a hard refresh of the browser.

### Manual

1. Download `tv-now-playing-card.js` from the [latest release](https://github.com/calielc/tv-now-playing-card/releases/latest) and copy it to `/config/www/`.
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

| Option   | Required | Default | Description                    |
| -------- | -------- | ------- | ------------------------------ |
| `entity` | yes      |         | The entity to show.            |
| `height` | no       | `140`   | Minimum card height in pixels. |

The progress bar moves every second while the state is `playing`. It uses `media_position` plus the time since `media_position_updated_at`.

## Development

```sh
npm ci
npm run lint
npm test
```

Changes go to `main` through pull requests only, squash merged. Each pull request needs the `ci`, `hacs` and `title` checks to pass.

### Releases

Every merge into `main` makes a release with a new [semantic version](https://semver.org/). The pull request title, `type: description` in the [Conventional Commits](https://www.conventionalcommits.org/) form, picks the version:

| Title                                              | Version         |
| -------------------------------------------------- | --------------- |
| `feat: …`                                          | minor (`1.1.0`) |
| `feat!: …`, `fix!: …` or a `BREAKING CHANGE:` line | major (`2.0.0`) |
| `fix: …`, `docs: …`, `chore: …` and the others     | patch (`1.0.2`) |

The release workflow tags `vX.Y.Z`, writes the release notes from the commits, and attaches the card with that version stamped in. The version in the repository stays `0.0.0-dev`.

## License

[MIT](LICENSE)
