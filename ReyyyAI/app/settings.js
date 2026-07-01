import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import storageService from '../services/storageService';
import apiService from '../services/apiService';
import bugService from '../services/bugService';

export default function SettingsScreen() {
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState('');
  const [theme, setTheme] = useState('dark');
  const [autoFix, setAutoFix] = useState(true);
  const [tokenUsage, setTokenUsage] = useState({});

  useEffect(() => { loadKeys(); loadTokenUsage(); }, []);

  const loadKeys = async () => {
    const k = await storageService.getKeys();
    setKeys(Object.values(k));
  };

  const loadTokenUsage = async () => {
    const usage = await storageService.getTokenUsage?.() || {};
    setTokenUsage(usage);
  };

  const addKey = async () => {
    if (!newKey.trim()) return;
    try {
      const provider = apiService.detectProvider(newKey.trim());
      if (!provider) { Alert.alert('Error', 'Format API key tidak dikenal'); return; }
      await storageService.saveKey(newKey.trim(), provider);
      await apiService.addKey(newKey.trim());
      setNewKey('');
      await loadKeys();
      Alert.alert('Sukses', `Key ${provider.toUpperCase()} ditambahkan!`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const deleteKey = async (id) => {
    Alert.alert('Hapus Key', 'Yakin hapus API key ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await storageService.deleteKey(id);
        await loadKeys();
      }},
    ]);
  };

  const handleBackup = async () => {
    try {
      const path = await storageService.createBackup();
      Alert.alert('Sukses', `Backup tersimpan di:\n${path}`);
    } catch (e) {
      Alert.alert('Error', 'Gagal backup');
    }
  };

  const handleRestore = async () => {
    try {
      const path = await storageService.importBackupFile?.();
      if (!path) {
        // Fallback: restore from default
        await storageService.restoreBackup(`${FileSystem.documentDirectory}backup.json`);
      } else {
        await storageService.restoreBackup(path);
      }
      Alert.alert('Sukses', 'Data dipulihkan!');
    } catch (e) {
      Alert.alert('Error', 'Gagal restore');
    }
  };

  const accentColors = ['#6C63FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* APPEARANCE */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Accent Color</Text>
          <View style={styles.colorRow}>
            {accentColors.map(c => (
              <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, COLORS.accent === c && styles.colorActive]} onPress={() => Alert.alert('Info', 'Restart app untuk menerapkan perubahan')} />
            ))}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Theme</Text>
            <View style={styles.themeRow}>
              {['dark', 'light', 'auto'].map(t => (
                <TouchableOpacity key={t} style={[styles.themeBtn, theme === t && styles.themeActive]} onPress={() => setTheme(t)}>
                  <Text style={[styles.themeText, theme === t && styles.themeActiveText]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* API KEYS */}
        <Text style={styles.sectionTitle}>API Keys</Text>
        <View style={styles.section}>
          <View style={styles.addKeyRow}>
            <TextInput style={styles.keyInput} placeholder="Paste API key..." placeholderTextColor={COLORS.textPlaceholder} value={newKey} onChangeText={setNewKey} autoCapitalize="none" />
            <TouchableOpacity style={styles.addBtn} onPress={addKey}>
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {keys.map(k => (
            <View key={k.id} style={styles.keyItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.keyProvider}>{k.provider?.toUpperCase()}</Text>
                <Text style={styles.keyMasked}>{k.key?.substring(0, 8)}...{k.key?.substring(k.key.length - 4)}</Text>
              </View>
              <View style={[styles.keyStatus, { backgroundColor: k.active ? COLORS.success : COLORS.textPlaceholder }]} />
              <TouchableOpacity onPress={() => deleteKey(k.id)}>
                <Feather name="trash-2" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
          {keys.length === 0 && (
            <Text style={styles.emptyText}>Belum ada API key. Tambah key untuk mulai chat.</Text>
          )}
        </View>

        {/* TOKEN USAGE */}
        <Text style={styles.sectionTitle}>Token Usage</Text>
        <View style={styles.section}>
          {Object.entries(tokenUsage).length === 0 ? (
            <Text style={styles.emptyText}>Mulai chat untuk melihat penggunaan token</Text>
          ) : (
            Object.entries(tokenUsage).map(([cat, val]) => (
              <View key={cat} style={styles.tokenRow}>
                <Text style={styles.tokenLabel}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                <View style={styles.tokenBar}>
                  <View style={[styles.tokenFill, { width: `${Math.min((val.used || 0) / (val.limit || 10000) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.tokenText}>{val.used || 0}/{val.limit || 10000}</Text>
              </View>
            ))
          )}
        </View>

        {/* DATA */}
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleBackup}>
            <Feather name="download" size={20} color={COLORS.text} />
            <Text style={styles.rowText}>Backup Data</Text>
            <Feather name="chevron-right" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={handleRestore}>
            <Feather name="upload" size={20} color={COLORS.text} />
            <Text style={styles.rowText}>Restore Data</Text>
            <Feather name="chevron-right" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* SYSTEM */}
        <Text style={styles.sectionTitle}>System</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Feather name="shield" size={20} color={autoFix ? COLORS.success : COLORS.textSecondary} />
            <Text style={styles.rowText}>Auto-Fix Bug</Text>
            <Switch value={autoFix} onValueChange={(v) => { setAutoFix(v); bugService.toggleAutoFix(); }} trackColor={{ false: COLORS.surface, true: COLORS.accent }} />
          </View>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert('REYYY AI', 'v1.0.0\nBuilt for Anggoro Wibowo\n100% On-Device')}>
            <Feather name="info" size={20} color={COLORS.text} />
            <Text style={styles.rowText}>About</Text>
            <Text style={styles.rowValue}>v1.0.0</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  content: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  section: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 },
  label: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, marginTop: 12 },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorActive: { borderWidth: 3, borderColor: COLORS.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowText: { flex: 1, fontSize: 14, color: COLORS.text },
  rowValue: { fontSize: 13, color: COLORS.textSecondary },
  themeRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  themeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: COLORS.surfaceHover },
  themeActive: { backgroundColor: COLORS.accent },
  themeText: { fontSize: 13, color: COLORS.textSecondary },
  themeActiveText: { color: '#fff', fontWeight: '600' },
  addKeyRow: { flexDirection: 'row', gap: 8, paddingVertical: 12 },
  keyInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 6, padding: 10, justifyContent: 'center', alignItems: 'center' },
  keyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  keyProvider: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  keyMasked: { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'monospace', marginTop: 2 },
  keyStatus: { width: 8, height: 8, borderRadius: 4 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, paddingVertical: 16, textAlign: 'center' },
  tokenRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  tokenLabel: { fontSize: 12, color: COLORS.textSecondary, width: 80 },
  tokenBar: { flex: 1, height: 6, backgroundColor: COLORS.surfaceHover, borderRadius: 3, overflow: 'hidden' },
  tokenFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  tokenText: { fontSize: 11, color: COLORS.textSecondary, width: 70, textAlign: 'right' },
});