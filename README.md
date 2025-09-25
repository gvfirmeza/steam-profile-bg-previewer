# Steam Profile Background Previewer

Preview Steam profile backgrounds before you apply them.

## What it does

* Instant profile preview with your chosen background
* Built-in gallery with hundreds of images
* Zoom control (80%–150%)
* Remembers your last choices (local storage)
* Responsive dark UI

## Run

```bash
# Requires Node.js 14+
git clone https://github.com/yourusername/steam-profile-bg-previewer.git
cd steam-profile-bg-previewer
npm install
npm start
# open: http://localhost:3000
```

## Use

1. Paste your public Steam profile URL.
2. Pick a background:

   * Paste a direct image URL, or
   * Open the gallery and select one.
3. Click **Preview** and adjust the zoom if needed.

## Tips

* The gallery reads from `public/steam_backgrounds.json`.
* To refresh the gallery list, run `scripts/scrapper.py` and replace the JSON in `public/`.

## Structure

```
public/
  app.js
  styles.css
  index.html
  steam_backgrounds.json
server/
  index.js
scripts/
  scrapper.py
```

> Preview only. This does not change your Steam profile.
