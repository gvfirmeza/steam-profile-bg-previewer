# Steam Profile Background Previewer

Preview Steam profile backgrounds before you apply them.

## 🌐 Live Demo

**Full App**: [https://bg-previewer-24llm7dzq-gvfirmezas-projects.vercel.app](https://bg-previewer-24llm7dzq-gvfirmezas-projects.vercel.app)  
*Complete Steam profile preview with serverless backend*

## What it does

* 🖼️ **Real Steam profile preview** - See exactly how backgrounds look
* 🎨 **Browse 500+ backgrounds** from the official Steam store  
* 🔍 **Search by game or title** to find the perfect background  
* 🎲 **Random background selector** for discovery
* 💾 **Remembers your preferences** with localStorage
* 📱 **Fully responsive** design for all devices

## Architecture

```
Frontend (Static) ──────────► Vercel API (Serverless)
     │                            │
     │                            ├─ /api/fetch (CORS proxy)
     │                            └─ Steam Community
     │
     └─ Background Gallery ──────► JSON Database
```

## Deployment Options

### Option 1: Use Live Demo ⭐ Recommended
Just use: [https://bg-previewer-24llm7dzq-gvfirmezas-projects.vercel.app](https://bg-previewer-24llm7dzq-gvfirmezas-projects.vercel.app)

### Option 2: Deploy Your Own
```bash
# Clone and deploy to Vercel
git clone https://github.com/gvfirmeza/steam-profile-bg-previewer.git
cd steam-profile-bg-previewer
npm i -g vercel
vercel --prod
```

### Option 3: Local Development
```bash
# Full local server
npm install
npm start
# Open: http://localhost:3000
```

### Option 4: Static Hosting (GitHub Pages, etc.)
```bash
# Deploy static version (uses Vercel API as backend)
1. Fork this repository  
2. Move files from /public to root
3. Update API_BASE in app.js to your backend URL
4. Enable GitHub Pages or deploy to any static host
```

## Features

- ✅ **Real-time preview** with actual Steam profiles
- ✅ **Serverless backend** powered by Vercel Functions
- ✅ **500+ backgrounds** scraped from Steam store
- ✅ **CORS-safe** profile fetching via proxy
- ✅ **Mobile responsive** design
- ✅ **Dark theme** optimized for Steam aesthetic

## How to Use

1. **Enter Steam Profile URL**
   - Must be public: `https://steamcommunity.com/id/username/`
   - Or numeric: `https://steamcommunity.com/profiles/76561198.../`

2. **Choose Background**
   - Browse 500+ backgrounds from Steam store
   - Search by game title or background name
   - Click any background to preview instantly

3. **See the Magic**
   - Real Steam profile with your selected background
   - Reset anytime to remove background
   - Background applies with proper cover sizing

## Tech Stack

- **Frontend**: Vanilla JS, CSS Grid, Flexbox
- **Backend**: Vercel Serverless Functions (Node.js)
- **Data**: Steam Community API + Web Scraping
- **Deploy**: Vercel (Auto-deploy from Git)
- **CORS**: Custom proxy to bypass Steam restrictions

## API Endpoints

- `GET /api/fetch?url=<steam_profile_url>` - Fetch and sanitize Steam profile
- `GET /steam_backgrounds.json` - Background database

## File Structure

```
/
├── api/
│   └── fetch.js          # Serverless function for Steam profiles
├── public/               # Static frontend files
│   ├── index.html        
│   ├── app.js           
│   ├── styles.css       
│   └── steam_backgrounds.json
├── scripts/
│   └── scrapper.py      # Background scraper
├── server/              # Local dev server (optional)
├── vercel.json          # Vercel config
└── package.json         
```

## Update Backgrounds

To refresh the background database:

```bash
cd scripts
python scrapper.py
# Move generated JSON to public/
```

---

⚠️ **Disclaimer**: This tool only previews backgrounds. It does not modify your actual Steam profile.

🎮 **Made for Steam gamers who want to see before they buy!**
