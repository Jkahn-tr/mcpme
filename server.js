#!/usr/bin/env node
/**
 * Justin Kahn Personal Context Portfolio — MCP Server
 * 
 * Exposes all 10 portfolio files as MCP resources.
 * Supports both stdio (local) and SSE (remote) transport.
 * 
 * Usage:
 *   Local:  node server.js
 *   Remote: PORT=3100 node server.js --sse
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const http = require('http');

const PORTFOLIO_DIR = path.join(__dirname, 'portfolio');

// Bearer token auth for remote transport
// Set MCP_TOKEN env var to enable; if unset, auth is disabled (local stdio use)
const MCP_TOKEN = process.env.MCP_TOKEN || null;

const RESOURCES = [
  { name: 'identity',                  file: 'identity.md',                    description: 'Who Justin is — name, role, organization, one-page summary' },
  { name: 'roles-and-responsibilities', file: 'roles-and-responsibilities.md',  description: 'What his job actually involves day to day' },
  { name: 'current-projects',          file: 'current-projects.md',            description: 'Active workstreams, status, priority, what done looks like' },
  { name: 'team-and-relationships',    file: 'team-and-relationships.md',       description: 'Key people, how they interact, what they need from each other' },
  { name: 'tools-and-systems',         file: 'tools-and-systems.md',           description: 'The stack — what tools are used, how configured, what connects to what' },
  { name: 'communication-style',       file: 'communication-style.md',         description: 'How Justin writes and wants things written for him' },
  { name: 'goals-and-priorities',      file: 'goals-and-priorities.md',        description: 'Big-picture goals and what is deliberately being ignored' },
  { name: 'preferences-and-constraints', file: 'preferences-and-constraints.md', description: 'Hard rules, strong opinions, always/never guidelines' },
  { name: 'domain-knowledge',          file: 'domain-knowledge.md',            description: 'What Justin knows that a general-purpose AI does not' },
  { name: 'decision-log',              file: 'decision-log.md',                description: 'Past decisions with rationale, and how Justin makes decisions' },
];

function readPortfolioFile(filename) {
  const filepath = path.join(PORTFOLIO_DIR, filename);
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (e) {
    return `Error reading ${filename}: ${e.message}`;
  }
}

// ─── MCP Protocol Helpers ───────────────────────────────────────────────────

function mcpResponse(id, result) {
  return JSON.stringify({ jsonrpc: '2.0', id, result });
}

function mcpError(id, code, message) {
  return JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
}

function handleRequest(raw) {
  let req;
  try {
    req = JSON.parse(raw);
  } catch {
    return mcpError(null, -32700, 'Parse error');
  }

  const { id, method, params } = req;

  // Initialize
  if (method === 'initialize') {
    return mcpResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { resources: { listChanged: false } },
      serverInfo: { name: 'justin-context-portfolio', version: '1.0.0' },
    });
  }

  // Notifications (no response needed)
  if (method === 'notifications/initialized') return null;

  // List resources
  if (method === 'resources/list') {
    const resources = RESOURCES.map(r => ({
      uri: `context://${r.name}`,
      name: r.name,
      description: r.description,
      mimeType: 'text/markdown',
    }));
    return mcpResponse(id, { resources });
  }

  // Read a resource
  if (method === 'resources/read') {
    const uri = params?.uri;
    const resource = RESOURCES.find(r => `context://${r.name}` === uri);
    if (!resource) {
      return mcpError(id, -32602, `Unknown resource: ${uri}`);
    }
    const content = readPortfolioFile(resource.file);
    return mcpResponse(id, {
      contents: [{
        uri,
        mimeType: 'text/markdown',
        text: content,
      }],
    });
  }

  // Ping
  if (method === 'ping') return mcpResponse(id, {});

  return mcpError(id, -32601, `Method not found: ${method}`);
}

// ─── Transport: stdio (local) ────────────────────────────────────────────────

function runStdio() {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const response = handleRequest(trimmed);
    if (response !== null) {
      process.stdout.write(response + '\n');
    }
  });

  rl.on('close', () => process.exit(0));

  process.stderr.write('[context-server] stdio transport ready\n');
}

// ─── Transport: HTTP + SSE (remote) ─────────────────────────────────────────

function runSSE() {
  const PORT = parseInt(process.env.PORT || '3100', 10);

  const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Auth check (skip for health + root)
    if (MCP_TOKEN && req.url !== '/health' && req.url !== '/') {
      const authHeader = req.headers['authorization'] || '';
      const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (provided !== MCP_TOKEN) {
        res.writeHead(401, { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer' });
        res.end(JSON.stringify({ error: 'Unauthorized', message: 'Valid Bearer token required' }));
        return;
      }
    }

    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', resources: RESOURCES.length }));
      return;
    }

    // MCP over HTTP (simple POST)
    if (req.method === 'POST' && req.url === '/mcp') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const response = handleRequest(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(response || '{}');
      });
      return;
    }

    // SSE endpoint for MCP clients that expect SSE
    if (req.method === 'GET' && req.url === '/sse') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Send the resource list on connect
      const listResult = JSON.parse(handleRequest(JSON.stringify({
        jsonrpc: '2.0', id: 0, method: 'resources/list'
      })));
      res.write(`data: ${JSON.stringify(listResult)}\n\n`);

      req.on('close', () => res.end());
      return;
    }

    // README
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html>
<head><title>Justin Kahn — Context Portfolio MCP Server</title>
<style>body{font-family:system-ui;max-width:700px;margin:60px auto;padding:0 24px;background:#0a0908;color:#e8ddd0;}
h1{color:#d4651a;}a{color:#d4651a;}code{background:#1a1814;padding:2px 8px;border-radius:4px;}</style></head>
<body>
<h1>Justin Kahn · Personal Context Portfolio</h1>
<p>MCP server exposing ${RESOURCES.length} context files as machine-readable resources.</p>
<h2>Endpoints</h2>
<ul>
  <li><code>POST /mcp</code> — JSON-RPC MCP endpoint</li>
  <li><code>GET /sse</code> — SSE stream</li>
  <li><code>GET /health</code> — health check</li>
</ul>
<h2>Resources</h2>
<ul>${RESOURCES.map(r => `<li><strong>context://${r.name}</strong> — ${r.description}</li>`).join('')}</ul>
</body></html>`);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(PORT, () => {
    process.stderr.write(`[context-server] SSE transport listening on http://localhost:${PORT}\n`);
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const mode = process.argv.includes('--sse') ? 'sse' : 'stdio';
if (mode === 'sse') {
  runSSE();
} else {
  runStdio();
}
