import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

const DB_NAME = 'reyyy.db';
const PHOTO_DIR = `${FileSystem.documentDirectory}photos/`;

class StorageService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return;
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS chats (id TEXT PRIMARY KEY, group_name TEXT DEFAULT 'Umum', title TEXT, model TEXT DEFAULT 'gemini', created_at INTEGER, updated_at INTEGER, pinned INTEGER DEFAULT 0, label TEXT DEFAULT '', archived INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, chat_id TEXT, role TEXT, content TEXT, tokens INTEGER DEFAULT 0, timestamp INTEGER, bookmarked INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, group_name TEXT DEFAULT 'Umum', file_path TEXT, page_number INTEGER, chapter TEXT, ocr_text TEXT, favorite INTEGER DEFAULT 0, created_at INTEGER);
      CREATE TABLE IF NOT EXISTS groups_config (name TEXT PRIMARY KEY, color TEXT DEFAULT '#3B82F6', icon TEXT DEFAULT 'folder', created_at INTEGER);
      CREATE TABLE IF NOT EXISTS token_usage (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT, tokens_used INTEGER, timestamp INTEGER);
      CREATE TABLE IF NOT EXISTS bug_log (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, severity TEXT, message TEXT, timestamp INTEGER);
    `);
  }

  async saveKey(key, provider) {
    const keys = await this.getKeys();
    const id = `${provider}_${Date.now()}`;
    keys[id] = { id, key, provider, active: true, addedAt: Date.now() };
    await SecureStore.setItemAsync('reyyy_keys', JSON.stringify(keys));
    return { id, provider };
  }

  async getKeys() {
    try { const s = await SecureStore.getItemAsync('reyyy_keys'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  }

  async deleteKey(id) {
    const keys = await this.getKeys(); delete keys[id];
    await SecureStore.setItemAsync('reyyy_keys', JSON.stringify(keys)); return true;
  }

  async createChat(groupName = 'Umum', model = 'gemini') {
    await this.init();
    const id = `chat_${Date.now()}`, now = Date.now();
    await this.db.runAsync('INSERT INTO chats (id, group_name, title, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [id, groupName, 'New Chat', model, now, now]);
    return { id, groupName, title: 'New Chat', model };
  }

  async getChats(groupName = null) {
    await this.init();
    let q = 'SELECT * FROM chats WHERE archived = 0';
    if (groupName) q += ' AND group_name = ?';
    q += ' ORDER BY pinned DESC, updated_at DESC';
    return groupName ? this.db.getAllAsync(q, [groupName]) : this.db.getAllAsync(q);
  }

  async saveMessage(chatId, role, content) {
    await this.init();
    const id = `msg_${Date.now()}`, now = Date.now();
    await this.db.runAsync('INSERT INTO messages (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)', [id, chatId, role, content, now]);
    await this.db.runAsync('UPDATE chats SET updated_at = ? WHERE id = ?', [now, chatId]);
    return { id, chatId, role, content };
  }

  async getMessages(chatId) {
    await this.init();
    return this.db.getAllAsync('SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC', [chatId]);
  }

  async savePhoto(groupName, uri, pageNumber = null) {
    await this.init();
    const id = `photo_${Date.now()}`, fileName = `${id}.jpg`, filePath = `${PHOTO_DIR}${fileName}`;
    await FileSystem.copyAsync({ from: uri, to: filePath });
    await this.db.runAsync('INSERT INTO photos (id, group_name, file_path, page_number, created_at) VALUES (?, ?, ?, ?, ?)', [id, groupName, filePath, pageNumber, Date.now()]);
    return { id, groupName, filePath };
  }

  async getPhotos(groupName = null) {
    await this.init();
    if (groupName) return this.db.getAllAsync('SELECT * FROM photos WHERE group_name = ? ORDER BY created_at DESC', [groupName]);
    return this.db.getAllAsync('SELECT * FROM photos ORDER BY created_at DESC');
  }

  async deletePhoto(photoId) {
    await this.init();
    const p = await this.db.getFirstAsync('SELECT file_path FROM photos WHERE id = ?', [photoId]);
    if (p?.file_path) await FileSystem.deleteAsync(p.file_path, { idempotent: true });
    await this.db.runAsync('DELETE FROM photos WHERE id = ?', [photoId]);
    return true;
  }

  async createGroup(name, color = '#3B82F6', icon = 'folder') {
    await this.init();
    await this.db.runAsync('INSERT OR REPLACE INTO groups_config (name, color, icon, created_at) VALUES (?, ?, ?, ?)', [name, color, icon, Date.now()]);
    return { name, color, icon };
  }

  async getGroups() {
    await this.init();
    return this.db.getAllAsync('SELECT * FROM groups_config ORDER BY name ASC');
  }

  async deleteGroup(name) {
    await this.init();
    await this.db.runAsync('DELETE FROM groups_config WHERE name = ?', [name]);
    return true;
  }

  async createBackup() {
    await this.init();
    const chats = await this.db.getAllAsync('SELECT * FROM chats');
    const messages = await this.db.getAllAsync('SELECT * FROM messages');
    const backup = { version: '1.0.0', createdAt: new Date().toISOString(), chats, messages };
    const path = `${FileSystem.documentDirectory}backup.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(backup));
    return path;
  }

  async restoreBackup(filePath) {
    await this.init();
    const content = await FileSystem.readAsStringAsync(filePath);
    const backup = JSON.parse(content);
    await this.db.execAsync('DELETE FROM messages; DELETE FROM chats;');
    for (const c of backup.chats || []) await this.db.runAsync('INSERT INTO chats (id, group_name, title, model, created_at, updated_at, pinned, label, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [c.id, c.group_name, c.title, c.model, c.created_at, c.updated_at, c.pinned, c.label, c.archived]);
    for (const m of backup.messages || []) await this.db.runAsync('INSERT INTO messages (id, chat_id, role, content, tokens, timestamp, bookmarked) VALUES (?, ?, ?, ?, ?, ?, ?)', [m.id, m.chat_id, m.role, m.content, m.tokens, m.timestamp, m.bookmarked]);
    return true;
  }

  async logBug(type, severity, message) {
    await this.init();
    await this.db.runAsync('INSERT INTO bug_log (type, severity, message, timestamp) VALUES (?, ?, ?, ?)', [type, severity, message, Date.now()]);
  }
}

export default new StorageService();