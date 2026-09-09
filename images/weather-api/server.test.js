const test = require("node:test");
const assert = require("node:assert/strict");
const { buildForecast, compassDirection } = require("./server");

test("converts degrees to compass directions", () => {
  assert.equal(compassDirection(0), "N");
  assert.equal(compassDirection(90), "E");
  assert.equal(compassDirection(225), "SW");
  assert.equal(compassDirection(359), "N");
});

test("builds a one-line daily forecast", () => {
  const forecast = buildForecast({
    temperature_2m_max: [78.2],
    temperature_2m_min: [55.4],
    precipitation_probability_max: [20]
  }, "Partly cloudy");

  assert.equal(
    forecast,
    "Partly cloudy today, with a high near 78°F and a low near 55°F. Chance of precipitation: 20%."
  );
});
