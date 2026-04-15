import { createServer } from "node:http";

const PORT = process.env.PORT || 3333;

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
};

const STATUS_COLOR = (code) => {
  if (code < 300) return COLORS.green;
  if (code < 400) return COLORS.yellow;
  return COLORS.red;
};

const METHOD_COLOR = {
  GET: COLORS.green,
  POST: COLORS.cyan,
  PUT: COLORS.yellow,
  PATCH: COLORS.magenta,
  DELETE: COLORS.red,
};

function timestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 23);
}

function formatHeaders(headers) {
  return Object.entries(headers)
    .map(([k, v]) => `  ${COLORS.dim}${k}:${COLORS.reset} ${v}`)
    .join("\n");
}

function formatBody(body) {
  if (!body) return "";
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

function logDivider(label) {
  const line = "─".repeat(60);
  console.log(`${COLORS.dim}┌${line}┐${COLORS.reset}`);
  console.log(
    `${COLORS.dim}│${COLORS.reset} ${COLORS.white}${label}${COLORS.reset}`,
  );
  console.log(`${COLORS.dim}└${line}┘${COLORS.reset}`);
}

const server = createServer((req, res) => {
  const startTime = performance.now();
  const chunks = [];

  req.on("data", (chunk) => chunks.push(chunk));

  req.on("end", () => {
    const requestBody = Buffer.concat(chunks).toString();
    const methodColor = METHOD_COLOR[req.method] || COLORS.white;
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // ── Log Request ──
    logDivider(
      `${COLORS.dim}${timestamp()}${COLORS.reset}  ${methodColor}${req.method}${COLORS.reset} ${url.pathname}${url.search}`,
    );

    console.log(`${COLORS.dim}  ▸ Request Headers${COLORS.reset}`);
    console.log(formatHeaders(req.headers));

    if (requestBody) {
      console.log(`${COLORS.dim}  ▸ Request Body${COLORS.reset}`);
      console.log(formatBody(requestBody));
    }

    // ── Build Response ──
    const responseBody = JSON.stringify({
      ok: true,
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: req.headers,
      body: requestBody ? tryParseJSON(requestBody) : undefined,
      timestamp: new Date().toISOString(),
    });

    const statusCode = 200;
    res.writeHead(statusCode, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    });
    res.end(responseBody);

    // ── Log Response ──
    const duration = (performance.now() - startTime).toFixed(2);
    const sc = STATUS_COLOR(statusCode);
    console.log(
      `${COLORS.dim}  ▸ Response${COLORS.reset}  ${sc}${statusCode}${COLORS.reset}  ${COLORS.dim}${duration}ms${COLORS.reset}`,
    );
    console.log(formatBody(responseBody));
    console.log();
  });
});

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

server.listen(PORT, () => {
  console.log();
  console.log(
    `${COLORS.cyan}  ⚡ HTTP Server listening on port ${PORT}${COLORS.reset}`,
  );
  console.log(`${COLORS.dim}  http://localhost:${PORT}${COLORS.reset}`);
  console.log();
});
