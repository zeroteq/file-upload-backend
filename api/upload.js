const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create an express serverless function
const app = express();

// Add CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Handle file upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    // Upload to BuzzHeavier
    const uploadUrl = `https://w.buzzheavier.com/a2cmbadjson1/${fileName}`;
    
    const uploadResponse = await axios({
      method: 'put',
      url: uploadUrl,
      data: fileBuffer,
      headers: {
        'Authorization': 'Bearer GP8CWHRDD9NMD4IWVZRU',
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length,
        'User-Agent': 'Reqable/2.30.3'
      }
    });

    if (uploadResponse.status !== 200) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }

    // Get the ID from the response
    const id = uploadResponse.data.data.id;
    const downloadUrl = `https://buzzheavier.com/${id}/download`;

    // Make HEAD request to get redirect URL
    const headResponse = await axios({
      method: 'head',
      url: downloadUrl,
      headers: {
        'Hx-Request': 'true',
        'Hx-Current-Url': downloadUrl,
        'Referer': downloadUrl
      },
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept 3xx redirects
      }
    });

    // Get the Hx-Redirect header
    const hxRedirect = headResponse.headers['hx-redirect'];
    
    if (!hxRedirect) {
      return res.json({ 
        success: true, 
        url: downloadUrl,
        message: 'Upload successful but no redirect header found'
      });
    }

    const finalUrl = `https://buzzheavier.com${hxRedirect}`;
    
    // Return the final URL to the client
    return res.json({ 
      success: true, 
      url: finalUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: `Upload failed: ${error.message || 'Unknown error'}` 
    });
  }
});

// Export the Express API
module.exports = app;
