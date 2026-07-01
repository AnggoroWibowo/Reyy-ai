import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import storageService from '../services/storageService';

const GROUP_ICONS = {
  Matematika: 'grid', Fisika: 'zap', Kimia: 'droplet', Biologia: 'activity',
  'B. Indonesia': 'edit-3', 'B. Inggris': 'globe', Sejarah: 'clock',
  Geografi: 'map', Ekonomi: 'dollar-sign', Informatika: 'cpu',
  Sosiologi: 'users', 'Seni Budaya': 'pen-tool',
};

const GROUP_COLORS = {
  Matematika: '#3B82F6', Fisika: '#10B981', Kimia: '#F59E0B',
  Biologi: '#F97316', 'B. Indonesia': '#8B5CF6', 'B. Inggris': '#9CA3AF',
  Sejarah: '#EF4444', Geografi: '#92400E', Ekonomi: '#EA580C',
  Informatika: '#1E40AF', Sosiologi: '#7C3AED', 'Seni Budaya': '#EC4899',
};

export default function Sidebar({ onClose, onSelectChat, onNewChat, onSelectGroup }) {
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('Umum');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const c = await storageService.getChats();
    const g = await storageService.getGroups();
    setChats(c || []);
    setGroups(g || []);
  };

  const filteredChats = chats.filter(c => {
    if (search) return c.title?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const pinnedChats = filteredChats.filter(c => c.pinned);
  const normalChats = filteredChats.filter(c => !c.pinned && !c.archived);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Feather name="cpu" size={28} color={COLORS.accent} />
        <Text style={styles.name}>Anggoro Wibowo</Text>
        <View style={styles.onlineDot} />
      </View>

      {/* NEW CHAT */}
      <TouchableOpacity style={styles.newChatBtn} onPress={onNewChat}>
        <Feather name="plus" size={18} color="#fff" />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>

      {/* SEARCH */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari chat..."
          placeholderTextColor={COLORS.textPlaceholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* GROUPS */}
        <Text style={styles.sectionTitle}>Grup</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
          {groups.map(g => (
            <TouchableOpacity
              key={g.name}
              style={[styles.groupItem, activeGroup === g.name && styles.groupActive]}
              onPress={() => { setActiveGroup(g.name); onSelectGroup?.(g.name); }}
            >
              <View style={[styles.groupIcon, { backgroundColor: (g.color || GROUP_COLORS[g.name] || '#3B82F6') + '20' }]}>
                <Feather name={g.icon || GROUP_ICONS[g.name] || 'folder'} size={18} color={g.color || GROUP_COLORS[g.name] || '#3B82F6'} />
              </View>
              <Text style={styles.groupName} numberOfLines={1}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* PINNED */}
        {pinnedChats.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Dipin</Text>
            {pinnedChats.map(c => (
              <TouchableOpacity key={c.id} style={styles.chatItem} onPress={() => onSelectChat?.(c)}>
                <Feather name="bookmark" size={16} color={COLORS.warning} />
                <View style={styles.chatInfo}>
                  <Text style={styles.chatTitle} numberOfLines={1}>{c.title}</Text>
                  <Text style={styles.chatMeta}>{c.group_name} · {new Date(c.updated_at).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ALL CHATS */}
        <Text style={styles.sectionTitle}>Semua Chat</Text>
        {normalChats.map(c => (
          <TouchableOpacity key={c.id} style={styles.chatItem} onPress={() => onSelectChat?.(c)}>
            <Feather name="message-square" size={16} color={COLORS.modelColors[c.model === 'gemini' ? 'research' : 'coding'] || COLORS.textSecondary} />
            <View style={styles.chatInfo}>
              <Text style={styles.chatTitle} numberOfLines={1}>{c.title}</Text>
              <Text style={styles.chatMeta}>{c.group_name} · {new Date(c.updated_at).toLocaleDateString()}</Text>
            </View>
            {c.label ? (
              <View style={[styles.label, { backgroundColor: c.label === 'work' ? '#3B82F6' : c.label === 'personal' ? '#8B5CF6' : '#10B981' }]}>
                <Text style={styles.labelText}>{c.label}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}

        {filteredChats.length === 0 && (
          <Text style={styles.emptyText}>Belum ada chat</Text>
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem}>
          <Feather name="settings" size={18} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem}>
          <Feather name="download" size={18} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem}>
          <Feather name="info" size={18} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>About</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, borderRightWidth: 1, borderRightColor: COLORS.border },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.text, flex: 1 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.accent, marginHorizontal: 16, marginVertical: 12, paddingVertical: 10, borderRadius: 8 },
  newChatText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 13, color: COLORS.text, marginLeft: 6 },
  scroll: { flex: 1, paddingHorizontal: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', marginTop: 16, marginBottom: 8, marginLeft: 4 },
  groupScroll: { marginBottom: 8 },
  groupItem: { alignItems: 'center', marginRight: 16, width: 56 },
  groupActive: { opacity: 1 },
  groupIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  groupName: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chatInfo: { flex: 1 },
  chatTitle: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  chatMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  label: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  labelText: { fontSize: 10, color: '#fff', fontWeight: '500' },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerItem: { alignItems: 'center', gap: 4 },
  footerText: { fontSize: 10, color: COLORS.textSecondary },
});