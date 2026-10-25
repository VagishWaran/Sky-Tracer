
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve the website from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Flight data API for Malaysia and nearby airspace
app.get("/api/flights", async (req, res) => {
  try {
    console.log("Requesting flight data from OpenSky...");

    const params = new URLSearchParams({
      lamin: "0.5",
      lomin: "99",
      lamax: "7.5",
      lomax: "120"
    });

    const url =
      "https://opensky-network.org/api/states/all?" +
      params.toString();

    const response = await fetch(url);

    if (!response.ok) {
      console.log("OpenSky status:", response.status);

      return res.status(response.status).json({
        error: "OpenSky API request failed",
        status: response.status,
        explanation:
          "Check OpenSky access, authentication, or rate limits."
      });
    }

    const data = await response.json();

    const flights = (data.states || [])
      .filter(plane => plane[5] != null && plane[6] != null)
      .map(plane => ({
        icao24: plane[0],
        callsign: (plane[1] || "").trim() || "Unknown",
        country: plane[2] || "Unknown",
        longitude: plane[5],
        latitude: plane[6],
        altitude: plane[7],
        onGround: plane[8],
        velocity: plane[9],
        heading: plane[10]
      }));

    console.log("Aircraft found:", flights.length);

    res.json({
      count: flights.length,
      updatedAt: new Date().toISOString(),
      flights
    });

  } catch (error) {
    console.error("Flight API error:", error.message);

    res.status(500).json({
      error: "Unable to retrieve flight data",
      details: error.message
    });
  }
});

// Start the web server
app.listen(PORT, () => {
  console.log(`Malaysia Flight Monitor: http://localhost:${PORT}`);
});
