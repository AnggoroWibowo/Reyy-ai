import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

const SKILL_CATEGORIES = [
  { name: 'Coding', icon: 'code', count: 3, color: COLORS.modelColors.coding },
  { name: 'Research', icon: 'book-open', count: 2, color: COLORS.modelColors.research },
  { name: 'Image', icon: 'image', count: 4, color: COLORS.modelColors.image },
  { name: 'Video', icon: 'film', count: 1, color: COLORS.modelColors.video },
  { name: 'Game', icon: 'play', count: 2, color: '#F5A623' },
  { name: 'Web', icon: 'globe', count: 3, color: '#3B82F6' },
];

export default function SkillBar({ onCategoryPress, onManagePress }) {
  const total = SKILL_CATEGORIES.reduce((sum, c) => sum + c.count, 0);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {SKILL_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.name}
            style={styles.item}
            onPress={() => onCategoryPress?.(cat)}
          >
            <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
              <Feather name={cat.icon} size={14} color={cat.color} />
            </View>
            <Text style={styles.count}>{cat.count}</Text>
            <Text style={styles.label}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.totalBadge}>
        <Feather name="package" size={12} color={COLORS.accent} />
        <Text style={styles.totalText}>{total} skills</Text>
      </View>
      <TouchableOpacity style={styles.manageBtn} onPress={onManagePress}>
        <Feather name="settings" size={14} color={COLORS.accent} />
        <Text style={styles.manageText}>Kelola</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#050508', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  scroll: { flexDirection: 'row', gap: 16, flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBox: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  count: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  label: { fontSize: 11, color: COLORS.textSecondary },
  totalBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: COLORS.accent + '15', marginRight: 8 },
  totalText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  manageText: { fontSize: 11, fontWeight: '500', color: COLORS.accent },
});