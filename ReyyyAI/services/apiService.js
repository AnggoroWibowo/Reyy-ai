import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

class ApiService {
  constructor() {
    this.keys = {};
    this.activeModel = 'gemini';
    this.cache = new Map();
  }

  async loadKeys() {
    try {
      const stored = await SecureStore.getItemAsync('reyyy_keys');
      this.keys = stored ? JSON.parse(stored) : {};
      return this.keys;
    } catch (error) {
      return {};
    }
  }

  async addKey(key) {
    await this.loadKeys();
    const provider = this.detectProvider(key);
    if (!provider) throw new Error('Unknown API key format');
    const id = `${provider}_${Date.now()}`;
    this.keys[id] = { id, key, provider, active: true, addedAt: Date.now() };
    await SecureStore.setItemAsync('reyyy_keys', JSON.stringify(this.keys));
    return { id, provider };
  }

  detectProvider(key) {
    if (key.startsWith('AIza')) return 'gemini';
    if (key.startsWith('dsk-')) return 'deepseek';
    if (key.startsWith('sk-ant-')) return 'claude';
    if (key.startsWith('nvapi-')) return 'nvidia';
    if (key.startsWith('gsk_')) return 'groq';
    if (key.startsWith('xai-')) return 'grok';
    if (key.startsWith('sk-')) return 'openai';
    return null;
  }

  getActiveKey(provider) {
    return Object.values(this.keys).find(k => k.provider === provider && k.active);
  }

  async chatWithGemini(messages, imageBase64 = null) {
    const keyObj = this.getActiveKey('gemini');
    if (!keyObj) throw new Error('No Gemini API key found');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keyObj.key}`;
    const parts = [];
    if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
    parts.push({ text: messages[messages.length - 1].content });
    const response = await axios.post(url, { contents: [{ parts }] }, { timeout: 30000 });
    return { success: true, text: response.data.candidates[0].content.parts[0].text };
  }

  async chatWithGeminiStream(messages, onChunk, imageBase64 = null) {
    const keyObj = this.getActiveKey('gemini');
    if (!keyObj) throw new Error('No Gemini API key found');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${keyObj.key}`;
    const parts = [];
    if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
    parts.push({ text: messages[messages.length - 1].content });
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }),
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) { fullText += text; onChunk({ text, fullText, done: false }); }
          } catch (e) {}
        }
      }
    }
    onChunk({ text: '', fullText, done: true });
    return { success: true, text: fullText };
  }

  async analyzeImage(imageBase64, question) {
    const keyObj = this.getActiveKey('gemini');
    if (!keyObj) throw new Error('No Gemini API key found');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keyObj.key}`;
    const parts = [
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
      { text: question || 'Apa isi gambar ini? Baca semua teks yang ada.' }
    ];
    const response = await axios.post(url, { contents: [{ parts }] }, { timeout: 30000 });
    return { success: true, text: response.data.candidates[0].content.parts[0].text };
  }

  async chatWithDeepSeek(messages) {
    const keyObj = this.getActiveKey('deepseek');
    if (!keyObj) throw new Error('No DeepSeek API key found');
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }, {
      headers: { 'Authorization': `Bearer ${keyObj.key}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    return { success: true, text: response.data.choices[0].message.content };
  }

  async smartChat(messages, onChunk = null, imageBase64 = null) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const geminiKey = this.getActiveKey('gemini');
    if (geminiKey) {
      try {
        if (onChunk) return await this.chatWithGeminiStream(messages, onChunk, imageBase64);
        return await this.chatWithGemini(messages, imageBase64);
      } catch (e) {}
    }
    const deepseekKey = this.getActiveKey('deepseek');
    if (deepseekKey) {
      const result = await this.chatWithDeepSeek(messages);
      if (onChunk) onChunk({ text: result.text, fullText: result.text, done: true });
      return result;
    }
    throw new Error('No AI provider available. Please add API key in Settings.');
  }
}

export default new ApiService();