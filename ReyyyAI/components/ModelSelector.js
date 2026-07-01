import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MODELS = [
  { id: 'gemini', name: 'Gemini 2.0 Flash', provider: 'Google', icon: 'cpu', color: COLORS.modelColors.research, tier: 'A', shortcut: '1', category: 'research' },
  { id: 'deepseek', name: 'DeepSeek V3', provider: 'DeepSeek', icon: 'code', color: COLORS.modelColors.coding, tier: 'A', shortcut: '2', category: 'coding' },
  { id: 'claude', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: 'zap', color: '#F5A623', tier: 'S', shortcut: '3', category: 'coding' },
  { id: 'gpt4', name: 'GPT-4o', provider: 'OpenAI', icon: 'box', color: '#10B981', tier: 'S', shortcut: '4', category: 'coding' },
  { id: 'llama', name: 'Llama 3.1 405B', provider: 'Meta', icon: 'command', color: '#3B82F6', tier: 'B', shortcut: '5', category: 'coding' },
  { id: 'grok', name: 'Grok-2', provider: 'xAI', icon: 'sun', color: '#EF4444', tier: 'B', shortcut: '6', category: 'research' },
  { id: 'mistral', name: 'Mistral Large', provider: 'Mistral', icon: 'wind', color: '#9CA3AF', tier: 'C', shortcut: '7', category: 'coding' },
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'layers' },
  { id: 'coding', name: 'Coding', icon: 'code' },
  { id: 'research', name: 'Research', icon: 'book-open' },
  { id: 'image', name: 'Image', icon: 'image' },
  { id: 'video', name: 'Video', icon: 'film' },
];

const TIER_ICONS = { S: 'award', A: 'star', B: 'triangle', C: 'circle', D: 'square', E: 'minus' };
const TIER_COLORS = { S: COLORS.tierColors.S, A: COLORS.tierColors.A, B: COLORS.tierColors.B, C: COLORS.tierColors.C, D: COLORS.tierColors.D, E: COLORS.tierColors.E };

export default function ModelSelector({ visible, onClose, onSelect, activeModel }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const searchRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => searchRef.current?.focus(), 200);
    }
  }, [visible]);

  const filtered = MODELS.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'all' || m.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const renderModel = ({ item }) => (
    <TouchableOpacity
      style={[styles.modelItem, activeModel === item.id && styles.modelActive]}
      onPress={() => { onSelect?.(item); onClose?.(); }}
    >
      <View style={[styles.modelIcon, { backgroundColor: item.color + '20' }]}>
        <Feather name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.modelInfo}>
        <View style={styles.modelNameRow}>
          <Text style={styles.modelName}>{item.name}</Text>
          <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[item.tier] + '20' }]}>
            <Feather name={TIER_ICONS[item.tier]} size={10} color={TIER_COLORS[item.tier]} />
            <Text style={[styles.tierText, { color: TIER_COLORS[item.tier] }]}>{item.tier}</Text>
          </View>
        </View>
        <Text style={styles.modelProvider}>{item.provider}</Text>
      </View>
      <View style={styles.modelRight}>
        {activeModel === item.id && <Feather name="check-circle" size={18} color={COLORS.success} />}
        <Text style={styles.shortcut}>⌘{item.shortcut}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.panel} activeOpacity={1} onPress={() => {}}>
          {/* SEARCH */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Cari model..."
              placeholderTextColor={COLORS.textPlaceholder}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* CATEGORIES */}
          <View style={styles.categories}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catBtn, activeCategory === c.id && styles.catActive]}
                onPress={() => setActiveCategory(c.id)}
              >
                <Feather name={c.icon} size={13} color={activeCategory === c.id ? '#fff' : COLORS.textSecondary} />
                <Text style={[styles.catText, activeCategory === c.id && styles.catActiveText]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* LIST */}
          <FlatList
            data={filtered}
            renderItem={renderModel}
            keyExtractor={item => item.id}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Model tidak ditemukan</Text>
              </View>
            }
          />

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>↑↓ Navigasi · Enter Pilih · Esc Tutup</Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  panel: { width: Math.min(SCREEN_WIDTH - 40, 400), maxHeight: '80%', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  categories: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: COLORS.surfaceHover },
  catActive: { backgroundColor: COLORS.accent },
  catText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  catActiveText: { color: '#fff' },
  list: { maxHeight: 400 },
  modelItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modelActive: { backgroundColor: COLORS.surfaceHover, borderLeftWidth: 2, borderLeftColor: COLORS.accent },
  modelIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modelInfo: { flex: 1 },
  modelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modelName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  tierText: { fontSize: 9, fontWeight: '700' },
  modelProvider: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  modelRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shortcut: { fontSize: 11, color: COLORS.textPlaceholder, fontFamily: 'monospace' },
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textSecondary },
  footer: { paddingVertical: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border },
  footerText: { fontSize: 10, color: COLORS.textPlaceholder },
});