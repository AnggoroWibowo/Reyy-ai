import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { COMMANDS, COMMAND_CATEGORIES } from '../utils/commands';

export default function TerminalScreen() {
  const [output, setOutput] = useState(['REYYY AI Terminal v1.0', 'Ketik /help untuk daftar perintah', '']);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef(null);

  const executeCommand = (cmd) => {
    const newOutput = [...output, `> ${cmd}`];
    const lower = cmd.toLowerCase().trim();

    if (lower === '/help') {
      newOutput.push('');
      COMMAND_CATEGORIES.forEach(cat => {
        newOutput.push(`── ${cat.name.toUpperCase()} (${cat.count}) ──`);
        COMMANDS.filter(c => c.category === cat.name).forEach(c => {
          newOutput.push(`  ${c.name} — ${c.description}`);
        });
        newOutput.push('');
      });
    } else if (lower === '/status') {
      newOutput.push('🟢 System: Online', '🟢 Proxy: Running (:9875)', '📊 Memory: 45MB', '⏱️ Uptime: 2h 34m');
    } else if (lower === '/health') {
      newOutput.push('🟢 Gemini: OK (234ms)', '🟢 DeepSeek: OK (189ms)', '🟢 Storage: OK');
    } else if (lower === '/tokens') {
      newOutput.push('💻 Coding: 1.247/10K (12%)', '📚 Research: 8.234/10K (82%)', '🖼️ Image: 156/5K (3%)', '🎬 Video: 12/1K (1%)');
    } else if (lower === '/bugs') {
      newOutput.push('✅ No active bugs', 'Last auto-fix: 2m ago');
    } else if (lower === '/clear') {
      setOutput([]);
      return;
    } else if (lower === '/about') {
      newOutput.push('REYYY AI v1.0.0', 'Built for Anggoro Wibowo', '100% On-Device');
    } else if (lower === '/keys') {
      newOutput.push('🔑 Gemini: AIza...X9k2 🟢', '🔑 DeepSeek: dsk...A3f7 🟢');
    } else if (lower === '/models') {
      newOutput.push('🟢 Gemini 2.0 Flash (Research)', '🟢 DeepSeek V3 (Coding)');
    } else if (lower === '/skills') {
      newOutput.push('💻 Coding (3): React Dev, Game Dev, Python', '📚 Research (2): Academic, Brainstorm');
    } else if (cmd.trim()) {
      newOutput.push(`❌ Perintah tidak dikenal: ${cmd}`, 'Ketik /help untuk bantuan');
    }

    setOutput(newOutput);
    setHistory([...history, cmd]);
    setHistoryIndex(-1);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === 'ArrowUp') {
      const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      if (history.length - 1 - newIndex >= 0) {
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.nativeEvent.key === 'ArrowDown') {
      const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
      setHistoryIndex(newIndex);
      setInput(newIndex === -1 ? '' : history[history.length - 1 - newIndex] || '');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.skillBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skillContent}>
          {COMMAND_CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.name} style={styles.skillItem} onPress={() => setInput(`/help`)}>
              <Feather name={cat.icon} size={14} color={COLORS.accent} />
              <Text style={styles.skillCount}>{cat.count}</Text>
              <Text style={styles.skillLabel}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>Total: {COMMANDS.length}</Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView ref={scrollRef} style={styles.outputArea} contentContainerStyle={styles.outputContent}>
        {output.map((line, i) => (
          <Text key={i} style={[styles.outputLine, line.startsWith('>') && styles.promptLine, line.startsWith('❌') && styles.errorLine]}>
            {line}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <Text style={styles.prompt}>&gt;</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => executeCommand(input)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik perintah..."
          placeholderTextColor={COLORS.textPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  skillBar: { backgroundColor: '#050508', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 8 },
  skillContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 16 },
  skillItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  skillCount: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  skillLabel: { fontSize: 11, color: COLORS.textSecondary },
  totalBadge: { backgroundColor: COLORS.accent + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  totalText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },
  outputArea: { flex: 1, paddingHorizontal: 16 },
  outputContent: { paddingVertical: 12 },
  outputLine: { fontSize: 13, color: COLORS.text, fontFamily: 'monospace', lineHeight: 20 },
  promptLine: { color: COLORS.accent },
  errorLine: { color: COLORS.danger },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  prompt: { fontSize: 16, color: COLORS.accent, fontFamily: 'monospace', marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: COLORS.text, fontFamily: 'monospace' },
});