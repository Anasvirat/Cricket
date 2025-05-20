const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

const app = express();

// Your secret key
const SECRET = "0987654321";

// The actual M3U8 URL hosted on GitHub
const GITHUB_M3U8_URL = "https://Anasvirat.github.io/PHP/513.m3u8";

/**
 * Route: /generate
 * Purpose: Generates a secure URL with token & expiry time
 */
app.get("/generate", (req, res) => {
  const path = "/secure.m3u8";
  const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry

  const token = crypto.createHmac("sha256", SECRET)
                      .update(path + expires)
                      .digest("hex");

  const url = `${req.protocol}://${req.get("host")}${path}?token=${token}&expires=${expires}`;
  res.send({ url });
});

/**
 * Route: /secure.m3u8
 * Purpose: Validates token and proxies the actual GitHub M3U8 file
 */
app.get("/secure.m3u8", async (req, res) => {
  const { token, expires } = req.query;
  const path = "/secure.m3u8";

  const validToken = crypto.createHmac("sha256", SECRET)
                           .update(path + expires)
                           .digest("hex");

  // Validate token and expiry time
  if (!token || !expires || token !== validToken || Date.now() > parseInt(expires) * 1000) {
    return res.status(403).send("Invalid or expired token.");
  }

  try {
    // Fetch M3U8 from GitHub
    const response = await axios.get(GITHUB_M3U8_URL);
    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Failed to fetch M3U8 file.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
