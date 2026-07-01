import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

export default function ChatBubble({ message, onCopy, onBookmark, onEdit, onDelete, onPreview, onFootnote }) {
  const isAI = message.role === 'assistant';
  const isCode = message.content?.includes('```') || message.content?.includes('function') || message.content?.includes('const ');
  const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/g, '').replace(/```/g, '');
        return (
          <View key={i} style={styles.codeBlock}>
            <View style={styles.codeHeader}>
              <Text style={styles.codeLang}>CODE</Text>
              <TouchableOpacity onPress={() => onCopy?.(code)} style={styles.codeCopyBtn}>
                <Feather name="copy" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.codeText}>{code}</Text>
            {code.includes('<html') || code.includes('<!DOCTYPE') ? (
              <TouchableOpacity style={styles.previewBtn} onPress={() => onPreview?.(code)}>
                <Feather name="eye" size={14} color={COLORS.accent} />
                <Text style={styles.previewText}>Preview</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      }
      return <Text key={i} style={[styles.contentText, isAI ? styles.aiText : styles.userText]}>{part}</Text>;
    });
  };

  return (
    <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
      {isAI && (
        <View style={styles.aiHeader}>
          <Feather name="cpu" size={11} color={COLORS.modelColors.research} />
          <Text style={styles.aiName}>REYYY</Text>
        </View>
      )}
      <View style={styles.content}>
        {renderContent(message.content)}
      </View>
      <View style={styles.footer}>
        <Text style={styles.timestamp}>{timestamp}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onCopy?.(message.content)} style={styles.actionBtn}>
            <Feather name="copy" size={13} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onBookmark?.(message)} style={styles.actionBtn}>
            <Feather name="bookmark" size={13} color={message.bookmarked ? COLORS.warning : COLORS.textSecondary} />
          </TouchableOpacity>
          {!isAI && (
            <>
              <TouchableOpacity onPress={() => onEdit?.(message)} style={styles.actionBtn}>
                <Feather name="edit" size={13} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete?.(message)} style={styles.actionBtn}>
                <Feather name="trash-2" size={13} color={COLORS.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 8, marginVertical: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderLeftWidth: 3, borderLeftColor: COLORS.modelColors.research },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.accent },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  aiName: { fontSize: 10, fontWeight: '600', color: COLORS.modelColors.research },
  content: {},
  contentText: { fontSize: 14, lineHeight: 20 },
  aiText: { color: COLORS.text },
  userText: { color: '#fff' },
  codeBlock: { backgroundColor: '#050508', borderRadius: 6, padding: 10, marginVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  codeLang: { fontSize: 10, fontWeight: '600', color: COLORS.accent, letterSpacing: 1 },
  codeCopyBtn: { padding: 4 },
  codeText: { fontSize: 11, color: COLORS.text, fontFamily: 'monospace', lineHeight: 16 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: COLORS.accent + '20', borderRadius: 4, alignSelf: 'flex-start' },
  previewText: { fontSize: 11, fontWeight: '500', color: COLORS.accent },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  timestamp: { fontSize: 10, color: COLORS.textPlaceholder },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 2 },
});