const axios = require('axios');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!req.body || !req.body.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.body.file;
    const filename = file.name || `upload-${Date.now()}`;
    const uploadUrl = `https://w.buzzheavier.com/a2cmbadjson1/${filename}`;

    const headers = {
      'Authorization': 'Bearer GP8CWHRDD9NMD4IWVZRU',
      'Content-Type': 'application/octet-stream',
      'Content-Length': file.size,
      'User-Agent': 'Reqable/2.30.3'
    };

    // Step 1: Upload file
    const putResponse = await axios.put(uploadUrl, file, { headers });
    
    // Step 2: Get final URL
    const id = putResponse.data.data.id;
    const imageUrl = `https://buzzheavier.com/${id}/download`;

    const headResponse = await axios.head(imageUrl, {
      headers: {
        'Hx-Request': 'true',
        'Hx-Current-Url': imageUrl,
        'Referer': imageUrl
      }
    });

    const finalUrl = `https://buzzheavier.com${headResponse.headers['hx-redirect']}`;
    
    return res.json({ imageUrl: finalUrl });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: error.message,
      details: error.response?.data || 'No additional error details'
    });
  }
};
