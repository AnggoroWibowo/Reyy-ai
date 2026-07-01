import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const WS_URL = 'ws://localhost:9875';
const POLL_URL = 'http://localhost:9875/poll';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

class WSClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempt = 0;
    this.isConnected = false;
    this.shouldReconnect = true;
  }

  connect() {
    this.shouldReconnect = true;
    this.reconnectAttempt = 0;
    this.tryConnect();
  }

  tryConnect() {
    if (!this.shouldReconnect) return;
    try {
      this.ws = new WebSocket(WS_URL);
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempt = 0;
        this.emit('connection', { status: 'connected' });
      };
      this.ws.onmessage = (e) => {
        try { const d = JSON.parse(e.data); this.emit(d.type, d.payload); } catch {}
      };
      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection', { status: 'disconnected' });
        this.scheduleReconnect();
      };
      this.ws.onerror = () => {};
    } catch { this.scheduleReconnect(); }
  }

  scheduleReconnect() {
    if (!this.shouldReconnect) return;
    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt++;
    setTimeout(() => this.tryConnect(), delay);
  }

  disconnect() { this.shouldReconnect = false; this.ws?.close(); }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(cb);
    return () => {
      const arr = this.listeners.get(event);
      if (arr) { const i = arr.indexOf(cb); if (i > -1) arr.splice(i, 1); }
    };
  }

  emit(event, data) {
    if (this.listeners.has(event)) this.listeners.get(event).forEach(cb => cb(data));
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    }
  }

  isConnectedNow() { return this.isConnected; }
}

const wsClient = new WSClient();
const WSContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [status, setStatus] = useState('disconnected');
  const [streamData, setStreamData] = useState({});
  const [tokenUsage, setTokenUsage] = useState({});
  const [proxyStatuses, setProxyStatuses] = useState({});
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [bugs, setBugs] = useState([]);

  useEffect(() => {
    wsClient.connect();
    const u1 = wsClient.on('connection', d => setStatus(d.status));
    const u2 = wsClient.on('stream:chunk', d => setStreamData(prev => ({ ...prev, [d.requestId]: { text: d.fullText, done: d.done, error: d.error } })));
    const u3 = wsClient.on('token:update', d => setTokenUsage(prev => ({ ...prev, [d.category]: d })));
    const u4 = wsClient.on('proxy:status', d => setProxyStatuses(prev => ({ ...prev, [d.name]: d })));
    const u5 = wsClient.on('proxy:started', d => setProxyStatuses(prev => ({ ...prev, [d.name]: { ...d, status: 'running' } })));
    const u6 = wsClient.on('proxy:stopped', d => setProxyStatuses(prev => ({ ...prev, [d.name]: { ...d, status: 'stopped' } })));
    const u7 = wsClient.on('terminal:output', d => setTerminalOutput(prev => [...prev, d]));
    const u8 = wsClient.on('bug:detected', d => setBugs(prev => [d, ...prev].slice(0, 50)));
    const sub = AppState.addEventListener('change', s => { if (s === 'active') wsClient.connect(); });

    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); sub?.remove(); };
  }, []);

  return (
    <WSContext.Provider value={{
      status, streamData, tokenUsage, proxyStatuses, terminalOutput, bugs,
      send: wsClient.send.bind(wsClient),
      on: wsClient.on.bind(wsClient),
      isConnected: wsClient.isConnectedNow.bind(wsClient),
    }}>
      {children}
    </WSContext.Provider>
  );
}

export function useWS() { return useContext(WSContext); }
export default wsClient;