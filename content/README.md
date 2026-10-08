# Content feed

The app downloads `feed.json` from the `main` branch on start (see `extra.contentFeedUrl` in `app.json`), so wellness facts and recovery stories can be updated without releasing a new app version. If the download fails, the app uses the last copy it saved and the facts bundled in the app.

## Facts

```json
{
  "id": "unique-id",
  "category": "science",
  "title": "Short headline",
  "body": "One or two sentences describing the finding.",
  "source": "Author et al., Journal, Year",
  "url": "https://doi.org/...",
  "i18n": { "hi": { "title": "…", "body": "…" } }
}
```

`category` is one of `science`, `habits`, `body`, `mind`, `connection`. Use an existing `id` (for example `habits66`) to replace a bundled fact. Only add findings from published research and link the source.

## Testimonials

```json
{
  "id": "unique-id",
  "name": "R. (first name or initials only)",
  "country": "IN",
  "milestone": "2 years free",
  "quote": "Their story in their own words.",
  "lang": "en"
}
```

Only publish real stories from real people who gave **written permission**. Never write, edit the meaning of, or make up testimonials: doing so is deceptive and breaks consumer-protection law and app store rules.

# Background music

`music.json` lists the background tracks for guided sessions (see `extra.musicCatalogUrl` in `app.json`). Tracks are not built into the app: each one downloads the first time someone picks it, then plays offline. Edit this file to add, rename or replace tracks without releasing a new app version. If the download fails, the app uses the last list it saved, then the copy of `music.json` built into the app.

```json
{
  "id": "rain",
  "title": "Soft rain",
  "i18n": { "hi": "हल्की बारिश", "es": "Lluvia suave" },
  "file": "music/rain.m4a",
  "bytes": 2225645,
  "seconds": 180,
  "version": 1,
  "license": "Where the track comes from and the licence that covers it"
}
```

- `file` is relative to `music.json`, or a full `https://` URL if the audio is hosted elsewhere (a CDN is better than GitHub once many people use the app).
- Use **AAC in an `.m4a` file** (it plays everywhere, including iPhone). About 96 kbps stereo keeps a 3-minute loop near 2 MB. Make the end flow into the start: tracks loop for the whole session.
- `bytes` is the file size, shown before someone downloads it.
- Change `version` whenever you replace a file under the same `id`, so phones download the new one. Removing a track from the list deletes it from phones the next time they load the list.
- `title` is the English name; `i18n` gives names in other app languages (`hi`, `mr`, `es`, `ar`, `pt`, `zh`, `fr`, `bn`, `ru`, `ur`, `id`, `de`, `ja`).
- Only add music you have the right to use in a commercial app. For AI-generated music, check that the generator's plan grants commercial rights, and record that in `license`.

The four tracks here are original compositions made by `scripts/make-music.py`.
