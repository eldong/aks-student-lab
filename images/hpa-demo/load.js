const http = require("node:http");

const target = new URL(process.env.TARGET_URL || "http://cpu-demo:3000/work?duration=100");
const concurrency = Number.parseInt(process.env.CONCURRENCY || "8", 10);

function sendRequest() {
  return new Promise((resolve, reject) => {
    const request = http.get(target, {
      agent: false,
      headers: { Connection: "close" },
      timeout: 5000
    }, (response) => {
      response.resume();
      response.on("end", () => {
        if (response.statusCode >= 200 && response.statusCode < 300) resolve();
        else reject(new Error(`HTTP ${response.statusCode}`));
      });
    });

    request.on("timeout", () => request.destroy(new Error("Request timed out")));
    request.on("error", reject);
  });
}

async function worker(id) {
  while (true) {
    try {
      await sendRequest();
    } catch (error) {
      console.error(`Worker ${id}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

console.log(`Generating load against ${target.href} with concurrency ${concurrency}`);
for (let id = 1; id <= concurrency; id += 1) {
  worker(id);
}
