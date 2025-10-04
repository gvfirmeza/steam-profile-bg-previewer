# Steam BG Previewer

**Preview Steam profile backgrounds before purchasing them.**

## The Problem

Ever wanted to buy a Steam profile background but couldn't see how it would look on your actual profile? Steam doesn't provide a preview feature, so you're left guessing whether a background will complement your profile layout, badges, and content.

This tool solves that problem by letting you preview any Steam background on your real profile before making a purchase decision.

## Features

- **Live Profile Preview**: See backgrounds applied to your actual Steam profile
- **Extensive Gallery**: Browse hundreds of available Steam backgrounds
- **Smart Search**: Filter backgrounds by game title or background name  
- **Zoom Controls**: Adjust preview size (80%–150%) for better inspection
- **Memory**: Remembers your last profile URL and selected background
- **Safe & Secure**: No login required, read-only profile access
- **Responsive Design**: Works perfectly on desktop and mobile

## How It Works

1. **Enter your public Steam profile URL**
2. **Choose a background** from the gallery or paste a direct image URL
3. **Click Preview** to see how it looks on your actual profile
4. **Use zoom controls** to inspect details
5. **Visit the Steam store** to purchase backgrounds you like

## Live Demo

🌐 **[Try it now](https://steam-profile-bg-previewer.vercel.app)**

## Technical Details

Built with vanilla JavaScript and deployed on Vercel for global performance. The tool fetches your public Steam profile, sanitizes the content for security, and applies background previews client-side.

- **Frontend**: Vanilla JS, CSS3, HTML5
- **Backend**: Node.js serverless functions
- **Deployment**: Vercel Edge Network
- **Security**: HTML sanitization, CORS protection

## Privacy & Security

- No data collection or storage
- No Steam login required
- Only accesses public profile information
- All processing happens in your browser
- No tracking or analytics

## Contributing

Background data is maintained in `public/steam_backgrounds.json`. To update the gallery, run the scraper script and submit a pull request.

---

**Note**: This is a preview tool only. It does not modify your Steam profile in any way.
