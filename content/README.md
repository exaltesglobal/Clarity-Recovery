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
