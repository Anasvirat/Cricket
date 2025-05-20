const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

const app = express();

// Secret key
const SECRET = "0987654321";

// Original GitHub-hosted M3U8 file
const GITHUB_M3U8_URL = "https://Anasvirat.github.io/PHP/513.m3u8";

/**
 * /genarate → Redirect to a secure M3U8 URL with 1-minute expiry
 */
app.get("/genarate", (req, res) => {
  const path = "/secure.m3u8";
  const expires = Math.floor(Date.now() / 1000) + 60; // 1 minute expiry

  const token = crypto.createHmac("sha256", SECRET)
                      .update(path + expires)
                      .digest("hex");

  const secureUrl = `${req.protocol}://${req.get("host")}${path}?token=${token}&expires=${expires}`;

  // Redirect the browser to the secure stream URL
  res.redirect(secureUrl);
});

/**
 * /secure.m3u8 → Validates token and proxies M3U8 file if valid
 */
app.get("/secure.m3u8", async (req, res) => {
  const { token, expires } = req.query;
  const path = "/secure.m3u8";

  // Check for missing parameters
  if (!token || !expires) {
    return res.status(404).send("Not Found");
  }

  // Recreate the valid token using the same logic
  const validToken = crypto.createHmac("sha256", SECRET)
                           .update(path + expires)
                           .digest("hex");

  const now = Math.floor(Date.now() / 1000);

  // Validate token and expiry
  if (token !== validToken || now > parseInt(expires)) {
    return res.status(404).send("Token expired or invalid.");
  }

  // Proxy the M3U8 content from GitHub
  try {
    const response = await axios.get(GITHUB_M3U8_URL);
    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(response.data);
  } catch (err) {
    res.status(500).send("Failed to fetch stream.");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Token M3U8 server running on port ${PORT}`));
