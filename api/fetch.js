const sanitizeHtml = require('sanitize-html');

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
    'script': function() {
      // Remove completamente, não converte para div
      return false;
    },
    'iframe': 'div',
    'object': 'div',
    'embed': 'div',
    'form': 'div'
  }
};

export default async function handler(req, res) {
  // Só aceita GET
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

    const response = await fetch(steamUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Steam returned ${response.status}`);
    }

    const html = await response.text();
    
    // Remove scripts ANTES do sanitizador para evitar que virem texto
    const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    const sanitizedHtml = sanitizeHtml(cleanHtml, sanitizeOptions);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(sanitizedHtml);

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch profile', 
      details: error.message 
    });
  }
}