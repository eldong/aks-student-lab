const http = require("node:http");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const requestTimeoutMs = 8000;

const weatherDescriptions = new Map([
  [0, "Clear sky"],
  [1, "Mainly clear"],
  [2, "Partly cloudy"],
  [3, "Overcast"],
  [45, "Foggy"],
  [48, "Icy fog"],
  [51, "Light drizzle"],
  [53, "Drizzle"],
  [55, "Heavy drizzle"],
  [56, "Light freezing drizzle"],
  [57, "Freezing drizzle"],
  [61, "Light rain"],
  [63, "Rain"],
  [65, "Heavy rain"],
  [66, "Light freezing rain"],
  [67, "Freezing rain"],
  [71, "Light snow"],
  [73, "Snow"],
  [75, "Heavy snow"],
  [77, "Snow grains"],
  [80, "Light rain showers"],
  [81, "Rain showers"],
  [82, "Heavy rain showers"],
  [85, "Light snow showers"],
  [86, "Heavy snow showers"],
  [95, "Thunderstorms"],
  [96, "Thunderstorms with light hail"],
  [99, "Thunderstorms with hail"]
]);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "aks-weather-demo/1.0" },
    signal: AbortSignal.timeout(requestTimeoutMs)
  });

  if (!response.ok) {
    const error = new Error(`Upstream service returned HTTP ${response.status}.`);
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
}

function compassDirection(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % directions.length];
}

function formatLocalDateTime(isoDateTime, timeZoneAbbreviation) {
  const [datePart, timePart] = isoDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return {
    date: new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(date),
    time: `${new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit"
    }).format(date)} ${timeZoneAbbreviation}`
  };
}

function buildForecast(daily, condition) {
  const high = Math.round(daily.temperature_2m_max[0]);
  const low = Math.round(daily.temperature_2m_min[0]);
  const rainChance = Math.round(daily.precipitation_probability_max[0] || 0);
  return `${condition} today, with a high near ${high}°F and a low near ${low}°F. Chance of precipitation: ${rainChance}%.`;
}

async function getWeather(zip) {
  const locationData = await fetchJson(`https://api.zippopotam.us/us/${zip}`);
  const place = locationData.places?.[0];
  if (!place) {
    const error = new Error("ZIP code not found.");
    error.statusCode = 404;
    throw error;
  }

  const latitude = Number.parseFloat(place.latitude);
  const longitude = Number.parseFloat(place.longitude);
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    forecast_days: "1"
  });
  const weatherData = await fetchJson(`https://api.open-meteo.com/v1/forecast?${query}`);
  const condition = weatherDescriptions.get(weatherData.current.weather_code) || "Current conditions unavailable";
  const localDateTime = formatLocalDateTime(
    weatherData.current.time,
    weatherData.timezone_abbreviation
  );

  return {
    zip,
    city: place["place name"],
    state: place["state abbreviation"],
    date: localDateTime.date,
    time: localDateTime.time,
    temperature: weatherData.current.temperature_2m,
    windSpeed: weatherData.current.wind_speed_10m,
    windDirection: compassDirection(weatherData.current.wind_direction_10m),
    condition,
    forecast: buildForecast(weatherData.daily, condition)
  };
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/healthz") {
    return sendJson(response, 200, { status: "healthy" });
  }

  if (request.method === "GET" && url.pathname === "/weather") {
    const zip = (url.searchParams.get("zip") || "").trim();
    if (!/^\d{5}$/.test(zip)) {
      return sendJson(response, 400, { error: "A valid five-digit U.S. ZIP code is required." });
    }

    try {
      return sendJson(response, 200, await getWeather(zip));
    } catch (error) {
      console.error("Weather request failed:", error);
      if (error.statusCode === 404) return sendJson(response, 404, { error: "ZIP code not found." });
      return sendJson(response, 502, { error: "Weather data is temporarily unavailable." });
    }
  }

  return sendJson(response, 404, { error: "Route not found." });
});

if (require.main === module) {
  server.listen(port, "0.0.0.0", () => {
    console.log(`Weather API listening on port ${port}`);
  });
}

module.exports = { buildForecast, compassDirection, formatLocalDateTime };
