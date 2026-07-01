import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

const MENU_ITEMS = [
  { key: 'chat', icon: 'message-square', label: 'Chat', route: '/chat', color: COLORS.modelColors.research },
  { key: 'lks', icon: 'book-open', label: 'LKS Library', route: '/lks-library', color: '#F5A623' },
  { key: 'terminal', icon: 'terminal', label: 'Terminal', route: '/terminal', color: '#10B981' },
  { key: 'generate', icon: 'cpu', label: 'Generate', route: '/generate', color: COLORS.accent },
  { key: 'builder', icon: 'tool', label: 'Builder', route: '/builder', color: '#3B82F6' },
  { key: 'exam', icon: 'edit-3', label: 'Exam Mode', route: '/exam', color: '#EF4444' },
  { key: 'music', icon: 'music', label: 'Music', route: '/music', color: '#EC4899' },
  { key: 'settings', icon: 'settings', label: 'Settings', route: '/settings', color: COLORS.textSecondary },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <Feather name="zap" size={40} color={COLORS.accent} />
        <Text style={styles.title}>REYYY AI</Text>
        <Text style={styles.tagline}>Your AI, Your Rules</Text>
        <Text style={styles.user}>Anggoro Wibowo</Text>
      </View>

      <View style={styles.menu}>
        {MENU_ITEMS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            onPress={() => router.push(item.route)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Feather name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.menuText}>{item.label}</Text>
            <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

import { StatusBar } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  user: {
    fontSize: 11,
    color: COLORS.textPlaceholder,
    marginTop: 2,
  },
  menu: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
});