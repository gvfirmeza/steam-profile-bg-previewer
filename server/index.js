const express = require('express');
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Sanitization configuration
const sanitizeOptions = {
  allowedTags: [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'a', 'ul', 'ol', 'li', 'br', 'strong', 'em', 'b', 'i',
    'table', 'tr', 'td', 'th', 'tbody', 'thead', 'section', 'article',
    'header', 'main', 'nav', 'aside', 'footer', 'html', 'head', 'body',
    'title', 'meta', 'link', 'style'
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'style', 'data-*'],
    'img': ['src', 'alt', 'width', 'height'],
    'a': ['href'],
    'link': ['rel', 'href', 'type'],
    'meta': ['name', 'content', 'charset', 'property']
  },
  allowedSchemes: ['http', 'https', 'data'],
  disallowedTagsMode: 'discard',
  // Remove dangerous attributes
  transformTags: {
    'script': 'div', // Convert scripts to divs
    'iframe': 'div',
    'object': 'div',
    'embed': 'div',
    'form': 'div'
  }
};

// Proxy endpoint
app.get('/fetch', async (req, res) => {
  try {
    const { url } = req.query;
    
    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    let steamUrl;
    try {
      steamUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Whitelist only steamcommunity.com
    if (steamUrl.hostname !== 'steamcommunity.com') {
      return res.status(400).json({ error: 'Only steamcommunity.com URLs are allowed' });
    }

    console.log('Fetching:', steamUrl.toString());

    // Fetch the Steam profile
    const response = await fetch(steamUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000, // 10 second timeout
      size: 4 * 1024 * 1024 // 4MB limit
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Steam returned ${response.status}: ${response.statusText}` 
      });
    }

    let html = await response.text();
    
    // Remove dangerous elements and attributes
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    html = html.replace(/javascript:/gi, '');
    html = html.replace(/<meta\s+http-equiv\s*=\s*["']refresh["'][^>]*>/gi, '');
    
    // Sanitize HTML
    html = sanitizeHtml(html, sanitizeOptions);
    
    // Add base tag if not present
    if (!html.includes('<base')) {
      html = html.replace(
        /<head>/i, 
        '<head><base href="https://steamcommunity.com/">'
      );
    }

    // Remove problematic headers and return sanitized HTML
    res.removeHeader('x-frame-options');
    res.removeHeader('content-security-policy');
    res.removeHeader('x-content-type-options');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile', 
      details: error.message 
    });
  }
});

// Serve backgrounds JSON
app.get('/steam_backgrounds.json', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/steam_backgrounds.json'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
