const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

const app = express();

// Your secret key
const SECRET = "0987654321";

// Public M3U8 hosted on GitHub
const GITHUB_M3U8_URL = "http://tigerott.com:8080/live/0583333/111111/75299.ts";

/**
 * Route: /genarate.m3u8
 * Purpose: Redirects to /secure.m3u8 with valid 1-minute token
 */
app.get("/genarate.m3u8", (req, res) => {
  const path = "/secure.m3u8";
  const expires = Math.floor(Date.now() / 1000) + 60; // expires in 60 seconds

  const token = crypto.createHmac("sha256", SECRET)
                      .update(path + expires)
                      .digest("hex");

  const secureUrl = `${req.protocol}://${req.get("host")}${path}?token=${token}&expires=${expires}`;

  // Redirect the client to the token-secured URL
  res.redirect(secureUrl);
});

/**
 * Route: /secure.m3u8
 * Purpose: Validates token and proxies the M3U8 if valid
 */
app.get("/secure.m3u8", async (req, res) => {
  const { token, expires } = req.query;
  const path = "/secure.m3u8";

  // Check if token or expires is missing
  if (!token || !expires) {
    return res.status(404).send("Not Found");
  }

  const now = Math.floor(Date.now() / 1000);
  const validToken = crypto.createHmac("sha256", SECRET)
                           .update(path + expires)
                           .digest("hex");

  // Token mismatch or expired
  if (token !== validToken || now > parseInt(expires)) {
    return res.status(404).send("Token expired or invalid.");
  }

  try {
    const response = await axios.get(GITHUB_M3U8_URL);
    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Failed to fetch M3U8.");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`M3U8 Token Server running on port ${PORT}`));
