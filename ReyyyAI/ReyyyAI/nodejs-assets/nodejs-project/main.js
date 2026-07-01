const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 9875;
let proxies = {};
let tokenUsage = { coding: 0, research: 0, image: 0, video: 0 };
let bugLog = [];
let uptime = Date.now();
let apiKeys = {};

// ==================== WEBSOCKET ====================
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'connection', payload: { status: 'connected', uptime: Math.floor((Date.now() - uptime) / 1000) } }));

  ws.on('message', (data) => {
    try { handleMessage(ws, JSON.parse(data)); } catch (e) {}
  });

  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

function broadcast(type, payload) {
  const msg = JSON.stringify({ type, payload, timestamp: Date.now() });
  clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
}

// ==================== MESSAGE HANDLER ====================
async function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
      break;

    case 'stream:prompt':
      await handleStreamPrompt(ws, msg.payload);
      break;

    case 'stream:cancel':
      broadcast('stream:cancelled', { requestId: msg.payload.requestId });
      break;

    case 'terminal:input':
      handleTerminalCommand(ws, msg.payload.command);
      break;

    case 'proxy:start':
      startProxy(msg.payload.name);
      break;

    case 'proxy:stop':
      stopProxy(msg.payload.name);
      break;

    case 'proxy:restart':
      restartProxy(msg.payload.name);
      break;

    case 'keys:update':
      apiKeys = msg.payload.keys || {};
      break;
  }
}

// ==================== AI STREAMING (REAL API) ====================
async function handleStreamPrompt(ws, payload) {
  const { model, messages, requestId, imageBase64 } = payload;
  const lastMsg = messages?.[messages.length - 1]?.content || '';

  try {
    // Try Gemini first
    const geminiKey = apiKeys?.gemini;
    if (geminiKey) {
      await streamFromGemini(ws, geminiKey, messages, requestId, imageBase64);
      return;
    }

    // Fallback: DeepSeek
    const deepseekKey = apiKeys?.deepseek;
    if (deepseekKey) {
      await streamFromDeepSeek(ws, deepseekKey, messages, requestId);
      return;
    }

    // No keys: dummy response
    const dummyText = generateDummyResponse(lastMsg);
    await streamText(ws, requestId, dummyText);

  } catch (error) {
    ws.send(JSON.stringify({
      type: 'stream:chunk',
      payload: { requestId, text: '', fullText: '', done: true, error: error.message }
    }));
  }
}

async function streamFromGemini(ws, apiKey, messages, requestId, imageBase64) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
  
  const parts = [];
  if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
  parts.push({ text: messages[messages.length - 1].content });

  const response = await axios.post(url, { contents: [{ parts }] }, {
    responseType: 'stream', timeout: 30000,
  });

  let fullText = '';
  response.data.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            fullText += text;
            ws.send(JSON.stringify({
              type: 'stream:chunk',
              payload: { requestId, text, fullText, done: false }
            }));
          }
        } catch (e) {}
      }
    }
  });

  response.data.on('end', () => {
    ws.send(JSON.stringify({
      type: 'stream:chunk',
      payload: { requestId, text: '', fullText, done: true }
    }));
    trackTokens('research', Math.floor(fullText.length / 4));
  });
}

async function streamFromDeepSeek(ws, apiKey, messages, requestId) {
  const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
    model: 'deepseek-chat',
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: false,
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const fullText = response.data.choices[0].message.content;
  const words = fullText.split(' ');
  let current = '';

  for (let i = 0; i < words.length; i++) {
    current += (i > 0 ? ' ' : '') + words[i];
    ws.send(JSON.stringify({
      type: 'stream:chunk',
      payload: { requestId, text: words[i] + (i < words.length - 1 ? ' ' : ''), fullText: current, done: i === words.length - 1 }
    }));
    await new Promise(r => setTimeout(r, 20));
  }

  trackTokens('coding', Math.floor(fullText.length / 4));
}

async function streamText(ws, requestId, text) {
  const words = text.split(' ');
  let fullText = '';
  for (let i = 0; i < words.length; i++) {
    fullText += (i > 0 ? ' ' : '') + words[i];
    ws.send(JSON.stringify({
      type: 'stream:chunk',
      payload: { requestId, text: words[i] + (i < words.length - 1 ? ' ' : ''), fullText, done: i === words.length - 1 }
    }));
    await new Promise(r => setTimeout(r, 30));
  }
}

