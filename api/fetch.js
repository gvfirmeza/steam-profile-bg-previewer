const sanitizeHtml = require('sanitize-html');

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
  transformTags: {
    'script': 'div',
    'iframe': 'div',
    'object': 'div',
    'embed': 'div',
    'form': 'div'
  }
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    let steamUrl;
    try {
      steamUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (steamUrl.hostname !== 'steamcommunity.com') {
      return res.status(400).json({ error: 'Only steamcommunity.com URLs are allowed' });
    }

    console.log('Fetching:', steamUrl.toString());

    const response = await fetch(steamUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
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

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile', 
      details: error.message 
    });
  }
}
