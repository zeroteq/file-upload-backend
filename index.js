const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors()); // Allow all origins

app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    try {
        const filename = req.file.originalname;
        const uploadUrl = `https://w.buzzheavier.com/a2cmbadjson1/${filename}`;

        const response = await axios.put(uploadUrl, req.file.buffer, {
            headers: {
                "Authorization": "Bearer GP8CWHRDD9NMD4IWVZRU",
                "Content-Type": "application/octet-stream",
                "Content-Length": req.file.size,
                "User-Agent": "Reqable/2.30.3"
            }
        });

        if (response.status === 200) {
            const { id } = response.data.data;
            const imageUrl = `https://buzzheavier.com/${id}/download`;

            // Fetch the final redirect URL
            const headResponse = await axios.head(imageUrl, {
                headers: {
                    "Hx-Request": "true",
                    "Hx-Current-Url": imageUrl,
                    "Referer": imageUrl
                }
            });

            const finalUrl = "https://buzzheavier.com" + headResponse.headers["hx-redirect"];
            return res.json({ success: true, imageUrl: finalUrl });
        } else {
            return res.status(500).json({ success: false, error: "Upload failed" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Vercel requires this
module.exports = app;