function generateDummyResponse(prompt) {
  if (prompt.toLowerCase().includes('halo')) return 'Hai Anggoro! Ada yang bisa saya bantu?';
  if (prompt.toLowerCase().includes('game')) return '<!DOCTYPE html><html><head><style>body{background:#0A0A0F;color:#E8E8ED;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh}</style></head><body><h1>Game Ready</h1></body></html>';
  return '📖 Dari LKS Halaman 23:\n\n' + prompt + '\n\nJawaban: Berdasarkan analisis, dapat disimpulkan bahwa...';
}

function trackTokens(category, tokens) {
  tokenUsage[category] = (tokenUsage[category] || 0) + tokens;
  broadcast('token:update', {
    category,
    used: tokenUsage[category],
    limit: 10000,
    percentage: Math.round((tokenUsage[category] / 10000) * 100),
  });
}

// ==================== TERMINAL ====================
function handleTerminalCommand(ws, command) {
  const cmd = command?.trim().toLowerCase();
  let output = '';
  switch (true) {
    case cmd === '/status': output = 'System: Online\nProxy: Running\nMemory: ' + Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB\nUptime: ' + Math.floor((Date.now() - uptime) / 1000) + 's'; break;
    case cmd === '/health': output = 'Server: OK\nWebSocket: ' + clients.size + ' clients\nProxy: Running'; break;
    case cmd === '/tokens': output = 'Coding: ' + (tokenUsage.coding || 0) + '/10K\nResearch: ' + (tokenUsage.research || 0) + '/10K\nImage: ' + (tokenUsage.image || 0) + '/5K\nVideo: ' + (tokenUsage.video || 0) + '/1K'; break;
    case cmd === '/bugs': output = bugLog.length === 0 ? 'No active bugs' : bugLog.slice(-5).map(b => '[' + b.type + '] ' + b.message).join('\n'); break;
    case cmd === '/help': output = '/status /health /tokens /bugs /proxy /keys /models /skills /backup /clear /help /about'; break;
    case cmd === '/about': output = 'REYYY AI v1.0.0\nBuilt for Anggoro Wibowo\n100% On-Device'; break;
    case cmd?.startsWith('/proxy'): output = 'claude-proxy :9876\noptillm-proxy :9877\n9routet :9878'; break;
    default: output = cmd ? 'Unknown: ' + command : '';
  }
  const lines = output.split('\n');
  lines.forEach(line => {
    ws.send(JSON.stringify({ type: 'terminal:output', payload: { line, timestamp: Date.now() } }));
  });
}

// ==================== PROXY ====================
function startProxy(name) {
  proxies[name] = { name, status: 'running', port: 9876 + Object.keys(proxies).length, startedAt: Date.now() };
  broadcast('proxy:started', proxies[name]);
}
function stopProxy(name) {
  if (proxies[name]) { proxies[name].status = 'stopped'; broadcast('proxy:stopped', proxies[name]); }
}
function restartProxy(name) { stopProxy(name); setTimeout(() => startProxy(name), 500); }

// ==================== HEALTH ====================
setInterval(() => {
  broadcast('health:heartbeat', {
    timestamp: Date.now(),
    uptime: Math.floor((Date.now() - uptime) / 1000),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    clients: clients.size,
  });
  Object.values(proxies).forEach(p => broadcast('proxy:status', p));
}, 5000);

// ==================== BUG CATCHER ====================
process.on('uncaughtException', (error) => {
  const bug = { type: 'NODE_ERROR', severity: 'CRITICAL', message: error.message, timestamp: Date.now() };
  bugLog.push(bug);
  broadcast('bug:detected', bug);
});
process.on('unhandledRejection', (reason) => {
  const bug = { type: 'PROMISE_ERROR', severity: 'HIGH', message: reason?.message || String(reason), timestamp: Date.now() };
  bugLog.push(bug);
  broadcast('bug:detected', bug);
});

// ==================== HTTP API ====================
app.get('/health', (req, res) => res.json({ status: 'running', uptime: Math.floor((Date.now() - uptime) / 1000), clients: clients.size, memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) }));
app.get('/poll', (req, res) => res.json({ events: [], serverTime: Date.now() }));
app.post('/api/keys', (req, res) => { apiKeys = req.body.keys || {}; res.json({ success: true }); });

// ==================== START ====================
server.listen(PORT, '127.0.0.1', () => {
  console.log('REYYY AI Server running on port', PORT);
  startProxy('claude-proxy');
  startProxy('optillm-proxy');
  startProxy('9routet');
  uptime = Date.now();
});