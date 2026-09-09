const http = require("node:http");

const port = Number.parseInt(process.env.PORT || "3000", 10);

function burnCpu(milliseconds) {
  const end = Date.now() + milliseconds;
  let value = 0;
  while (Date.now() < end) {
    value += Math.sqrt(Math.random() * 100000);
  }
  return value;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (url.pathname === "/healthz") {
    return sendJson(response, 200, { status: "healthy" });
  }

  if (url.pathname === "/work") {
    const requestedDuration = Number.parseInt(url.searchParams.get("duration") || "100", 10);
    const duration = Math.min(Math.max(requestedDuration, 10), 1000);
    const result = burnCpu(duration);
    return sendJson(response, 200, {
      pod: process.env.HOSTNAME || "unknown",
      durationMs: duration,
      result: Math.round(result)
    });
  }

  return sendJson(response, 200, {
    service: "AKS HPA CPU demo",
    pod: process.env.HOSTNAME || "unknown",
    usage: "/work?duration=100"
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`HPA demo server listening on port ${port}`);
});
